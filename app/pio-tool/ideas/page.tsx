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
  dismissOpportunity,
  isResultFromToday,
  loadDailyOpportunityHistory,
  saveOpportunityForLater,
  stashOpportunityForUse,
} from "@/lib/post-generator/opportunity-store"

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
  const { settings } = useAgency()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const [localGuestPreview, setLocalGuestPreview] = useState(false)
  const guest = localGuestPreview || (!sessionLoading && !member)

  const [result, setResult] = useState<GeneratorResult>(EMPTY_RESULT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const autoLoadedRef = useRef(false)

  useEffect(() => {
    setLocalGuestPreview(isLocalGuestPreviewClient())
  }, [])

  const agencyName = settings.agencyName || "Your Agency"
  const locationReady = Boolean(
    settings.agencyType &&
      settings.state.trim() &&
      (settings.serviceAreaType === "state" ||
        (settings.serviceAreaType === "county" && settings.county.trim()) ||
        (settings.serviceAreaType === "city" &&
          settings.city.trim() &&
          settings.county.trim()))
  )

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
      serviceZips: [],
      dismissedIds: history.dismissedIds,
      usedContentIds: history.usedContentIds,
      postedFingerprints: history.postedFingerprints,
      recentTopicKeys: history.recentTopicKeys,
      externalOpportunities: rankedDemo,
      dailyLimit: 12,
    })
    const flat = flattenOpportunities(demo)
    for (const opportunity of flat) {
      if (opportunity.curatedMessage) continue
      opportunity.curatedMessage = [
        `Community update: ${opportunity.title}.`,
        ...(opportunity.verifiedFacts ?? []),
        ...(opportunity.publicCallToAction ?? []),
      ].join(" ")
    }
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
    const history = loadDailyOpportunityHistory()
    if (
      history.lastResult &&
      isResultFromToday(history.lastResult.generatedAt) &&
      history.lastResult.opportunities.length > 0 &&
      history.lastResult.opportunities.length <= 20 &&
      history.lastResult.opportunities.every(
        (opp) =>
          opp.opportunitySource === "saferu_curated" ||
          (!opp.id.startsWith("ext-") &&
            Boolean(opp.surfacedReason) &&
            Boolean(opp.curatedMessage))
      )
    ) {
      void (async () => {
        const opportunities = [...history.lastResult!.opportunities]
        await hydrateOpportunityGraphics(opportunities)
        setResult(resultFromCached(opportunities, history.lastResult!.generatedAt))
      })()
      return
    }
    void loadOpportunities()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, guest, locationReady])

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
          serviceZips: [],
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
      await hydrateOpportunityGraphics(opportunities)
      const next: GeneratorResult = {
        urgent: (data.urgent as PostOpportunity[]) || [],
        recommendedToday: (data.recommendedToday as PostOpportunity[]) || [],
        planAhead: (data.planAhead as PostOpportunity[]) || [],
        topRecommended: (data.topRecommended as PostOpportunity[]) || [],
        couldPost: (data.couldPost as PostOpportunity[]) || [],
        uncertain: [],
        fromSaferU: (data.fromSaferU as PostOpportunity[]) || [],
        emptyState: Boolean(data.emptyState),
        demo: Boolean(data.demo),
        generatedAt: String(data.generatedAt || new Date().toISOString()),
      }
      setResult(next)
      cacheOpportunityResult(opportunities, next.generatedAt)
      setIsDemo(Boolean(data.demo))
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
    // Local signal for now — marks this recommendation as useful for future learning.
    saveOpportunityForLater(opp)
  }

  const recommendations = [
    ...(result.topRecommended ?? []),
    ...(result.couldPost ?? []),
    ...((result.topRecommended ?? []).length === 0 && (result.couldPost ?? []).length === 0
      ? [...result.urgent, ...result.recommendedToday, ...result.planAhead]
      : []),
    ...result.fromSaferU,
  ].filter((opp, index, all) => all.findIndex((item) => item.id === opp.id) === index)

  const hasAny = recommendations.length > 0
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
              What to share with your community today
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
          Set your state and service area in{" "}
          <Link href="/pio-tool/settings" className="font-semibold text-[#2563EB] hover:underline">
            Agency Settings
          </Link>{" "}
          to get recommendations. City agencies need city + county (place names can repeat in a
          state).
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

      {isDemo && hasAny && (
        <p className="text-xs font-medium text-[#7a8ab0]">
          Sample briefing — sign in for live analysis tied to your area.
        </p>
      )}

      {!hasAny && !loading ? (
        <div className="rounded-3xl border border-dashed border-[#c7d2fe] bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] px-6 py-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#7C5CFC]" />
          <p className="mt-3 text-base font-semibold text-[#0f1c3f]">
            {locationReady
              ? "Nothing strong enough to recommend right now"
              : "Finish Agency Settings"}
          </p>
          <p className="mt-1 text-sm text-[#7a8ab0]">
            {locationReady
              ? "Try Generate again, or check Agency Settings if your service area looks incomplete."
              : "Choose an agency type and service area, then generate."}
          </p>
        </div>
      ) : hasAny ? (
        <section>
          <ul className="grid gap-4 md:grid-cols-2">
            {recommendations.map((opp) => (
              <li key={opp.id}>
                <OpportunityCard
                  opportunity={opp}
                  onUse={handleUse}
                  onGenerate={generatingId === opp.id ? undefined : (o) => void handleGenerate(o)}
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
        </section>
      ) : loading ? (
        <div className="rounded-3xl border border-dashed border-[#c7d2fe] bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] px-6 py-12 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#7C5CFC]" />
          <p className="mt-3 text-base font-semibold text-[#0f1c3f]">Finding something useful…</p>
          <p className="mt-1 text-sm text-[#7a8ab0]">This can take about a minute.</p>
        </div>
      ) : null}
    </div>
  )
}
