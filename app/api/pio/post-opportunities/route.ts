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
import { aiErrorPayload } from "@/lib/ai-result"
import { generatePostOpportunities, flattenOpportunities } from "@/lib/post-generator/engine"
import { opportunityFingerprint, topicKey } from "@/lib/post-generator/rank-opportunities"
import { DEFAULT_DAILY_RECOMMENDATION_LIMIT } from "@/lib/post-generator/types"
import { runTomorrowBriefing } from "@/lib/post-generator/tomorrow-briefing"
import {
  mergeRetainedBriefingItems,
  parseRetainBriefingInput,
} from "@/lib/post-generator/briefing-stability"
import type { GeneratorRequest } from "@/lib/post-generator/types"

export const maxDuration = 90

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

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-opportunities-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  if (!localPreview && !checkRateLimit(`pio-tomorrow-briefing:${session.email}`, 12, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many briefing requests this hour." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const serviceZips = parseServiceZips(
      Array.isArray(body.serviceZips)
        ? body.serviceZips.join(" ")
        : String(body.serviceZips || body.zips || "")
    )
    const county = String(body.county || "").trim()
    const city = String(body.city || "").trim()
    const state = String(body.state || "").trim()
    const agencyName = String(body.agencyName || "").trim()
    const serviceAreaType = ["city", "county", "state"].includes(String(body.serviceAreaType))
      ? String(body.serviceAreaType)
      : county && !city
        ? "county"
        : "city"
    const hasServiceArea =
      serviceAreaType === "state" ||
      (serviceAreaType === "county" && Boolean(county)) ||
      (serviceAreaType === "city" && Boolean(city))

    if (!state || !hasServiceArea) {
      return NextResponse.json(
        {
          error:
            serviceAreaType === "city"
              ? "Add state and city/township/borough in Agency Settings so recommendations match your coverage area."
              : "Add your service area in Agency Settings so recommendations match your coverage area.",
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

    const todayIso =
      typeof body.todayIso === "string" && body.todayIso
        ? body.todayIso
        : new Date().toISOString().slice(0, 10)
    const recentTopicKeys = Array.isArray(body.recentTopicKeys)
      ? body.recentTopicKeys.map(String)
      : []
    const dismissedIds = Array.isArray(body.dismissedIds) ? body.dismissedIds.map(String) : []

    const briefing = await runTomorrowBriefing({
      agencyName: agencyName || "the public safety agency",
      agencyType,
      agencyTypeOther,
      city,
      county,
      state,
      serviceAreaType,
      serviceZips,
      todayIso,
      recentTopicKeys,
      dismissedTitles: dismissedIds,
    })

    if (!briefing.ok) {
      return NextResponse.json(aiErrorPayload(briefing.reason, briefing.detail), { status: 503 })
    }

    const retained = parseRetainBriefingInput(body.retainBriefing)
    const mergedOpportunities =
      briefing.data.opportunities.length >= DEFAULT_DAILY_RECOMMENDATION_LIMIT
        ? briefing.data.opportunities.slice(0, DEFAULT_DAILY_RECOMMENDATION_LIMIT)
        : mergeRetainedBriefingItems(
            briefing.data.opportunities,
            retained,
            dismissedIds
          )

    const req: GeneratorRequest = {
      agencyName,
      agencyType,
      agencyTypeOther,
      city,
      county,
      state,
      serviceZips,
      todayIso,
      dismissedIds,
      usedContentIds: Array.isArray(body.usedContentIds) ? body.usedContentIds : [],
      postedFingerprints: Array.isArray(body.postedFingerprints)
        ? body.postedFingerprints.map(String)
        : [],
      recentTopicKeys,
      savedIds: Array.isArray(body.savedIds) ? body.savedIds : [],
      externalOpportunities: mergedOpportunities,
      dailyLimit: DEFAULT_DAILY_RECOMMENDATION_LIMIT,
    }

    const result = generatePostOpportunities(req)

    if (briefing.data.noPostsRecommended) {
      result.noRecommendationReason =
        "No timely, verified, locally relevant posts were found for tomorrow. SaferU will not recommend filler content."
      result.emptyState = result.topRecommended.length === 0 && result.couldPost.length === 0
    } else if (mergedOpportunities.length > 0) {
      result.selectionSummary = briefing.data.schedule
        ? `Tomorrow's posting plan is ready (${mergedOpportunities.length} verified recommendation${mergedOpportunities.length === 1 ? "" : "s"}).`
        : `${mergedOpportunities.length} verified recommendation${mergedOpportunities.length === 1 ? "" : "s"} for tomorrow.`
      result.noRecommendationReason = null
      result.emptyState = false
    }

    const opportunities = flattenOpportunities(result).map((opp) => ({
      ...opp,
      fingerprint: opportunityFingerprint(opp),
      topicKey: topicKey(opp),
    }))

    return NextResponse.json({
      urgent: result.urgent,
      recommendedToday: result.recommendedToday,
      planAhead: result.planAhead,
      topRecommended: result.topRecommended,
      couldPost: result.couldPost,
      uncertain: result.uncertain,
      fromSaferU: result.fromSaferU,
      emptyState: result.emptyState,
      noRecommendationReason: result.noRecommendationReason,
      selectionSummary: result.selectionSummary ?? null,
      rejectedCandidateCount: 0,
      generatedAt: result.generatedAt,
      opportunities,
      demo: false,
      pipelineVersion: "tomorrow-briefing-prompt-reset",
      briefingMarkdown: briefing.data.markdown,
      discoveryStats: {
        candidatesFound: mergedOpportunities.length,
        rankedAfterGate: mergedOpportunities.length,
        approvedAfterPipeline: mergedOpportunities.length,
      },
    })
  } catch (e) {
    console.error("Post opportunities error:", e)
    return NextResponse.json({ error: "Failed to generate post opportunities." }, { status: 500 })
  }
}
