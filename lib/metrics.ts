/**
 * In-memory metrics store. Resets on server restart/cold start.
 * For production, replace with a database (e.g. Vercel Postgres, Supabase).
 */

export type TrackEvent = "page_view" | "download" | "copy" | "log" | "pio_generate" | "signup"

export interface MetricEvent {
  id: string
  timestamp: string
  event: TrackEvent
  path?: string
  name?: string
  postId?: string
  postTitle?: string
  /** Client IP (from request headers). Used for area/region insight. */
  ip?: string
  /** Browser user-agent. */
  userAgent?: string
  /** PIO tool: "press_release" | "community_post" */
  source?: string
  [key: string]: unknown
}

const events: MetricEvent[] = []

export function recordEvent(event: Omit<MetricEvent, "id" | "timestamp">): void {
  events.push({
    ...event,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  })
}

export function getEvents(): MetricEvent[] {
  return [...events]
}

/** Turn path into a short article label for metrics (e.g. /crime-prevention/home/burglary -> "Burglary Prevention") */
function pathToArticleLabel(path: string): string {
  if (!path || path === "/") return "Home"
  const segments = path.replace(/^\/|\/$/g, "").split("/")
  if (segments.length === 0) return "Home"
  if (segments[0] === "whats-new" && segments[1]) return segments[1].replace(/-/g, " ")
  const last = segments[segments.length - 1]
  return last ? last.replace(/-/g, " ") : path
}

/** Group timestamp to day key (YYYY-MM-DD) */
function toDayKey(iso: string): string {
  return iso.slice(0, 10)
}

/** Group timestamp to week key (Sunday-based week start as YYYY-MM-DD) */
function toWeekKey(iso: string): string {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  return start.toISOString().slice(0, 10)
}

/** Group timestamp to month key (YYYY-MM) */
function toMonthKey(iso: string): string {
  return iso.slice(0, 7)
}

/** Group timestamp to quarter key (YYYY-Q1, Q2, Q3, Q4) */
function toQuarterKey(iso: string): string {
  const y = iso.slice(0, 4)
  const m = parseInt(iso.slice(5, 7), 10)
  const q = Math.ceil(m / 3)
  return `${y}-Q${q}`
}

/** Group timestamp to year key (YYYY) */
function toYearKey(iso: string): string {
  return iso.slice(0, 4)
}

