"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OpportunityCard } from "@/components/pio/opportunity-card"
import { useAgency } from "@/lib/agency-context"
import { useMemberSession } from "@/lib/use-member-session"
import { isLocalGuestPreviewClient } from "@/lib/local-preview"
import { pressCenterSignInUrl } from "@/lib/press-center-routes"
import { parseServiceZips } from "@/lib/local-ideas-ai"
import { generatePostOpportunities, flattenOpportunities } from "@/lib/post-generator/engine"
import { demoExternalOpportunities } from "@/lib/post-generator/external-scanner"
import { rankAndGateExternalOpportunities } from "@/lib/post-generator/rank-opportunities"
import { attachWeatherAlertGraphics } from "@/lib/pio-weather-graphic"
import {
  applyHolidayAiContent,
  attachHolidayGraphics,
  holidayShowcaseApiPayload,
  isHolidayOpportunity,
} from "@/lib/pio-holiday-graphic"
import {
  loadHolidayShowcaseCache,
  saveHolidayShowcaseCache,
} from "@/lib/pio-holiday-showcase-cache"
import type { GeneratorResult, PostOpportunity } from "@/lib/post-generator/types"
import { getPioHistoryItems } from "@/lib/pio-history-store"
import { getPioEvents } from "@/lib/pio-events-store"
import {
  cacheOpportunityResult,
  BRIEFING_CACHE_EVENT,
  dismissOpportunity,
  isResultFromToday,
  loadDailyOpportunityHistory,
  saveOpportunityForLater,
  stashOpportunityForUse,
} from "@/lib/post-generator/opportunity-store"
import {
  isUsableCachedBriefing,
  prefetchPostOpportunities,
} from "@/lib/post-generator/prefetch-briefing"

const EMPTY_RESULT: GeneratorResult = {
  urgent: [],
  recommendedToday: [],
  planAhead: [],
  topRecommended: [],
  couldPost: [],
  uncertain: [],
  fromSaferU: [],
  emptyState: true,
  demo: true,
  generatedAt: "",
}

function resultFromCached(
  opportunities: PostOpportunity[],
  generatedAt: string
): GeneratorResult {
  const current = opportunities.filter((opp) => opp.opportunitySource !== "saferu_curated")
  const curated = opportunities.filter((opp) => opp.opportunitySource === "saferu_curated")
  const topRecommended = current
    .filter((opp) => (opp.recommendationTier || "top_recommended") === "top_recommended")
    .slice(0, 6)
  const couldPost = current.filter((opp) => opp.recommendationTier === "could_post").slice(0, 6)
  const uncertain: PostOpportunity[] = []
  const dailySet = [...topRecommended, ...couldPost]
  const saferuSet = curated.slice(0, 2)
  return {
    urgent: dailySet.filter((opp) => opp.priority === "urgent"),
    recommendedToday: dailySet.filter(
      (opp) => opp.priority === "recommended_today" && opp.opportunitySource !== "saferu_curated"
    ),
    planAhead: dailySet.filter(
      (opp) =>
        (opp.priority === "plan_ahead" || opp.priority === "optional") &&
        opp.opportunitySource !== "saferu_curated"
    ),
    topRecommended,
    couldPost,
    uncertain,
    fromSaferU: saferuSet,
    emptyState:
      topRecommended.length === 0 &&
      couldPost.length === 0 &&
      uncertain.length === 0 &&
      saferuSet.length === 0,
    demo: false,
    generatedAt,
  }
}

function serviceAreaLabel(settings: {
  serviceAreaType: "city" | "county" | "state"
  city: string
  county: string
  state: string
}): string {
  const state = settings.state.trim()
  const city = settings.city.trim()
  const county = settings.county.trim()
  if (settings.serviceAreaType === "state") return state || "statewide"
  if (settings.serviceAreaType === "county") {
    if (county && state) return `${county}, ${state}`
    return county || state || "county-wide"
  }
  if (city && county && state) return `${city}, ${county}, ${state}`
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (county) return county
  if (state) return state
  return "your coverage area"
}

