"use client"

import { parseServiceZips } from "@/lib/local-ideas-ai"
import { isAgencyLocationReady } from "@/lib/agency-location"
import type { DepartmentType } from "@/lib/department-types"
import type { ServiceAreaType } from "@/lib/agency-context"
import {
  BRIEFING_CACHE_EVENT,
  cacheOpportunityResult,
  isResultFromToday,
  loadDailyOpportunityHistory,
} from "@/lib/post-generator/opportunity-store"
import type { PostOpportunity } from "@/lib/post-generator/types"
import { attachWeatherAlertGraphics } from "@/lib/pio-weather-graphic"
import { getPioHistoryItems } from "@/lib/pio-history-store"
import { getPioEvents } from "@/lib/pio-events-store"

export type PrefetchSettings = {
  agencyName: string
  agencyType: DepartmentType | ""
  agencyTypeOther: string
  serviceAreaType: ServiceAreaType
  city: string
  county: string
  state: string
  serviceZips?: string
}

let prefetchInFlight: Promise<number> | null = null

function recentCreatedContentPayload() {
  return [
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
}

function cachedBriefingOpportunities(): PostOpportunity[] {
  const history = loadDailyOpportunityHistory()
  if (!isResultFromToday(history.lastResult?.generatedAt)) return []
  return history.lastResult?.opportunities ?? []
}

/** Count recommendations cached for today (client-only). */
export function countCachedBriefingOpportunities(): number {
  return cachedBriefingOpportunities().length
}

export function loadCachedBriefingPreview(max = 5): Array<{
  id: string
  title: string
  whyItMatters?: string
}> {
  return cachedBriefingOpportunities()
    .slice(0, max)
    .map((opp) => ({
      id: opp.id,
      title: opp.title,
      whyItMatters: opp.whyItMatters || opp.summary,
    }))
}

export function isUsableCachedBriefing(opportunities: PostOpportunity[]): boolean {
  if (!opportunities.length || opportunities.length > 20) return false
  return opportunities.every(
    (opp) =>
      Boolean(opp.title?.trim()) &&
      Boolean(opp.summary?.trim() || opp.whyItMatters?.trim())
  )
}

/**
 * Prefetch today's AI recommendations for paying users with a ready service area.
 * Returns the number of opportunities cached (0 if skipped or failed).
 */
export async function prefetchPostOpportunities(opts: {
  settings: PrefetchSettings
  isPaid: boolean
  force?: boolean
}): Promise<number> {
  if (!opts.isPaid || !isAgencyLocationReady(opts.settings)) return 0

  const history = loadDailyOpportunityHistory()
  const cachedCount = history.lastResult?.opportunities.length ?? 0
  if (
    !opts.force &&
    isResultFromToday(history.lastResult?.generatedAt) &&
    cachedCount > 0
  ) {
    return cachedCount
  }

  if (prefetchInFlight) return prefetchInFlight

  prefetchInFlight = (async () => {
    try {
      const history = loadDailyOpportunityHistory()
      const res = await fetch("/api/pio/post-opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: opts.settings.agencyName,
          agencyType: opts.settings.agencyType,
          agencyTypeOther: opts.settings.agencyTypeOther,
          serviceAreaType: opts.settings.serviceAreaType,
          city: opts.settings.city,
          county: opts.settings.county,
          state: opts.settings.state.trim(),
          serviceZips: parseServiceZips(opts.settings.serviceZips),
          dismissedIds: history.dismissedIds,
          usedContentIds: history.usedContentIds,
          postedFingerprints: history.postedFingerprints,
          recentTopicKeys: history.recentTopicKeys,
          savedIds: history.savedIds,
          recentCreatedContent: recentCreatedContentPayload(),
        }),
      })
      if (!res.ok) return 0
      const data = (await res.json()) as {
        opportunities?: PostOpportunity[]
        generatedAt?: string
      }
      const opportunities = data.opportunities ?? []
      if (!opportunities.length) return 0
      await attachWeatherAlertGraphics(opportunities, {
        logoUrl: null,
        agencyName: opts.settings.agencyName,
      })
      cacheOpportunityResult(opportunities, data.generatedAt || new Date().toISOString())
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(BRIEFING_CACHE_EVENT))
      }
      return opportunities.length
    } catch (err) {
      console.warn("[prefetch-briefing] failed:", err)
      return 0
    } finally {
      prefetchInFlight = null
    }
  })()

  return prefetchInFlight
}
