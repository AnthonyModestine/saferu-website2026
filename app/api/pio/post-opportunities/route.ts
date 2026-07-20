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
import { discoverExpandedPublicSafetyTopics } from "@/lib/post-generator/citizen-safety-discovery"
import { discoverLocalWeatherMediaTopics } from "@/lib/post-generator/weather-media-discovery"
import { getActiveCalendarEntries } from "@/lib/post-generator/calendar"
import { isValidHolidayRecommendation } from "@/lib/post-generator/holiday-validation"
import { normalizeCandidates } from "@/lib/post-generator/candidate-normalize"
import {
  hasRecommendablePost,
  hasTopRecommended,
  opportunityFingerprint,
  rankAndGateExternalOpportunities,
  topicKey,
} from "@/lib/post-generator/rank-opportunities"
import { discoverStrongRecommendedTopics } from "@/lib/post-generator/deep-recommended-search"
import { discoverCreatedContentFollowups } from "@/lib/post-generator/content-followup-ai"
import { runProductionPostPipeline } from "@/lib/post-generator/production-pipeline"
import { agencyRoleBrief, agencyTypeLabel } from "@/lib/post-generator/agency-relevance"
import { buildAndSaveAgencySourceCatalog } from "@/lib/post-generator/agency-source-catalog"
import {
  getAgencyPreferenceProfile,
  preferenceBriefForPrompts,
} from "@/lib/agency-recommendation-preferences"
import type {
  ExternalOpportunityInput,
  GeneratorRequest,
  RecentAgencyContent,
} from "@/lib/post-generator/types"

/** Deep search can take multiple web-search passes — allow up to ~90s on Vercel. */
export const maxDuration = 90

