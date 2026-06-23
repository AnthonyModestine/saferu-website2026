/**
 * Activity analytics grouped by member payment status.
 */

import type { ContentEvent } from "@/lib/content-analytics"
import { pathToJourneyLabel } from "@/lib/content-analytics"
import type { GenerationAction, GenerationSession } from "@/lib/pio-analytics"
import {
  lookupPaymentStatus,
  paymentStatusLabel,
  type MemberPaymentStatus,
  type MemberPaymentInfo,
} from "@/lib/member-payment-status"

export type PaymentSegmentId = MemberPaymentStatus | "anonymous"

export interface PaymentSegmentActivity {
  id: PaymentSegmentId
  label: string
  registeredMembers: number
  activeMembers: number
  contentViews: number
  contentCopies: number
  contentDownloads: number
  topPages: { path: string; label: string; count: number }[]
  topJourneysToCopy: { journey: string; count: number }[]
  pressReleaseSessions: number
  videoRequestSessions: number
  pressCenterCopies: number
  pressCenterDownloads: number
  topIncidentTypes: { type: string; count: number }[]
}

export interface PaymentSegmentAnalytics {
  segments: PaymentSegmentActivity[]
}

const SEGMENT_ORDER: PaymentSegmentId[] = ["active", "past", "never", "anonymous"]

const COPY_ACTIONS = new Set([
  "press_release_copied",
  "facebook_copied",
  "spanish_copied",
  "x_copied",
  "video_request_copied",
])

const DOWNLOAD_ACTIONS = new Set([
  "press_release_downloaded",
  "talking_points_downloaded",
  "video_request_downloaded",
])

function emptySegment(id: PaymentSegmentId, registeredMembers: number): PaymentSegmentActivity {
  return {
    id,
    label: id === "anonymous" ? "Anonymous visitors" : paymentStatusLabel(id),
    registeredMembers,
    activeMembers: 0,
    contentViews: 0,
    contentCopies: 0,
    contentDownloads: 0,
    topPages: [],
    topJourneysToCopy: [],
    pressReleaseSessions: 0,
    videoRequestSessions: 0,
    pressCenterCopies: 0,
    pressCenterDownloads: 0,
    topIncidentTypes: [],
  }
}

function topPages(
  map: Map<string, number>,
  limit: number
): { path: string; label: string; count: number }[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({ path, label: pathToJourneyLabel(path), count }))
}

function topJourneys(map: Map<string, number>, limit: number): { journey: string; count: number }[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([journey, count]) => ({ journey, count }))
}

export function buildPaymentSegmentAnalytics(params: {
  statusMap: Map<string, MemberPaymentInfo>
  contentEvents: ContentEvent[]
  sessions: GenerationSession[]
  actions: GenerationAction[]
}): PaymentSegmentAnalytics {
  const { statusMap, contentEvents, sessions, actions } = params

  const registeredCounts = new Map<PaymentSegmentId, number>()
  for (const info of statusMap.values()) {
    registeredCounts.set(info.status, (registeredCounts.get(info.status) ?? 0) + 1)
  }

  const segments = new Map<PaymentSegmentId, PaymentSegmentActivity>()
  const activeMemberSets = new Map<PaymentSegmentId, Set<string>>()
  const pageCounts = new Map<PaymentSegmentId, Map<string, number>>()
  const journeyCounts = new Map<PaymentSegmentId, Map<string, number>>()
  const incidentCounts = new Map<PaymentSegmentId, Map<string, number>>()

  for (const id of SEGMENT_ORDER) {
    segments.set(id, emptySegment(id, registeredCounts.get(id as MemberPaymentStatus) ?? 0))
    activeMemberSets.set(id, new Set())
    pageCounts.set(id, new Map())
    journeyCounts.set(id, new Map())
    incidentCounts.set(id, new Map())
  }

  for (const e of contentEvents) {
    const segment = lookupPaymentStatus(e.memberEmail, statusMap)
    const seg = segments.get(segment)!
    if (e.memberEmail) activeMemberSets.get(segment)?.add(e.memberEmail.toLowerCase())
    if (e.eventType === "page_view") seg.contentViews += 1
    else if (e.eventType === "copy") seg.contentCopies += 1
    else if (e.eventType === "download") seg.contentDownloads += 1
    if (e.path && e.eventType === "page_view") {
      const pages = pageCounts.get(segment)!
      pages.set(e.path, (pages.get(e.path) ?? 0) + 1)
    }
  }

  const bySession = new Map<string, ContentEvent[]>()
  for (const e of contentEvents) {
    if (!e.sessionId) continue
    const list = bySession.get(e.sessionId) ?? []
    list.push(e)
    bySession.set(e.sessionId, list)
  }
  for (const sessionEvents of bySession.values()) {
    const sorted = [...sessionEvents].sort((a, b) => a.createdAt - b.createdAt)
    const email = sorted.find((e) => e.memberEmail)?.memberEmail
    const segment = lookupPaymentStatus(email, statusMap)
    const viewPaths = sorted
      .filter((e) => e.eventType === "page_view" && e.path)
      .map((e) => e.path as string)
    const deduped: string[] = []
    for (const p of viewPaths) {
      if (deduped[deduped.length - 1] !== p) deduped.push(p)
    }
    for (const e of sorted) {
      if (e.eventType !== "copy") continue
      const prior = deduped.filter((p) => {
        const views = sorted.filter((ev) => ev.eventType === "page_view" && ev.path === p)
        const last = views[views.length - 1]
        return last && last.createdAt <= e.createdAt
      })
      const journeyKey = [...prior.slice(-4), "Copy"]
        .map((p) => (p === "Copy" ? p : pathToJourneyLabel(p)))
        .join(" → ")
      const journeys = journeyCounts.get(segment)!
      journeys.set(journeyKey, (journeys.get(journeyKey) ?? 0) + 1)
    }
  }

  const sessionById = new Map(sessions.map((s) => [s.id, s]))
  for (const s of sessions) {
    const segment = lookupPaymentStatus(s.memberEmail, statusMap)
    const seg = segments.get(segment)!
    activeMemberSets.get(segment)?.add(s.memberEmail.toLowerCase())
    if (s.generationType === "new_press_release") seg.pressReleaseSessions += 1
    else seg.videoRequestSessions += 1
    if (s.incidentType) {
      const incidents = incidentCounts.get(segment)!
      incidents.set(s.incidentType, (incidents.get(s.incidentType) ?? 0) + 1)
    }
  }

  for (const a of actions) {
    const session = sessionById.get(a.generationSessionId)
    if (!session) continue
    const segment = lookupPaymentStatus(session.memberEmail, statusMap)
    const seg = segments.get(segment)!
    if (COPY_ACTIONS.has(a.actionType)) seg.pressCenterCopies += 1
    if (DOWNLOAD_ACTIONS.has(a.actionType)) seg.pressCenterDownloads += 1
  }

  for (const id of SEGMENT_ORDER) {
    const seg = segments.get(id)!
    seg.activeMembers = activeMemberSets.get(id)?.size ?? 0
    seg.topPages = topPages(pageCounts.get(id)!, 8)
    seg.topJourneysToCopy = topJourneys(journeyCounts.get(id)!, 6)
    seg.topIncidentTypes = Array.from(incidentCounts.get(id)!.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([type, count]) => ({ type, count }))
  }

  return { segments: SEGMENT_ORDER.map((id) => segments.get(id)!) }
}