export default function PostGeneratorPage() {
  const router = useRouter()
  const { settings, locationReady, locationMissing } = useAgency()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const [localGuestPreview, setLocalGuestPreview] = useState(false)
  const guest = localGuestPreview || (!sessionLoading && !member)

  const [result, setResult] = useState<GeneratorResult>(EMPTY_RESULT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [discoveryStats, setDiscoveryStats] = useState<{
    candidatesFound?: number
    rankedAfterGate?: number
    approvedAfterPipeline?: number
  } | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const autoLoadedRef = useRef(false)

  useEffect(() => {
    setLocalGuestPreview(isLocalGuestPreviewClient())
  }, [])

  const agencyName = settings.agencyName || "Your Agency"

  async function applyCachedBriefing(): Promise<boolean> {
    const history = loadDailyOpportunityHistory()
    const cached = history.lastResult
    if (
      !cached ||
      !isResultFromToday(cached.generatedAt) ||
      !isUsableCachedBriefing(cached.opportunities)
    ) {
      return false
    }
    const opportunities = [...cached.opportunities]
    await hydrateOpportunityGraphics(opportunities)
    setResult(resultFromCached(opportunities, cached.generatedAt))
    setIsDemo(false)
    return true
  }

  async function hydrateOpportunityGraphics(opportunities: PostOpportunity[]) {
    await attachWeatherAlertGraphics(opportunities, {
      logoUrl: settings.logoUrl,
      agencyName,
    })
    await attachHolidayGraphics(opportunities, {
      logoUrl: settings.logoUrl,
      agencyName,
    })
    const holiday = opportunities.find(isHolidayOpportunity)
    if (!holiday) return

    const cached = await loadHolidayShowcaseCache(agencyName, settings.logoUrl)
    const cachedHoliday = cached?.opportunities.find((opp) => opp.id === holiday.id)
    if (cached?.aiReady && cachedHoliday?.graphicUrl?.startsWith("data:")) {
      Object.assign(holiday, cachedHoliday)
      return
    }
    if (guest || sessionLoading) return

    try {
      const res = await fetch("/api/pio/holiday-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: settings.agencyName,
          city: settings.city,
          state: settings.state,
          includeBackgrounds: true,
          holidays: holidayShowcaseApiPayload([holiday]),
        }),
      })
      if (!res.ok) return

      const data = await res.json()
      const backgrounds = (data.backgrounds as Record<string, string> | undefined) ?? {}
      const enhanced = await applyHolidayAiContent(
        [holiday],
        (data.messages as Record<string, string>) ?? {},
        backgrounds,
        { logoUrl: settings.logoUrl, agencyName }
      )
      await saveHolidayShowcaseCache({
        agencyName,
        logoUrl: settings.logoUrl,
        opportunities: enhanced,
        aiReady: Boolean(backgrounds[holiday.id]),
      })
    } catch (err) {
      console.error("Daily holiday AI graphic failed:", err)
    }
  }

  const runClientDemo = useCallback(async () => {
    const history = loadDailyOpportunityHistory()
    const stateVal = settings.state.trim() || "TX"
    const rankedDemo = rankAndGateExternalOpportunities(demoExternalOpportunities([]), {
      agencyType: settings.agencyType,
      agencyName: settings.agencyName || "Demo Township Police Department",
      city: settings.city || "San Saba",
      county: settings.county,
      todayIso: new Date().toISOString().slice(0, 10),
      postedFingerprints: history.postedFingerprints,
      recentTopicKeys: history.recentTopicKeys,
      requireTrustedSource: false,
    }).map(({ internalScores: _scores, ...rest }) => rest)
    const demo = generatePostOpportunities({
      agencyName: settings.agencyName || "Demo Township Police Department",
      agencyType: settings.agencyType,
      agencyTypeOther: settings.agencyTypeOther,
      city: settings.city || "San Saba",
      county: settings.county,
      state: stateVal,
      serviceZips: parseServiceZips(settings.serviceZips),
      dismissedIds: history.dismissedIds,
      usedContentIds: history.usedContentIds,
      postedFingerprints: history.postedFingerprints,
      recentTopicKeys: history.recentTopicKeys,
      externalOpportunities: rankedDemo,
      dailyLimit: 4,
    })
    const flat = flattenOpportunities(demo)
    await hydrateOpportunityGraphics(flat)
    setResult({ ...demo })
    cacheOpportunityResult(flat, demo.generatedAt)
    setIsDemo(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.agencyName,
    settings.agencyType,
    settings.agencyTypeOther,
    settings.city,
    settings.county,
    settings.logoUrl,
    settings.state,
    agencyName,
    guest,
    sessionLoading,
  ])

  useEffect(() => {
    if (!guest) return
    void runClientDemo()
  }, [guest, runClientDemo])

  useEffect(() => {
    if (sessionLoading || guest || autoLoadedRef.current) return
    if (!locationReady) return

    autoLoadedRef.current = true
    void (async () => {
      try {
        if (await applyCachedBriefing()) return
        const count = await prefetchPostOpportunities({ settings, isPaid: true })
        if (count > 0 && (await applyCachedBriefing())) return
        await loadOpportunities()
      } catch (err) {
        console.error("Auto briefing load failed:", err)
        setError("Could not load recommendations. Try Generate again.")
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, guest, locationReady])

  useEffect(() => {
    if (guest) return
    const onCacheUpdated = () => {
      void applyCachedBriefing()
    }
    window.addEventListener(BRIEFING_CACHE_EVENT, onCacheUpdated)
    return () => window.removeEventListener(BRIEFING_CACHE_EVENT, onCacheUpdated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest])

  async function loadOpportunities() {
    if (!locationReady) {
      setError("Set your state and a city or county in Agency Settings first.")
      return
    }

    setLoading(true)
    setError(null)

    const history = loadDailyOpportunityHistory()
    const recentCreatedContent = [
      ...getPioHistoryItems().slice(0, 10).map((item) => ({
        id: item.id,
        kind: item.format === "Video Request" ? "video_request" : "press_release",
        title: item.title,
        content: item.content,
        createdAt: item.date,
      })),
      ...getPioEvents()
        .filter((event) => event.status === "generated" || event.posts.length > 0)
        .slice(0, 8)
        .map((event) => ({
          id: event.id,
          kind: "event_campaign" as const,
          title: event.title,
          content: [
            event.description,
            event.eventType,
            event.audienceGoals,
            ...event.posts.slice(0, 3).map((post) => post.message),
          ]
            .filter(Boolean)
            .join("\n"),
          createdAt: event.createdAt,
          eventDate: event.eventDate,
          agencyRole: event.hostingRole,
        })),
    ]

    if (guest) {
      try {
        await runClientDemo()
      } catch (err) {
        console.error("Guest demo briefing failed:", err)
        setError("Something went wrong preparing your briefing. Try Generate again.")
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const res = await fetch("/api/pio/post-opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: settings.agencyName,
          agencyType: settings.agencyType,
          agencyTypeOther: settings.agencyTypeOther,
          serviceAreaType: settings.serviceAreaType,
          city: settings.city,
          county: settings.county,
          state: settings.state.trim(),
          serviceZips: parseServiceZips(settings.serviceZips),
          dismissedIds: history.dismissedIds,
          usedContentIds: history.usedContentIds,
          postedFingerprints: history.postedFingerprints,
          recentTopicKeys: history.recentTopicKeys,
          savedIds: history.savedIds,
          recentCreatedContent,
        }),
      })
      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        setError("Could not reach the server. Try again.")
        return
      }
      if (!res.ok) {
        setError(String(data.error || "Could not generate recommendations."))
        return
      }

      const opportunities = (data.opportunities as PostOpportunity[]) || []
      // Canvas weather/public-works graphics must hydrate onto the same objects the
      // UI renders. API buckets are separate JSON clones of `opportunities`.
      await hydrateOpportunityGraphics(opportunities)
      const byId = new Map(opportunities.map((opp) => [opp.id, opp]))
      const withGraphics = (list: PostOpportunity[] | undefined) =>
        (list ?? []).map((opp) => byId.get(opp.id) ?? opp)
      const next: GeneratorResult = {
        urgent: withGraphics(data.urgent as PostOpportunity[] | undefined),
        recommendedToday: withGraphics(
          data.recommendedToday as PostOpportunity[] | undefined
        ),
        planAhead: withGraphics(data.planAhead as PostOpportunity[] | undefined),
        topRecommended: withGraphics(
          data.topRecommended as PostOpportunity[] | undefined
        ),
        couldPost: withGraphics(data.couldPost as PostOpportunity[] | undefined),
        uncertain: [],
        fromSaferU: withGraphics(data.fromSaferU as PostOpportunity[] | undefined),
        emptyState: Boolean(data.emptyState),
        noRecommendationReason:
          typeof data.noRecommendationReason === "string" ? data.noRecommendationReason : null,
        selectionSummary:
          typeof data.selectionSummary === "string" ? data.selectionSummary : undefined,
        rejectedCandidateCount:
          typeof data.rejectedCandidateCount === "number"
            ? data.rejectedCandidateCount
            : undefined,
        demo: Boolean(data.demo),
        generatedAt: String(data.generatedAt || new Date().toISOString()),
      }
      setResult(next)
      cacheOpportunityResult(opportunities, next.generatedAt)
      setIsDemo(Boolean(data.demo))
      setDiscoveryStats(
        data.discoveryStats && typeof data.discoveryStats === "object"
          ? (data.discoveryStats as {
              candidatesFound?: number
              rankedAfterGate?: number
              approvedAfterPipeline?: number
            })
          : null
      )
      if (data.pipelineDiagnostics) {
        console.info("[AI Post Generator] pipelineDiagnostics", data.pipelineDiagnostics)
      }
    } catch (err) {
      console.error("Load opportunities failed:", err)
      setError("Something went wrong. Try Generate again.")
    } finally {
      setLoading(false)
    }
  }

  function handleUse(opp: PostOpportunity) {
    stashOpportunityForUse(opp)
    router.push("/pio-tool/ideas/use")
  }

  async function handleGenerate(opp: PostOpportunity) {
    if (guest) return
    setGeneratingId(opp.id)
    try {
      const res = await fetch("/api/pio/customize-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          title: opp.title,
          summary: opp.summary,
          sourceLabel: opp.sourceLabel,
          whyItMatters: opp.whyItMatters,
          verifiedFacts: opp.verifiedFacts ?? [],
          publicCallToAction: opp.publicCallToAction ?? [],
          doNotClaim: opp.doNotClaim ?? [],
          recommendedAction: opp.recommendedAction,
          agencyName: settings.agencyName,
          agencyType: settings.agencyType,
          agencyTypeOther: settings.agencyTypeOther,
          city: settings.city,
          state: settings.state,
          messagingAngle: opp.whyThisAgency || opp.residentValue || "",
          jurisdictionFit: opp.jurisdictionFit,
        }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        const withMessage = { ...opp, curatedMessage: data.message }
        stashOpportunityForUse(withMessage)
        router.push("/pio-tool/ideas/use")
      }
    } finally {
      setGeneratingId(null)
    }
  }

  function handleDismiss(opp: PostOpportunity) {
    dismissOpportunity(opp.id)
    void fetch("/api/pio/recommendation-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "decline",
        opportunityId: opp.id,
        title: opp.title,
        category: opp.category,
        sourceLabel: opp.sourceLabel,
        signals: opp.signals ?? [],
        agencyName: settings.agencyName,
      }),
    }).catch(() => {})
    setResult((prev) => ({
      ...prev,
      urgent: prev.urgent.filter((o) => o.id !== opp.id),
      recommendedToday: prev.recommendedToday.filter((o) => o.id !== opp.id),
      planAhead: prev.planAhead.filter((o) => o.id !== opp.id),
      topRecommended: (prev.topRecommended ?? []).filter((o) => o.id !== opp.id),
      couldPost: (prev.couldPost ?? []).filter((o) => o.id !== opp.id),
      uncertain: (prev.uncertain ?? []).filter((o) => o.id !== opp.id),
      fromSaferU: prev.fromSaferU.filter((o) => o.id !== opp.id),
    }))
  }

  function handleSave(opp: PostOpportunity) {
    saveOpportunityForLater(opp)
    void fetch("/api/pio/recommendation-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "endorse",
        opportunityId: opp.id,
        title: opp.title,
        category: opp.category,
        sourceLabel: opp.sourceLabel,
        signals: opp.signals ?? [],
        agencyName: settings.agencyName,
      }),
    }).catch(() => {})
  }

  const liveRecommendations = [
    ...(result.topRecommended ?? []),
    ...(result.couldPost ?? []),
    ...((result.topRecommended ?? []).length === 0 && (result.couldPost ?? []).length === 0
      ? [...result.urgent, ...result.recommendedToday, ...result.planAhead]
      : []),
  ].filter((opp, index, all) => all.findIndex((item) => item.id === opp.id) === index)

  const saferuLibrary = (result.fromSaferU ?? []).filter(
    (opp, index, all) => all.findIndex((item) => item.id === opp.id) === index
  )

  const hasLive = liveRecommendations.length > 0
  const hasSaferu = saferuLibrary.length > 0
  const hasRun = Boolean(result.generatedAt)
  const area = serviceAreaLabel(settings)

  return (
    <div className="mx-auto max-w-[960px] space-y-6 pb-10">
      <div>
        <Link
          href="/pio-tool"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#0f1c3f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#7C5CFC]" />
              <h1 className="text-2xl font-bold tracking-tight text-[#0f1c3f] sm:text-3xl">
                AI Post Generator
              </h1>
            </div>
            <p className="mt-1.5 max-w-xl text-sm text-[#7a8ab0]">
              Live community updates (weather, traffic, laws, scams) plus ready-made SaferU safety
              posts — shown separately.
              {locationReady ? (
                <>
                  {" "}
                  ·{" "}
                  <Link href="/pio-tool/settings" className="text-[#2563EB] hover:underline">
                    {area}
                  </Link>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || !locationReady}
              onClick={() => void loadOpportunities()}
              className="border-[#C4B5FD] bg-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {!locationReady && (
        <div className="rounded-2xl border border-[#e2e8f5] bg-white px-5 py-4 text-sm text-[#475569]">
          Finish{" "}
          <Link href="/pio-tool/settings" className="font-semibold text-[#2563EB] hover:underline">
            Agency Settings
          </Link>{" "}
          before generating
          {locationMissing.length > 0 ? (
            <>
              {" "}
              — still needed: <span className="font-semibold">{locationMissing.join(", ")}</span>
            </>
          ) : null}
          . City agencies need agency type, state, and city (county is optional but recommended).
          {guest ? (
            <>
              {" "}
              <Link
                href={pressCenterSignInUrl()}
                className="font-semibold text-[#2563EB] hover:underline"
              >
                Sign in
              </Link>{" "}
              for live analysis.
            </>
          ) : null}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isDemo && hasLive && (
        <p className="text-xs font-medium text-[#7a8ab0]">
          Sample briefing — sign in for live analysis tied to your area.
        </p>
      )}

      {loading ? (
        <div className="rounded-3xl border border-dashed border-[#c7d2fe] bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] px-6 py-12 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#7C5CFC]" />
          <p className="mt-3 text-base font-semibold text-[#0f1c3f]">Finding something useful…</p>
          <p className="mt-1 text-sm text-[#7a8ab0]">This can take about a minute.</p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0f1c3f]">Community updates</h2>
              <p className="text-sm text-[#7a8ab0]">
                Weather, road closures, new laws, FBI scam alerts, and other timely items for your
                area — sourced from official and verified channels.
              </p>
            </div>

            {hasLive ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {liveRecommendations.map((opp) => (
                  <li key={opp.id}>
                    <OpportunityCard
                      opportunity={opp}
                      onUse={handleUse}
                      onGenerate={
                        generatingId === opp.id ? undefined : (o) => void handleGenerate(o)
                      }
                      onSave={handleSave}
                      onDismiss={handleDismiss}
                    />
                    {generatingId === opp.id && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#7a8ab0]">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating message…
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#c7d2fe] bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] px-6 py-10 text-center">
                <Sparkles className="mx-auto h-9 w-9 text-[#7C5CFC]" />
                <p className="mt-3 text-base font-semibold text-[#0f1c3f]">
                  {!locationReady
                    ? "Finish Agency Settings"
                    : !hasRun
                      ? "Ready when you are"
                      : result.noRecommendationReason ||
                        "No strong community updates were identified for your area right now."}
                </p>
                <p className="mt-1 text-sm text-[#7a8ab0]">
                  {!locationReady
                    ? "Choose an agency type and service area, then generate."
                    : !hasRun
                      ? "Click Generate to search weather, traffic, utility, law-enforcement, and federal sources."
                      : discoveryStats && (discoveryStats.candidatesFound ?? 0) > 0
                        ? `SaferU found ${discoveryStats.candidatesFound} possible topic(s), but none met our quality bar for a PIO post today. Try again later or add service ZIP codes in Agency Settings.`
                        : "Try Generate again when conditions change, or add service ZIP codes in Agency Settings."}
                </p>
                {locationReady && !hasRun ? (
                  <Button
                    type="button"
                    className="mt-5 bg-[#7C5CFC] text-white hover:bg-[#6d4de8]"
                    disabled={loading}
                    onClick={() => void loadOpportunities()}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate recommendations
                  </Button>
                ) : null}
              </div>
            )}
          </section>

          {hasSaferu ? (
            <section className="space-y-4 border-t border-[#e2e8f5] pt-8">
              <div>
                <h2 className="text-lg font-semibold text-[#0f1c3f]">SaferU library</h2>
                <p className="text-sm text-[#7a8ab0]">
                  Ready-made safety posts with graphics from the SaferU content library. These are
                  separate from today&apos;s live search — use them anytime on your calendar.
                </p>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {saferuLibrary.map((opp) => (
                  <li key={opp.id}>
                    <OpportunityCard
                      opportunity={opp}
                      onUse={handleUse}
                      onSave={handleSave}
                      onDismiss={handleDismiss}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