function calendarHolidayCandidates(todayIso: string): ExternalOpportunityInput[] {
  const date = new Date(`${todayIso}T12:00:00`)
  const year = date.getFullYear()
  return getActiveCalendarEntries(date)
    .filter((entry) => entry.category === "holiday_safety" && entry.month && entry.day)
    .filter((entry) =>
      isValidHolidayRecommendation(
        {
          id: entry.id,
          label: entry.label,
          month: entry.month,
          day: entry.day,
          category: entry.category,
        },
        todayIso,
        7
      ).ok
    )
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
    const serviceZips = parseServiceZips(
      Array.isArray(body.serviceZips)
        ? body.serviceZips.join(" ")
        : String(body.serviceZips || body.zips || "")
    )
    let county = String(body.county || "").trim()
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
      (serviceAreaType === "city" && Boolean(city) && Boolean(county))

    if (!state || !hasServiceArea) {
      return NextResponse.json(
        {
          error:
            serviceAreaType === "city"
              ? "Add state, city/township/borough, and county in Agency Settings so recommendations match your coverage area."
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
    await buildAndSaveAgencySourceCatalog({
      memberEmail: session.email,
      agencyName,
      state,
      city,
      county,
      serviceAreaType,
      agencyOfficialUrls: Array.isArray(body.agencyOfficialUrls)
        ? body.agencyOfficialUrls.map(String).slice(0, 20)
        : [],
    })

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
    const preferenceProfile = await getAgencyPreferenceProfile(session.memberId)
    const preferenceBrief = preferenceBriefForPrompts(preferenceProfile)
    const recentCreatedContent: RecentAgencyContent[] = Array.isArray(body.recentCreatedContent)
      ? (body.recentCreatedContent as unknown[])
          .map((item): RecentAgencyContent | null => {
            if (!item || typeof item !== "object") return null
            const value = item as Record<string, unknown>
            const kind = String(value.kind || "")
            if (!["press_release", "video_request", "event_campaign"].includes(kind)) return null
            const id = String(value.id || "").trim().slice(0, 120)
            const title = String(value.title || "").trim().slice(0, 200)
            const content = String(value.content || "").trim().slice(0, 2500)
            const createdAt = String(value.createdAt || "").trim().slice(0, 40)
            if (!id || !title || !content || !createdAt) return null
            return {
              id,
              kind: kind as RecentAgencyContent["kind"],
              title,
              content,
              createdAt,
              eventDate: value.eventDate ? String(value.eventDate).slice(0, 20) : undefined,
              agencyRole: value.agencyRole ? String(value.agencyRole).slice(0, 80) : undefined,
            }
          })
          .filter((item): item is RecentAgencyContent => Boolean(item))
          .slice(0, 18)
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
          state,
          city,
          county,
          serviceAreaType,
        })
      } catch (error) {
        console.error("External opportunity scan failed:", error)
        candidates = []
      }

      candidates = [...candidates, ...calendarHolidayCandidates(todayIso)]

      const uniqueExisting = new Map(
        candidates.map((opp) => [opp.title.trim().toLowerCase(), opp])
      )
      // Count DISTINCT topic families — not titles. Three heat alerts still count as 1 slot.
      const usedTopicFamilies = new Set(
        [...uniqueExisting.values()].map((opp) => topicKey(opp))
      )
      // Search broadly; strict scoring and final PIO validation will curate the few worth showing.
      const discoveryTarget = 12
      const slotsRemaining = () => Math.max(0, discoveryTarget - usedTopicFamilies.size)
      const addCandidate = (opportunity: ExternalOpportunityInput) => {
        const family = topicKey(opportunity)
        if (usedTopicFamilies.has(family)) return false
        const key = opportunity.title.trim().toLowerCase()
        if (uniqueExisting.has(key)) return false
        uniqueExisting.set(key, opportunity)
        usedTopicFamilies.add(family)
        return true
      }

      const nwsContext = candidates
        .filter(
          (opp) =>
            opp.sourceLabel === "Weather Alert" ||
            (opp.signals ?? []).some((s) =>
              /weather|heat|storm|flood|wind|winter|tornado/i.test(s)
            )
        )
        .map((opp) => ({
          title: opp.title,
          summary: opp.summary,
          signals: opp.signals,
        }))

      // Only pull TV/AccuWeather when NWS didn't already cover a weather topic family.
      const hasWeatherFamily = [...usedTopicFamilies].some((k) =>
        ["heat", "severe_weather", "flood", "winter"].includes(k)
      )
      const weatherMediaNeeded = Math.min(hasWeatherFamily ? 0 : 1, slotsRemaining())
      if (weatherMediaNeeded > 0) {
        const weatherMedia = await discoverLocalWeatherMediaTopics({
          state,
          city,
          county,
          serviceAreaType,
          serviceZips,
          agencyType,
          needed: weatherMediaNeeded,
          todayIso,
          nwsContext,
          excludeTitles: [...uniqueExisting.values()].map((opp) => opp.title),
        })
        if (weatherMedia.ok) {
          for (const opportunity of weatherMedia.data) addCandidate(opportunity)
        } else {
          console.warn(
            "[post-opportunities] Local weather media discovery unavailable:",
            weatherMedia.reason,
            weatherMedia.detail || ""
          )
        }
      }

      const activeSignals = [
        ...new Set([
          ...[...uniqueExisting.values()].flatMap((opp) => opp.signals ?? []).filter(Boolean),
          ...usedTopicFamilies,
        ]),
      ]

      const expandedNeeded = Math.min(5, slotsRemaining())
      if (expandedNeeded > 0) {
        const expandedTopics = await discoverExpandedPublicSafetyTopics({
          state,
          city,
          county,
          serviceAreaType,
          serviceZips,
          agencyType,
          needed: expandedNeeded,
          todayIso,
          activeSignals,
          excludeTitles: [...uniqueExisting.values()].map((opp) => opp.title),
        })
        if (expandedTopics.ok) {
          for (const opportunity of expandedTopics.data) addCandidate(opportunity)
        } else {
          console.warn(
            "[post-opportunities] Expanded public safety discovery unavailable:",
            expandedTopics.reason,
            expandedTopics.detail || ""
          )
        }
      }

      const needed = slotsRemaining()
      if (needed > 0) {
        const discovered = await discoverLocalCurrentEventsWithAI({
          state,
          city,
          county,
          serviceAreaType,
          serviceZips,
          needed,
          todayIso,
          agencyType,
          excludeTitles: [...uniqueExisting.values()].map((opp) => opp.title),
        })
        if (discovered.ok) {
          for (const opportunity of discovered.data) addCandidate(opportunity)
        } else {
          console.warn(
            "[post-opportunities] AI event discovery unavailable:",
            discovered.reason,
            discovered.detail || ""
          )
        }
      }
      candidates = [...uniqueExisting.values()]

      if (recentCreatedContent.length > 0) {
        const followups = await discoverCreatedContentFollowups({
          content: recentCreatedContent,
          agencyName,
          agencyType,
          agencyTypeOther,
          city,
          state,
          todayIso,
        })
        if (followups.ok) {
          // Let scoring compare a proactive follow-up against any live item in the
          // same family; do not discard the agency-created context prematurely.
          for (const opportunity of followups.data) {
            uniqueExisting.set(opportunity.title.trim().toLowerCase(), opportunity)
            usedTopicFamilies.add(topicKey(opportunity))
          }
          candidates = [...uniqueExisting.values()]
        } else {
          console.warn(
            "[post-opportunities] Created-content follow-up analysis unavailable:",
            followups.reason,
            followups.detail || ""
          )
        }
      }
    }

    const normalizedPreview = normalizeCandidates(candidates)
    console.info(
      "[post-opportunities] normalized candidates",
      Object.fromEntries(
        [...normalizedPreview.reduce((m, c) => m.set(c.sourceType, (m.get(c.sourceType) || 0) + 1), new Map())]
      )
    )

    const rankPrefs = {
      endorsedTopicKeys: preferenceProfile.endorsedTopicKeys,
      declinedTopicKeys: preferenceProfile.declinedTopicKeys,
      publishedTopicKeys: preferenceProfile.publishedTopicKeys,
    }

    let ranked = rankAndGateExternalOpportunities(candidates, {
      agencyType,
      agencyName,
      city,
      county,
      todayIso,
      postedFingerprints,
      recentTopicKeys,
      // Demo fixtures may omit source URLs; live path enforces trust.
      requireTrustedSource: !useDemo,
      ...rankPrefs,
    })

    // Deep search when ranking produced zero — empty is valid; do not hunt filler.
    // Also allow a single recovery pass later if the production pipeline wipes ranked
    // official items (e.g. evidence failure), so live alerts are not silently replaced
    // by SaferU curated-only briefings.
    const runDeepSearch = async (excludeTitles: string[]) => {
      const deep = await discoverStrongRecommendedTopics({
        state,
        city,
        county,
        serviceAreaType,
        serviceZips,
        agencyType,
        agencyName,
        todayIso,
        needed: 6,
        excludeTitles,
        activeSignals: [
          ...new Set([
            ...candidates.flatMap((opp) => opp.signals ?? []),
            ...ranked.map((opp) => topicKey(opp)),
          ]),
        ],
      })
      if (deep.ok && deep.data.length > 0) {
        candidates = [...candidates, ...deep.data]
        ranked = rankAndGateExternalOpportunities(candidates, {
          agencyType,
          agencyName,
          city,
          county,
          todayIso,
          postedFingerprints,
          recentTopicKeys,
          requireTrustedSource: true,
          ...rankPrefs,
        })
        console.info(
          `[post-opportunities] Deep search added ${deep.data.length} candidates; ` +
            `top_recommended=${hasTopRecommended(ranked)} recommendable=${hasRecommendablePost(ranked)}`
        )
        return true
      }
      console.warn(
        "[post-opportunities] Deep recommended search unavailable:",
        deep.ok ? "empty" : deep.reason,
        deep.ok ? "" : deep.detail || ""
      )
      return false
    }

    if (!useDemo && ranked.length === 0) {
      console.info(
        "[post-opportunities] No ranked recommendations — starting deep search passes."
      )
      await runDeepSearch(candidates.map((opp) => opp.title))
    }

    // Production architecture: retrieved evidence -> strategy -> writer -> quality gate.
    // This path is intentionally fail-closed. Demo fixtures remain deterministic.
    let pipelineSummary
    let pipelineDiagnostics
    const typeLabel = agencyTypeLabel(agencyType, agencyTypeOther)
    const pipelineContext = {
      agencyName: agencyName || "the public safety agency",
      agencyType,
      agencyTypeOther,
      agencyRoleProfile: agencyRoleBrief(agencyType),
      agencyVoiceProfile: `${typeLabel}: calm, credible, clear, professional, community-oriented, and appropriate to the agency's public-safety role.`,
      agencyServices: Array.isArray(body.agencyServices)
        ? body.agencyServices.map(String).slice(0, 30)
        : [],
      city,
      county,
      state,
      serviceAreaType,
      serviceZips,
      todayIso,
      localDateTime:
        typeof body.localDateTime === "string" && body.localDateTime
          ? body.localDateTime
          : new Date().toISOString(),
      timezone:
        typeof body.timezone === "string" && body.timezone
          ? body.timezone
          : "America/New_York",
      recentAgencyPosts: Array.isArray(body.recentAgencyPosts)
        ? body.recentAgencyPosts.slice(0, 30)
        : [],
      recentRecommendations: Array.isArray(body.recentRecommendations)
        ? body.recentRecommendations.slice(0, 30)
        : [],
      dismissedRecommendations: Array.isArray(body.dismissedIds)
        ? body.dismissedIds.slice(0, 50)
        : [],
      recentSaferUContent: recentCreatedContent,
      upcomingEvents: Array.isArray(body.upcomingEvents) ? body.upcomingEvents.slice(0, 30) : [],
      availableSaferUContent: Array.isArray(body.availableSaferUContent)
        ? body.availableSaferUContent.slice(0, 30)
        : [],
      recentSignals: [
        ...recentTopicKeys,
        ...preferenceProfile.endorsedTopicKeys.map((k) => `endorsed:${k}`),
      ],
      recentCommunicationPillars: Array.isArray(body.recentCommunicationPillars)
        ? body.recentCommunicationPillars.map(String).slice(0, 20)
        : [],
      knownActiveConditions: candidates
        .filter((candidate) => candidate.priority === "urgent")
        .slice(0, 10),
      excludedTopics: [
        ...(Array.isArray(body.dismissedIds) ? body.dismissedIds.map(String) : []),
        ...preferenceProfile.declinedTopicKeys,
        ...(preferenceBrief ? [preferenceBrief] : []),
      ],
    }
    const rankedBeforePipeline = ranked.length
    if (!useDemo && ranked.length > 0) {
      const pipeline = await runProductionPostPipeline(pipelineContext, ranked)
      ranked = pipeline.approved
      pipelineSummary = pipeline.stage1Summary
      pipelineDiagnostics = pipeline.diagnostics
      if (pipeline.diagnostics.usedDeterministicFallback) {
        console.warn(
          "[post-opportunities] Pipeline used deterministic verified fallback:",
          pipeline.diagnostics.fallbackReason,
          `approved=${pipeline.diagnostics.approvedCount}`
        )
      }
      // If evidence/stages wiped everything after ranking found official items,
      // attempt one recovery discovery pass (not filler — still goes through rank+pipeline).
      if (ranked.length === 0 && rankedBeforePipeline > 0) {
        console.warn(
          `[post-opportunities] Pipeline emptied ${rankedBeforePipeline} ranked item(s); attempting recovery discovery`
        )
        const recovered = await runDeepSearch([
          ...candidates.map((opp) => opp.title),
          ...pipeline.diagnostics.droppedAtEvidence.map((d) => d.id),
        ])
        if (recovered && ranked.length > 0) {
          const retry = await runProductionPostPipeline(pipelineContext, ranked)
          ranked = retry.approved
          pipelineSummary = retry.stage1Summary
          pipelineDiagnostics = {
            ...retry.diagnostics,
            fallbackReason:
              `${pipeline.diagnostics.fallbackReason || "pipeline_empty"};recovery_attempt`,
          }
        }
      }
    }

    const rankedBeforeSaferuFill = ranked.length
    const externalOpportunities: ExternalOpportunityInput[] = ranked.map(
      ({ internalScores: _scores, ...rest }) => rest
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
      dismissedIds: Array.isArray(body.dismissedIds) ? body.dismissedIds : [],
      usedContentIds: Array.isArray(body.usedContentIds) ? body.usedContentIds : [],
      postedFingerprints,
      recentTopicKeys,
      savedIds: Array.isArray(body.savedIds) ? body.savedIds : [],
      externalOpportunities,
      dailyLimit: 12,
    }

    const result = generatePostOpportunities(req)
    const dailyOpportunities = flattenOpportunities(result)

    // SaferU fallback content is already editorially approved. Any agency-specific
    // rewrite must still pass the same three production stages before replacing it.
    if (!useDemo && ranked.length === 0 && result.fromSaferU.length > 0) {
      const curatedCandidates = result.fromSaferU.map((opp) => ({
        id: opp.id,
        title: opp.title,
        summary: opp.summary,
        category: opp.category,
        sourceLabel: opp.sourceLabel,
        whyItMatters: opp.whyItMatters,
        surfacedReason: opp.surfacedReason,
        recommendedAction: opp.recommendedAction,
        recommendedPostTiming: opp.recommendedPostTiming,
        priority: opp.priority,
        signals: opp.signals ?? [],
        sourceName: "SaferU Content Library",
        verifiedFacts: [
          `SaferU's approved Content Library includes a post titled "${opp.title}".`,
          `Approved message: ${opp.curatedMessage || opp.curated?.message || opp.summary}`,
        ],
        publicCallToAction: ["Share the approved SaferU safety message."],
        doNotClaim: ["Do not invent a local incident, trend, alert, or emergency."],
        suggestedMessage: opp.curatedMessage,
        confidenceLevel: "high" as const,
        recommendationTier: "could_post" as const,
        jurisdictionFit: "own" as const,
        internalScores: {
          agencyRelevance: 75,
          geographicRelevance: 70,
          residentValue: 80,
          actionability: 75,
          urgency: 45,
          sourceTrust: 95,
          seasonalRelevance: 75,
          engagementPotential: 70,
          freshness: 70,
          composite: 74,
          pioRating: 4 as const,
          agencyFitReason: opp.whyItMatters,
          messagingAngle: "Provide useful prevention or education without implying a local incident.",
        },
      }))
      const curatedPipeline = await runProductionPostPipeline(pipelineContext, curatedCandidates)
      const approvedById = new Map(curatedPipeline.approved.map((opp) => [opp.id, opp]))
      for (const opportunity of result.fromSaferU) {
        const approved = approvedById.get(opportunity.id)
        if (!approved) continue
        opportunity.curatedMessage = approved.suggestedMessage
        opportunity.surfacedReason = approved.surfacedReason
        opportunity.communicationPillar = approved.communicationPillar
        opportunity.communicationGoal = approved.communicationGoal
        opportunity.whyNow = approved.whyNow
        opportunity.whyThisAgency = approved.whyThisAgency
        opportunity.whyThisCommunity = approved.whyThisCommunity
        opportunity.residentValue = approved.residentValue
        opportunity.relationshipValue = approved.relationshipValue
        opportunity.issuingAuthority = approved.issuingAuthority
        opportunity.supportingSources = approved.supportingSources
        opportunity.qualityGateStatus = approved.qualityGateStatus
      }
    }

    const opportunities = dailyOpportunities.map((opp) => ({
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
      generatedAt: result.generatedAt,
      opportunities,
      demo: useDemo,
      pipelineVersion: "three-stage-v1",
      pipelineSummary,
      pipelineDiagnostics,
      saferuFallbackOnly:
        !useDemo &&
        rankedBeforeSaferuFill === 0 &&
        result.fromSaferU.length > 0 &&
        result.topRecommended.length === 0 &&
        result.couldPost.length === 0,
    })
  } catch (e) {
    console.error("Post opportunities error:", e)
    return NextResponse.json({ error: "Failed to generate post opportunities." }, { status: 500 })
  }
}
