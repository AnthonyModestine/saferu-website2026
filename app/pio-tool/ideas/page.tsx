"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const dailySet = current.slice(0, 4)
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
    fromSaferU: saferuSet,
    emptyState: dailySet.length === 0 && saferuSet.length === 0,
    demo: false,
    generatedAt,
  }
}

export default function PostGeneratorPage() {
  const router = useRouter()
  const { settings, updateSettings } = useAgency()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const guest = isLocalGuestPreviewClient() || (!sessionLoading && !member)

  const [state, setState] = useState(settings.state)
  const [zips, setZips] = useState(settings.serviceZips)
  const [result, setResult] = useState<GeneratorResult>(EMPTY_RESULT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const autoLoadedRef = useRef(false)

  const agencyName = settings.agencyName || "Demo Township Police Department"

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

    // A holiday only appears when timely. Reuse its previously generated AI
    // graphic across navigation; otherwise generate just this one holiday.
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
          state: settings.state || state,
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

  useEffect(() => {
    setState(settings.state)
    setZips(settings.serviceZips)
  }, [settings.state, settings.serviceZips])

  const runClientDemo = useCallback(
    async (parsedZips: string[], stateVal: string) => {
      const history = loadDailyOpportunityHistory()
      const rankedDemo = rankAndGateExternalOpportunities(
        demoExternalOpportunities(parsedZips),
        {
          agencyType: settings.agencyType,
          todayIso: new Date().toISOString().slice(0, 10),
          postedFingerprints: history.postedFingerprints,
          recentTopicKeys: history.recentTopicKeys,
          requireTrustedSource: false,
        }
      ).map(({ internalScores: _scores, ...rest }) => rest)
      const demo = generatePostOpportunities({
        agencyName: settings.agencyName || "Demo Township Police Department",
        agencyType: settings.agencyType,
        agencyTypeOther: settings.agencyTypeOther,
        city: settings.city || "San Saba",
        state: stateVal,
        serviceZips: parsedZips,
        dismissedIds: history.dismissedIds,
        usedContentIds: history.usedContentIds,
        postedFingerprints: history.postedFingerprints,
        recentTopicKeys: history.recentTopicKeys,
        externalOpportunities: rankedDemo,
        dailyLimit: 4,
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
    },
    [
      settings.agencyName,
      settings.agencyType,
      settings.agencyTypeOther,
      settings.city,
      settings.logoUrl,
      settings.state,
      agencyName,
      guest,
      sessionLoading,
      state,
    ]
  )

  useEffect(() => {
    if (!guest) return
    const parsed = parseServiceZips(zips || "76877")
    const stateVal = state || "TX"
    if (parsed.length && stateVal) {
      void runClientDemo(parsed, stateVal)
    }
  }, [guest, state, zips, runClientDemo])

  useEffect(() => {
    if (sessionLoading || guest || autoLoadedRef.current) return
    const parsedZips = parseServiceZips(zips)
    if (!state.trim() || parsedZips.length === 0) return

    autoLoadedRef.current = true
    const history = loadDailyOpportunityHistory()
    if (
      history.lastResult &&
      isResultFromToday(history.lastResult.generatedAt) &&
      history.lastResult.opportunities.length > 0 &&
      history.lastResult.opportunities.length <= 6 &&
      history.lastResult.opportunities
        .filter((opp) => opp.opportunitySource !== "saferu_curated")
        .every((opp) => !opp.id.startsWith("ext-"))
    ) {
      void (async () => {
        const opportunities = [...history.lastResult!.opportunities]
        await hydrateOpportunityGraphics(opportunities)
        setResult(
          resultFromCached(opportunities, history.lastResult!.generatedAt)
        )
      })()
      return
    }
    void loadOpportunities()
    // A valid configured location triggers one automatic briefing per day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, guest, state, zips])

  async function loadOpportunities() {
    const parsedZips = parseServiceZips(zips)
    if (!state.trim() || parsedZips.length === 0) {
      setError("Enter your state and at least one 5-digit ZIP code.")
      return
    }

    updateSettings({ state: state.trim(), serviceZips: parsedZips.join(", ") })
    setLoading(true)
    setError(null)

    const history = loadDailyOpportunityHistory()

    if (guest) {
      try {
        await runClientDemo(parsedZips, state.trim())
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
          city: settings.city,
          state: state.trim(),
          serviceZips: parsedZips,
          dismissedIds: history.dismissedIds,
          usedContentIds: history.usedContentIds,
          postedFingerprints: history.postedFingerprints,
          recentTopicKeys: history.recentTopicKeys,
          savedIds: history.savedIds,
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
        setError(
          typeof data?.error === "string" ? data.error : "Could not load recommendations."
        )
        return
      }
      const next: GeneratorResult = {
        urgent: (data.urgent as GeneratorResult["urgent"]) ?? [],
        recommendedToday:
          (data.recommendedToday as GeneratorResult["recommendedToday"]) ?? [],
        planAhead: (data.planAhead as GeneratorResult["planAhead"]) ?? [],
        fromSaferU: (data.fromSaferU as GeneratorResult["fromSaferU"]) ?? [],
        emptyState: Boolean(data.emptyState),
        demo: Boolean(data.demo),
        generatedAt:
          typeof data.generatedAt === "string"
            ? data.generatedAt
            : new Date().toISOString(),
      }
      const flat = flattenOpportunities(next)
      await hydrateOpportunityGraphics(flat)
      setResult({ ...next })
      cacheOpportunityResult(flat, next.generatedAt)
      setIsDemo(Boolean(data.demo))
    } catch (err) {
      console.error("Post opportunity load failed:", err)
      setError("Something went wrong preparing your briefing. Try Generate again.")
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
      fromSaferU: prev.fromSaferU.filter((o) => o.id !== opp.id),
    }))
  }

  function handleSave(opp: PostOpportunity) {
    saveOpportunityForLater(opp)
  }

  async function copyMessage(opp: PostOpportunity) {
    const text = opp.curatedMessage || opp.curated?.message || ""
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopiedId(opp.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const locationReady = Boolean(state.trim() && parseServiceZips(zips).length > 0)
  const hasAny =
    result.urgent.length > 0 ||
    result.recommendedToday.length > 0 ||
    result.planAhead.length > 0 ||
    result.fromSaferU.length > 0
  const recommendedPosts = [
    ...result.urgent,
    ...result.recommendedToday,
    ...result.planAhead,
  ]

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
              Up to four high-value posts worth sharing today — filtered for your agency type,
              local impact, and resident usefulness — plus matching SaferU safety graphics.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EDE9FE] px-3 py-1.5 text-xs font-semibold text-[#6D28D9]">
              Today&apos;s briefing · refreshes tomorrow
            </span>
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
                  Generating…
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

      <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#2563EB]" />
          <h2 className="text-sm font-bold text-[#0f1c3f]">Your coverage area</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pg-state">State</Label>
            <Input
              id="pg-state"
              placeholder="e.g. TX"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-zips">Service ZIP codes</Label>
            <Input
              id="pg-zips"
              placeholder="e.g. 76877"
              value={zips}
              onChange={(e) => setZips(e.target.value)}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-[#7a8ab0]">
          Edit state and ZIP, then click{" "}
          <span className="font-semibold text-[#0f1c3f]">Generate</span> to test this area.
          {guest ? (
            <>
              {" "}
              <Link href={pressCenterSignInUrl()} className="font-semibold text-[#2563EB] hover:underline">
                Sign in
              </Link>{" "}
              for live NWS analysis.
            </>
          ) : null}
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </section>

      {isDemo && hasAny && (
        <p className="text-xs font-medium text-[#7a8ab0]">
          Sample daily briefing — sign in for live analysis tied to your area.
        </p>
      )}

      {!hasAny && !loading ? (
        <div className="rounded-3xl border border-dashed border-[#c7d2fe] bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] px-6 py-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#7C5CFC]" />
          <p className="mt-3 text-base font-semibold text-[#0f1c3f]">
            {locationReady ? "Analyzing your area…" : "Add state + ZIP to get started"}
          </p>
          <p className="mt-1 text-sm text-[#7a8ab0]">
            {locationReady
              ? "Your daily recommendations are being prepared automatically."
              : "We'll match seasonal conditions and SaferU curated content to your coverage area."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {recommendedPosts.length > 0 && (
            <OpportunitySection
              title="Recommended posts"
              subtitle={`${recommendedPosts.length} recommendation${
                recommendedPosts.length === 1 ? "" : "s"
              } worth communicating today for this agency and service area${
                recommendedPosts.length < 4
                  ? " — weaker or less relevant items were filtered out"
                  : ""
              }.`}
              opportunities={recommendedPosts}
              {...cardHandlers()}
            />
          )}
          {(result.fromSaferU.length > 0 || result.emptyState) && (
            <OpportunitySection
              title={
                result.emptyState && result.fromSaferU.length > 0
                  ? "SaferU safety graphics"
                  : "SaferU safety graphics"
              }
              subtitle={
                result.emptyState
                  ? "No urgent communication opportunities were identified right now. Here are curated safety graphics your community may find useful."
                  : "Pulled from SaferU curated content, like the What's New section."
              }
              opportunities={result.fromSaferU}
              {...cardHandlers()}
            />
          )}
          {recommendedPosts.length > 0 && result.fromSaferU.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cad5e8] bg-[#f8faff] px-5 py-4">
              <h2 className="text-base font-semibold text-[#0f1c3f]">SaferU safety graphics</h2>
              <p className="mt-1 text-sm text-[#7a8ab0]">
                No curated graphic and message directly match today&apos;s verified events. Unrelated
                content is not substituted.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )

  function cardHandlers() {
    return {
      onUse: handleUse,
      onGenerate: (opp: PostOpportunity) => void handleGenerate(opp),
      onSave: handleSave,
      onDismiss: handleDismiss,
      onCopy: copyMessage,
      copiedId,
      generatingId,
    }
  }
}

function OpportunitySection({
  title,
  subtitle,
  opportunities,
  onUse,
  onGenerate,
  onSave,
  onDismiss,
  onCopy,
  copiedId,
  generatingId,
}: {
  title: string
  subtitle?: string
  opportunities: PostOpportunity[]
  onUse: (opp: PostOpportunity) => void
  onGenerate: (opp: PostOpportunity) => void
  onSave: (opp: PostOpportunity) => void
  onDismiss: (opp: PostOpportunity) => void
  onCopy: (opp: PostOpportunity) => void
  copiedId: string | null
  generatingId: string | null
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#0f1c3f]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-[#7a8ab0]">{subtitle}</p>}
      <ul className="mt-3 grid gap-4 lg:grid-cols-2">
        {opportunities.map((opp) => (
          <li key={opp.id}>
            <OpportunityCard
              opportunity={opp}
              onUse={onUse}
              onGenerate={generatingId === opp.id ? undefined : onGenerate}
              onSave={onSave}
              onDismiss={onDismiss}
              onCopy={onCopy}
              copied={copiedId === opp.id}
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
  )
}
