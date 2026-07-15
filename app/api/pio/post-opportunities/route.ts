import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"
import { parseServiceZips } from "@/lib/local-ideas-ai"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { isDepartmentType } from "@/lib/department-types"
import { resolveMemberDepartment } from "@/lib/member-profile"
import { generatePostOpportunities, flattenOpportunities } from "@/lib/post-generator/engine"
import {
  scanExternalOpportunities,
  demoExternalOpportunities,
  type RoadImpactInput,
} from "@/lib/post-generator/external-scanner"
import { discoverLocalCurrentEventsWithAI } from "@/lib/post-generator/current-events-ai"
import { generateMessageFromOpportunity } from "@/lib/post-generator-ai"
import { getActiveCalendarEntries } from "@/lib/post-generator/calendar"
import {
  opportunityFingerprint,
  rankAndGateExternalOpportunities,
  topicKey,
} from "@/lib/post-generator/rank-opportunities"
import type { ExternalOpportunityInput, GeneratorRequest } from "@/lib/post-generator/types"

function calendarHolidayCandidates(todayIso: string): ExternalOpportunityInput[] {
  const date = new Date(`${todayIso}T12:00:00`)
  const year = date.getFullYear()
  return getActiveCalendarEntries(date)
    .filter((entry) => entry.category === "holiday_safety" && entry.month && entry.day)
    .slice(0, 2)
    .map((entry) => {
      const eventDate = `${year}-${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`
      return {
        id: `calendar-${entry.id}`,
        title: entry.label,
        summary: `${entry.label} is a timely communication opportunity for your community.`,
        category: entry.category,
        sourceLabel: "Seasonal Recommendation" as const,
        whyItMatters: `${entry.label} is relevant right now. A short, role-appropriate safety reminder helps keep residents informed.`,
        recommendedAction: "Share a brief, practical safety reminder tied to this observance.",
        recommendedPostTiming:
          entry.priority === "urgent"
            ? "Post as soon as possible."
            : entry.priority === "recommended_today"
              ? "Post today or tomorrow morning."
              : "Plan to post within the next few days.",
        priority: entry.priority === "urgent" ? "urgent" : entry.priority,
        signals: entry.signals,
        sourceName: "SaferU seasonal calendar",
        eventStart: eventDate,
        eventEnd: eventDate,
        verifiedFacts: [`${entry.label} is observed around ${eventDate}.`],
        publicCallToAction: ["Share one practical safety step residents can take."],
        doNotClaim: ["Do not invent local incidents, closures, or emergencies."],
        confidenceLevel: "medium",
      } satisfies ExternalOpportunityInput
    })
}

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive, localPreview] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
    isLocalPreviewServer(),
  ])
  if (!stripePaid && !trialActive && !localPreview) {
    return NextResponse.json({ error: "Press Center subscription required" }, { status: 403 })
  }

  if (!checkRateLimit(`pio-opportunities:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }
  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-opportunities-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const state = String(body.state || "").trim()
    const city = String(body.city || "").trim()
    const agencyName = String(body.agencyName || "").trim()
    const serviceZips = parseServiceZips(
      Array.isArray(body.serviceZips)
        ? body.serviceZips.join(" ")
        : String(body.serviceZips || body.zips || "")
    )

    if (!state || serviceZips.length === 0) {
      return NextResponse.json(
        {
          error:
            "Add your state and at least one service ZIP code so recommendations match your coverage area.",
        },
        { status: 400 }
      )
    }

    const resolvedDept = await resolveMemberDepartment(session.email, {
      departmentType: body.departmentType || body.agencyType,
      departmentOther: body.departmentOther || body.agencyTypeOther,
    })
    const agencyType =
      resolvedDept.departmentType && isDepartmentType(resolvedDept.departmentType)
        ? resolvedDept.departmentType
        : isDepartmentType(String(body.agencyType || ""))
          ? String(body.agencyType)
          : "other"
    const agencyTypeOther = String(
      resolvedDept.departmentOther || body.agencyTypeOther || body.departmentOther || ""
    ).trim()

    await ensureContentLoaded()

    const roadImpacts: RoadImpactInput[] = Array.isArray(body.roadImpacts)
      ? (body.roadImpacts as unknown[])
          .map((item: unknown): RoadImpactInput | null => {
            if (!item || typeof item !== "object") return null
            const o = item as Record<string, unknown>
            const roadName = String(o.roadName || "").trim()
            const description = String(o.description || "").trim()
            if (!roadName || !description) return null
            return {
              id: o.id ? String(o.id) : undefined,
              roadName,
              description,
              startDate: o.startDate ? String(o.startDate) : undefined,
              endDate: o.endDate ? String(o.endDate) : undefined,
              detour: o.detour ? String(o.detour) : undefined,
              sourceName: o.sourceName ? String(o.sourceName) : undefined,
              sourceUrl: o.sourceUrl ? String(o.sourceUrl) : undefined,
            }
          })
          .filter((item): item is RoadImpactInput => Boolean(item))
      : []

    const todayIso =
      typeof body.todayIso === "string" && body.todayIso
        ? body.todayIso
        : new Date().toISOString().slice(0, 10)
    const postedFingerprints = Array.isArray(body.postedFingerprints)
      ? body.postedFingerprints.map(String)
      : []
    const recentTopicKeys = Array.isArray(body.recentTopicKeys)
      ? body.recentTopicKeys.map(String)
      : []

    const useDemo = Boolean(body.demo)
    let candidates: ExternalOpportunityInput[] = []
    if (useDemo) {
      candidates = demoExternalOpportunities(serviceZips)
    } else {
      try {
        candidates = await scanExternalOpportunities({
          serviceZips,
          roadImpacts,
        })
      } catch (error) {
        console.error("External opportunity scan failed:", error)
        candidates = []
      }

      candidates = [...candidates, ...calendarHolidayCandidates(todayIso)]

      const uniqueExisting = new Map(
        candidates.map((opp) => [opp.title.trim().toLowerCase(), opp])
      )
      const needed = Math.max(0, 4 - uniqueExisting.size)
      if (needed > 0) {
        const discovered = await discoverLocalCurrentEventsWithAI({
          state,
          city,
          serviceZips,
          needed,
          todayIso,
          agencyType,
          excludeTitles: [...uniqueExisting.values()].map((opp) => opp.title),
        })
        if (discovered.ok) {
          for (const opportunity of discovered.data) {
            const key = opportunity.title.trim().toLowerCase()
            if (!uniqueExisting.has(key)) uniqueExisting.set(key, opportunity)
          }
        } else {
          console.warn(
            "[post-opportunities] AI event discovery unavailable:",
            discovered.reason,
            discovered.detail || ""
          )
        }
      }
      candidates = [...uniqueExisting.values()]
    }

    const ranked = rankAndGateExternalOpportunities(candidates, {
      agencyType,
      todayIso,
      postedFingerprints,
      recentTopicKeys,
      // Demo fixtures may omit source URLs; live path enforces trust.
      requireTrustedSource: !useDemo,
    })

    const messagingAngles = new Map(
      ranked.map((opp) => [opp.id, opp.internalScores.messagingAngle])
    )
    const externalOpportunities: ExternalOpportunityInput[] = ranked.map(
      ({ internalScores: _scores, ...rest }) => rest
    )

    const req: GeneratorRequest = {
      agencyName,
      agencyType,
      agencyTypeOther,
      city,
      state,
      serviceZips,
      todayIso,
      dismissedIds: Array.isArray(body.dismissedIds) ? body.dismissedIds : [],
      usedContentIds: Array.isArray(body.usedContentIds) ? body.usedContentIds : [],
      postedFingerprints,
      recentTopicKeys,
      savedIds: Array.isArray(body.savedIds) ? body.savedIds : [],
      externalOpportunities,
      dailyLimit: 4,
    }

    const result = generatePostOpportunities(req)
    const dailyOpportunities = [
      ...result.urgent,
      ...result.recommendedToday,
      ...result.planAhead,
      ...result.fromSaferU,
    ]

    await Promise.all(
      dailyOpportunities.map(async (opportunity) => {
        if (opportunity.curatedMessage) return
        const generated = await generateMessageFromOpportunity(
          opportunity.title,
          opportunity.whyItMatters,
          opportunity.verifiedFacts ?? [],
          opportunity.doNotClaim ?? [],
          opportunity.publicCallToAction ?? [],
          opportunity.recommendedAction,
          agencyName,
          city,
          state,
          opportunity.summary,
          opportunity.sourceLabel,
          agencyType,
          agencyTypeOther,
          messagingAngles.get(opportunity.id)
        )
        opportunity.curatedMessage = generated.ok
          ? generated.data
          : [
              `Heads up, ${city || "residents"}:`,
              opportunity.summary || opportunity.title,
              ...(opportunity.verifiedFacts ?? []).slice(0, 2),
              ...(opportunity.publicCallToAction ?? []).slice(0, 1),
            ]
              .filter(Boolean)
              .join(" ")
      })
    )

    const opportunities = flattenOpportunities(result).map((opp) => ({
      ...opp,
      fingerprint: opportunityFingerprint(opp),
      topicKey: topicKey(opp),
    }))

    return NextResponse.json({
      urgent: result.urgent,
      recommendedToday: result.recommendedToday,
      planAhead: result.planAhead,
      fromSaferU: result.fromSaferU,
      emptyState: result.emptyState,
      generatedAt: result.generatedAt,
      opportunities,
      demo: useDemo,
    })
  } catch (e) {
    console.error("Post opportunities error:", e)
    return NextResponse.json({ error: "Failed to generate post opportunities." }, { status: 500 })
  }
}