export function getAggregatedMetrics(): {
  totalEvents: number
  byEvent: Record<TrackEvent, number>
  pageViewsByPath: Record<string, number>
  /** Article-friendly label -> count (for "which articles are being viewed") */
  pageViewsByArticle: Record<string, number>
  downloadsByName: Record<string, number>
  copiesByPost: Record<string, number>
  /** PIO Generate button hits */
  pioGenerateCount: number
  pioGenerateBySource: Record<string, number>
  /** Views grouped by IP (for "which areas") */
  viewsByIp: Record<string, number>
  /** Page view events with ip and timestamp (recent first) */
  recentPageViews: { path: string; articleLabel: string; ip: string; timestamp: string }[]
  /** Page views by day (YYYY-MM-DD -> count) */
  trendsByDay: Record<string, number>
  /** Page views by week (YYYY-Www -> count) */
  trendsByWeek: Record<string, number>
  /** Page views by month (YYYY-MM -> count) */
  trendsByMonth: Record<string, number>
  /** PIO Generate by day (YYYY-MM-DD -> count) */
  pioGenerateByDay: Record<string, number>
  /** PIO Generate by week (week-start YYYY-MM-DD -> count) */
  pioGenerateByWeek: Record<string, number>
  /** PIO Generate by month (YYYY-MM -> count) */
  pioGenerateByMonth: Record<string, number>
  /** PIO Generate by quarter (YYYY-Qn -> count) */
  pioGenerateByQuarter: Record<string, number>
  /** PIO Generate by year (YYYY -> count) */
  pioGenerateByYear: Record<string, number>
  /** PIO Generate by period, broken down by source (press_release, community_post) */
  pioGenerateByDayBySource: Record<string, Record<string, number>>
  pioGenerateByWeekBySource: Record<string, Record<string, number>>
  pioGenerateByMonthBySource: Record<string, Record<string, number>>
  pioGenerateByQuarterBySource: Record<string, Record<string, number>>
  pioGenerateByYearBySource: Record<string, Record<string, number>>
  /** Sign-ups (new member registrations) by period */
  signupsByDay: Record<string, number>
  signupsByWeek: Record<string, number>
  signupsByMonth: Record<string, number>
  /** Unique visitors (by IP) per period */
  uniqueVisitorsByDay: Record<string, number>
  uniqueVisitorsByWeek: Record<string, number>
  uniqueVisitorsByMonth: Record<string, number>
} {
  const byEvent: Record<string, number> = {
    page_view: 0,
    download: 0,
    copy: 0,
    log: 0,
    pio_generate: 0,
    signup: 0,
  }
  const pageViewsByPath: Record<string, number> = {}
  const pageViewsByArticle: Record<string, number> = {}
  const downloadsByName: Record<string, number> = {}
  const copiesByPost: Record<string, number> = {}
  const viewsByIp: Record<string, number> = {}
  const trendsByDay: Record<string, number> = {}
  const trendsByWeek: Record<string, number> = {}
  const trendsByMonth: Record<string, number> = {}
  const pioGenerateBySource: Record<string, number> = {}
  const pioGenerateByDay: Record<string, number> = {}
  const pioGenerateByWeek: Record<string, number> = {}
  const pioGenerateByMonth: Record<string, number> = {}
  const pioGenerateByQuarter: Record<string, number> = {}
  const pioGenerateByYear: Record<string, number> = {}
  const pioGenerateByDayBySource: Record<string, Record<string, number>> = {}
  const pioGenerateByWeekBySource: Record<string, Record<string, number>> = {}
  const pioGenerateByMonthBySource: Record<string, Record<string, number>> = {}
  const pioGenerateByQuarterBySource: Record<string, Record<string, number>> = {}
  const pioGenerateByYearBySource: Record<string, Record<string, number>> = {}
  const signupsByDay: Record<string, number> = {}
  const signupsByWeek: Record<string, number> = {}
  const signupsByMonth: Record<string, number> = {}
  const uniqueByDay: Record<string, Set<string>> = {}
  const uniqueByWeek: Record<string, Set<string>> = {}
  const uniqueByMonth: Record<string, Set<string>> = {}

  function addUnique(
    map: Record<string, Set<string>>,
    periodKey: string,
    ip: string
  ) {
    if (!map[periodKey]) map[periodKey] = new Set()
    map[periodKey].add(ip)
  }

  function incPioBySource(
    bySource: Record<string, Record<string, number>>,
    source: string,
    periodKey: string
  ) {
    if (!bySource[source]) bySource[source] = {}
    bySource[source][periodKey] = (bySource[source][periodKey] ?? 0) + 1
  }

  const pageViewEvents: MetricEvent[] = []

  for (const e of events) {
    byEvent[e.event] = (byEvent[e.event] ?? 0) + 1

    if (e.event === "page_view") {
      if (e.path) {
        pageViewsByPath[e.path] = (pageViewsByPath[e.path] ?? 0) + 1
        const label = pathToArticleLabel(e.path)
        pageViewsByArticle[label] = (pageViewsByArticle[label] ?? 0) + 1
      }
      if (e.ip) viewsByIp[e.ip] = (viewsByIp[e.ip] ?? 0) + 1
      if (e.timestamp) {
        const dk = toDayKey(e.timestamp)
        const wk = toWeekKey(e.timestamp)
        const mk = toMonthKey(e.timestamp)
        trendsByDay[dk] = (trendsByDay[dk] ?? 0) + 1
        trendsByWeek[wk] = (trendsByWeek[wk] ?? 0) + 1
        trendsByMonth[mk] = (trendsByMonth[mk] ?? 0) + 1
        if (e.ip) {
          addUnique(uniqueByDay, dk, e.ip)
          addUnique(uniqueByWeek, wk, e.ip)
          addUnique(uniqueByMonth, mk, e.ip)
        }
      }
      pageViewEvents.push(e)
    }

    if (e.event === "download" && e.name) {
      downloadsByName[e.name] = (downloadsByName[e.name] ?? 0) + 1
    }
    if (e.event === "copy" && e.postId) {
      copiesByPost[e.postId] = (copiesByPost[e.postId] ?? 0) + 1
    }
    if (e.event === "pio_generate" && e.timestamp) {
      const src = (e.source as string) || "unknown"
      pioGenerateBySource[src] = (pioGenerateBySource[src] ?? 0) + 1
      const dayK = toDayKey(e.timestamp)
      const weekK = toWeekKey(e.timestamp)
      const monthK = toMonthKey(e.timestamp)
      const quarterK = toQuarterKey(e.timestamp)
      const yearK = toYearKey(e.timestamp)
      pioGenerateByDay[dayK] = (pioGenerateByDay[dayK] ?? 0) + 1
      pioGenerateByWeek[weekK] = (pioGenerateByWeek[weekK] ?? 0) + 1
      pioGenerateByMonth[monthK] = (pioGenerateByMonth[monthK] ?? 0) + 1
      pioGenerateByQuarter[quarterK] = (pioGenerateByQuarter[quarterK] ?? 0) + 1
      pioGenerateByYear[yearK] = (pioGenerateByYear[yearK] ?? 0) + 1
      incPioBySource(pioGenerateByDayBySource, src, dayK)
      incPioBySource(pioGenerateByWeekBySource, src, weekK)
      incPioBySource(pioGenerateByMonthBySource, src, monthK)
      incPioBySource(pioGenerateByQuarterBySource, src, quarterK)
      incPioBySource(pioGenerateByYearBySource, src, yearK)
    }

    if (e.event === "signup" && e.timestamp) {
      signupsByDay[toDayKey(e.timestamp)] = (signupsByDay[toDayKey(e.timestamp)] ?? 0) + 1
      signupsByWeek[toWeekKey(e.timestamp)] = (signupsByWeek[toWeekKey(e.timestamp)] ?? 0) + 1
      signupsByMonth[toMonthKey(e.timestamp)] = (signupsByMonth[toMonthKey(e.timestamp)] ?? 0) + 1
    }
  }

  const uniqueVisitorsByDay: Record<string, number> = {}
  const uniqueVisitorsByWeek: Record<string, number> = {}
  const uniqueVisitorsByMonth: Record<string, number> = {}
  Object.keys(uniqueByDay).forEach((k) => { uniqueVisitorsByDay[k] = uniqueByDay[k].size })
  Object.keys(uniqueByWeek).forEach((k) => { uniqueVisitorsByWeek[k] = uniqueByWeek[k].size })
  Object.keys(uniqueByMonth).forEach((k) => { uniqueVisitorsByMonth[k] = uniqueByMonth[k].size })

  const recentPageViews = pageViewEvents
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))
    .slice(0, 100)
    .map((e) => ({
      path: e.path ?? "",
      articleLabel: pathToArticleLabel(e.path ?? ""),
      ip: e.ip ?? "—",
      timestamp: e.timestamp,
    }))

  return {
    totalEvents: events.length,
    byEvent: byEvent as Record<TrackEvent, number>,
    pageViewsByPath,
    pageViewsByArticle,
    downloadsByName,
    copiesByPost,
    pioGenerateCount: byEvent.pio_generate ?? 0,
    pioGenerateBySource,
    viewsByIp,
    recentPageViews,
    trendsByDay,
    trendsByWeek,
    trendsByMonth,
    pioGenerateByDay,
    pioGenerateByWeek,
    pioGenerateByMonth,
    pioGenerateByQuarter,
    pioGenerateByYear,
    pioGenerateByDayBySource,
    pioGenerateByWeekBySource,
    pioGenerateByMonthBySource,
    pioGenerateByQuarterBySource,
    pioGenerateByYearBySource,
    signupsByDay,
    signupsByWeek,
    signupsByMonth,
    uniqueVisitorsByDay,
    uniqueVisitorsByWeek,
    uniqueVisitorsByMonth,
  }
}
