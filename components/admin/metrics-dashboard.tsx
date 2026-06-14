"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CircleHelp } from "lucide-react"
import { cn } from "@/lib/utils"
import { METRIC_HELP } from "@/lib/metrics-help"
import { useIsMobile } from "@/hooks/use-mobile"
import type { PressCenterDashboard } from "@/lib/pio-analytics"
import type { ContentAnalyticsDashboard } from "@/lib/content-analytics"

type Preset = "7d" | "30d" | "90d" | "year" | "custom"
type SortKey = "lastActive" | "totalSessions" | "downloads" | "feedbackScore"
type SectionTab = "overview" | "agencies" | "feedback" | "content"

interface DashboardData {
  pressCenter: PressCenterDashboard
  content: ContentAnalyticsDashboard
}

const EMPTY_CONTENT: ContentAnalyticsDashboard = {
  topArticles: [],
  topCategories: [],
  unusedArticles: [],
  totals: { views: 0, copies: 0, downloads: 0 },
}

function normalizeDashboard(raw: Partial<DashboardData> | null | undefined): DashboardData | null {
  if (!raw?.pressCenter) return null

  const pc = raw.pressCenter
  const content = raw.content ?? EMPTY_CONTENT

  return {
    pressCenter: {
      ...pc,
      usageOverTime: pc.usageOverTime ?? [],
      incidentTypes: pc.incidentTypes ?? [],
      departmentSignups: pc.departmentSignups ?? [],
      signupsOverTime: pc.signupsOverTime ?? [],
      agencyTypeBreakdown: pc.agencyTypeBreakdown ?? [],
      planBreakdown: pc.planBreakdown ?? [],
      feedbackByReason: pc.feedbackByReason ?? [],
      agencyActivity: pc.agencyActivity ?? [],
      assetUtilization: pc.assetUtilization ?? {
        pressReleaseSessions: 0,
        pressReleaseCopies: 0,
        pressReleaseDownloads: 0,
        facebookCopies: 0,
        spanishGenerated: 0,
        spanishCopies: 0,
        xCopies: 0,
        talkingPointDownloads: 0,
        videoRequestSessions: 0,
        videoRequestCopies: 0,
        videoRequestDownloads: 0,
      },
      feedback: {
        positiveCount: pc.feedback?.positiveCount ?? 0,
        negativeCount: pc.feedback?.negativeCount ?? 0,
        positivePercent: pc.feedback?.positivePercent ?? 0,
        mostCommonComplaint: pc.feedback?.mostCommonComplaint ?? null,
        recent: pc.feedback?.recent ?? [],
      },
    },
    content: {
      topArticles: content.topArticles ?? [],
      topCategories: content.topCategories ?? [],
      unusedArticles: content.unusedArticles ?? [],
      totals: content.totals ?? EMPTY_CONTENT.totals,
    },
  }
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatPeriod(period: string, groupBy: string): string {
  if (groupBy === "month" && period.length === 7) {
    const [y, m] = period.split("-")
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    })
  }
  const d = new Date(period)
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  return period
}

function pct(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((used / total) * 100)
}

function MetricHelp({ text, className }: { text: string; className?: string }) {
  const isMobile = useIsMobile()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 rounded-full p-0.5 text-gray-400 transition-colors hover:text-[#1470AF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1470AF]/40",
            className
          )}
          aria-label="What does this metric mean?"
        >
          <CircleHelp className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={isMobile ? "bottom" : "top"}
        sideOffset={6}
        className="max-w-[min(280px,calc(100vw-2rem))] text-left leading-relaxed"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function ChartTitle({
  title,
  help,
  description,
  className,
}: {
  title: string
  help: string
  description?: string
  className?: string
}) {
  return (
    <>
      <CardTitle className={cn("flex items-center gap-1.5 text-base sm:text-lg", className)}>
        {title}
        <MetricHelp text={help} />
      </CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
    </>
  )
}

function SummaryCards({
  items,
}: {
  items: { label: string; value: number | string; help?: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-3 sm:p-4">
            <p className="inline-flex items-start gap-1 text-[11px] font-medium leading-snug text-gray-500 sm:text-xs">
              {c.label}
              {c.help ? <MetricHelp text={c.help} className="mt-0.5" /> : null}
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[220px] items-center justify-center">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

function HorizontalBarChart({
  data,
  dataKey,
  categoryKey,
  color = "#1470AF",
  height = 280,
}: {
  data: Record<string, string | number>[]
  dataKey: string
  categoryKey: string
  color?: string
  height?: number
}) {
  const isMobile = useIsMobile()
  const chartHeight = isMobile ? Math.max(height, 240) : height

  if (data.length === 0) return <ChartEmpty message="No data in this period yet." />
  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 11 }} />
          <YAxis
            type="category"
            dataKey={categoryKey}
            width={isMobile ? 96 : 130}
            tick={{ fontSize: isMobile ? 9 : 10 }}
          />
          <RechartsTooltip />
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function VerticalBarChart({
  data,
  bars,
  categoryKey,
  height = 280,
}: {
  data: Record<string, string | number>[]
  bars: { dataKey: string; name: string; color: string }[]
  categoryKey: string
  height?: number
}) {
  const isMobile = useIsMobile()
  const chartHeight = isMobile ? Math.max(height, 260) : height

  if (data.length === 0) return <ChartEmpty message="No data in this period yet." />
  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: isMobile ? 48 : 4, left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={categoryKey}
            tick={{ fontSize: isMobile ? 9 : 10 }}
            interval={0}
            angle={isMobile ? -40 : -25}
            textAnchor="end"
            height={isMobile ? 72 : 60}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 11 }} width={isMobile ? 28 : 36} />
          <RechartsTooltip />
          <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 12 }} />
          {bars.map((b) => (
            <Bar key={b.dataKey} dataKey={b.dataKey} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MetricsDashboardView() {
  const [preset, setPreset] = useState<Preset>("30d")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")
  const [section, setSection] = useState<SectionTab>("overview")
  const [sortKey, setSortKey] = useState<SortKey>("lastActive")
  const [sortAsc, setSortAsc] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ preset, groupBy })
    if (preset === "custom") {
      if (customStart) params.set("start", customStart)
      if (customEnd) params.set("end", customEnd)
    }
    try {
      const res = await fetch(`/api/metrics?${params}`)
      if (res.ok) {
        const json = (await res.json()) as Partial<DashboardData>
        setData(normalizeDashboard(json))
      } else {
        setData(null)
        setError(`Could not load metrics (${res.status})`)
      }
    } catch {
      setData(null)
      setError("Could not reach the server.")
    } finally {
      setLoading(false)
    }
  }, [preset, customStart, customEnd, groupBy])

  useEffect(() => {
    void load()
  }, [load])

  const pc = data?.pressCenter
  const content = data?.content

  const usageChart = useMemo(() => {
    if (!pc) return []
    return (pc.usageOverTime ?? []).map((d) => ({
      ...d,
      label: formatPeriod(d.period, groupBy),
    }))
  }, [pc, groupBy])

  const signupsChart = useMemo(() => {
    if (!pc) return []
    return (pc.signupsOverTime ?? []).map((d) => ({
      ...d,
      label: formatPeriod(d.period, groupBy),
    }))
  }, [pc, groupBy])

  const topAgenciesChart = useMemo(() => {
    if (!pc) return []
    return [...(pc.agencyActivity ?? [])]
      .filter((a) => a.totalSessions > 0)
      .sort((a, b) => b.totalSessions - a.totalSessions)
      .slice(0, 12)
      .map((a) => ({
        name: a.agencyName.length > 28 ? `${a.agencyName.slice(0, 28)}…` : a.agencyName,
        sessions: a.totalSessions,
      }))
  }, [pc])

  const assetUtilChart = useMemo(() => {
    if (!pc) return []
    const u = pc.assetUtilization
    return [
      { name: "PR Copy", used: u.pressReleaseCopies, total: u.pressReleaseSessions },
      { name: "PR PDF", used: u.pressReleaseDownloads, total: u.pressReleaseSessions },
      { name: "Facebook", used: u.facebookCopies, total: u.pressReleaseSessions },
      { name: "Spanish", used: u.spanishGenerated, total: u.pressReleaseSessions },
      { name: "X Post", used: u.xCopies, total: u.pressReleaseSessions },
      { name: "Talking Pts", used: u.talkingPointDownloads, total: u.pressReleaseSessions },
      { name: "Video Copy", used: u.videoRequestCopies, total: u.videoRequestSessions },
      { name: "Video PDF", used: u.videoRequestDownloads, total: u.videoRequestSessions },
    ].map((row) => ({ ...row, rate: pct(row.used, row.total) }))
  }, [pc])

  const agencyTypeChart = useMemo(() => {
    if (!pc) return []
    return (pc.agencyTypeBreakdown ?? []).slice(0, 12).map((row) => ({
      type: row.type,
      signups: row.signups,
      sessions: row.totalSessions,
      active: row.activeAgencies,
    }))
  }, [pc])

  const agencyTypeFeedbackChart = useMemo(() => {
    if (!pc) return []
    return (pc.agencyTypeBreakdown ?? [])
      .filter((r) => r.positiveFeedback + r.negativeFeedback > 0)
      .slice(0, 12)
      .map((row) => ({
        type: row.type,
        positive: row.positiveFeedback,
        negative: row.negativeFeedback,
      }))
  }, [pc])

  const contentArticlesChart = useMemo(() => {
    if (!content) return []
    return content.topArticles.slice(0, 10).map((a) => ({
      name: a.title.length > 32 ? `${a.title.slice(0, 32)}…` : a.title,
      views: a.views,
      copies: a.copies,
      downloads: a.downloads,
    }))
  }, [content])

  const contentCategoriesChart = useMemo(() => {
    if (!content) return []
    return content.topCategories.slice(0, 10).map((c) => ({
      category: c.category.replace(/-/g, " "),
      views: c.views,
      copies: c.copies,
    }))
  }, [content])

  const sortedAgencies = useMemo(() => {
    if (!pc) return []
    const rows = [...(pc.agencyActivity ?? [])]
    rows.sort((a, b) => {
      let av: number | null = 0
      let bv: number | null = 0
      switch (sortKey) {
        case "lastActive":
          av = a.lastActive
          bv = b.lastActive
          break
        case "totalSessions":
          av = a.totalSessions
          bv = b.totalSessions
          break
        case "downloads":
          av = a.downloads
          bv = b.downloads
          break
        case "feedbackScore":
          av = a.feedbackScore ?? -1
          bv = b.feedbackScore ?? -1
          break
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
    return rows
  }, [pc, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const groupByTabs = (
    <div className="w-full overflow-x-auto sm:w-auto">
      <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
        <TabsList className="inline-flex w-max min-w-full sm:min-w-0">
          <TabsTrigger value="day" className="px-2.5 sm:px-3">Day</TabsTrigger>
          <TabsTrigger value="week" className="px-2.5 sm:px-3">Week</TabsTrigger>
          <TabsTrigger value="month" className="px-2.5 sm:px-3">Month</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )

  if (loading && !data) {
    return <div className="p-4 text-gray-500 sm:p-8">Loading metrics…</div>
  }

  if (!pc) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-gray-500">{error || "Failed to load metrics."}</p>
      </div>
    )
  }

  const feedbackSummaryChart = [
    { name: "Positive", count: pc.feedback.positiveCount },
    { name: "Negative", count: pc.feedback.negativeCount },
  ]

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Metrics</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Signups, usage, agency activity, feedback, and curated content.
          <span className="hidden sm:inline">
            {" "}Tap the <CircleHelp className="inline h-3.5 w-3.5 align-text-bottom text-gray-400" /> icon on any metric for details.
          </span>
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base">
            Date range
            <MetricHelp text={METRIC_HELP.dateRange} />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full overflow-x-auto sm:w-auto">
            <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)}>
              <TabsList className="inline-flex h-auto w-max min-w-full flex-nowrap sm:min-w-0">
                <TabsTrigger value="7d" className="px-2.5 text-xs sm:px-3 sm:text-sm">7 Days</TabsTrigger>
                <TabsTrigger value="30d" className="px-2.5 text-xs sm:px-3 sm:text-sm">30 Days</TabsTrigger>
                <TabsTrigger value="90d" className="px-2.5 text-xs sm:px-3 sm:text-sm">90 Days</TabsTrigger>
                <TabsTrigger value="year" className="px-2.5 text-xs sm:px-3 sm:text-sm">Year</TabsTrigger>
                <TabsTrigger value="custom" className="px-2.5 text-xs sm:px-3 sm:text-sm">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {preset === "custom" && (
            <>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full sm:w-auto" />
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full sm:w-auto" />
            </>
          )}
          <Button onClick={() => void load()} disabled={loading} className="w-full sm:w-auto">
            {loading ? "Loading…" : "Apply"}
          </Button>
        </CardContent>
      </Card>

      <Tabs value={section} onValueChange={(v) => setSection(v as SectionTab)}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex h-auto w-max min-w-full flex-nowrap gap-1 sm:min-w-0">
            <TabsTrigger value="overview" className="px-2.5 text-xs sm:px-3 sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="agencies" className="px-2.5 text-xs sm:px-3 sm:text-sm">
              <span className="sm:hidden">Agencies</span>
              <span className="hidden sm:inline">Agencies &amp; Signups</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="px-2.5 text-xs sm:px-3 sm:text-sm">Feedback</TabsTrigger>
            <TabsTrigger value="content" className="px-2.5 text-xs sm:px-3 sm:text-sm">
              <span className="sm:hidden">Content</span>
              <span className="hidden sm:inline">Curated Content</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <SummaryCards
            items={[
              { label: "Total Agencies", value: pc.summary.totalAgencies, help: METRIC_HELP.totalAgencies },
              { label: "New Signups", value: pc.summary.newSignups, help: METRIC_HELP.newSignups },
              { label: "Press Release Sessions", value: pc.summary.newPressReleaseSessions, help: METRIC_HELP.pressReleaseSessions },
              { label: "Video Request Sessions", value: pc.summary.videoRequestSessions, help: METRIC_HELP.videoRequestSessions },
              { label: "Downloads", value: pc.summary.pressReleaseDownloads + pc.summary.talkingPointDownloads, help: METRIC_HELP.downloads },
              { label: "Copies", value: pc.summary.totalCopyActions, help: METRIC_HELP.copies },
              { label: "Positive Feedback", value: `${pc.feedback.positivePercent}%`, help: METRIC_HELP.positiveFeedback },
              { label: "Curated Views", value: content?.totals.views ?? 0, help: METRIC_HELP.curatedViews },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <ChartTitle
                    title="Generation sessions"
                    help={METRIC_HELP.generationSessionsChart}
                    description="Press releases vs video requests over time"
                  />
                </div>
                {groupByTabs}
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[280px]">
                {usageChart.length === 0 ? (
                  <ChartEmpty message="No generation sessions in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="newPressReleaseSessions" name="Press Release" stroke="#1470AF" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="videoRequestSessions" name="Video Request" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <ChartTitle
                    title="New signups"
                    help={METRIC_HELP.signupsChart}
                    description="Member registrations over time"
                  />
                </div>
                {groupByTabs}
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[280px]">
                {signupsChart.length === 0 ? (
                  <ChartEmpty message="No signups in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupsChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Signups" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <ChartTitle title="Signups by department type" help={METRIC_HELP.signupsByDepartment} />
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.departmentSignups} dataKey="count" categoryKey="type" color="#059669" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ChartTitle title="Incident types generated" help={METRIC_HELP.incidentTypes} />
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.incidentTypes.slice(0, 12)} dataKey="count" categoryKey="type" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <ChartTitle
                title="Output utilization (%)"
                help={METRIC_HELP.outputUtilization}
                description="How often generated assets are copied or downloaded"
              />
            </CardHeader>
            <CardContent>
              <HorizontalBarChart data={assetUtilChart} dataKey="rate" categoryKey="name" color="#7c3aed" height={300} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="mt-6 space-y-6">
          <SummaryCards
            items={[
              { label: "New Signups", value: pc.summary.newSignups, help: METRIC_HELP.newSignups },
              { label: "Total Agencies", value: pc.summary.totalAgencies, help: METRIC_HELP.totalAgencies },
              { label: "Paid", value: pc.summary.paidAgencies, help: METRIC_HELP.paidAgencies },
              { label: "Free", value: pc.summary.freeAgencies, help: METRIC_HELP.freeAgencies },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <ChartTitle title="Signups over time" help={METRIC_HELP.signupsChart} />
                </div>
                {groupByTabs}
              </CardHeader>
              <CardContent className="h-[240px] sm:h-[300px]">
                {signupsChart.length === 0 ? (
                  <ChartEmpty message="No signups in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupsChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} width={32} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="Signups" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ChartTitle
                  title="Signups by department"
                  help={METRIC_HELP.signupsByDepartment}
                  description="Police, Fire, EMS, Sheriff, etc."
                />
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.departmentSignups} dataKey="count" categoryKey="type" color="#059669" height={300} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <ChartTitle
                title="Department type breakdown"
                help={METRIC_HELP.departmentBreakdown}
                description="Signups, registered agencies, and generation activity by type"
              />
            </CardHeader>
            <CardContent className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Department Type</th>
                    <th className="py-2 pr-4 font-medium">New Signups</th>
                    <th className="py-2 pr-4 font-medium">Registered</th>
                    <th className="py-2 pr-4 font-medium">Active</th>
                    <th className="py-2 pr-4 font-medium">Sessions</th>
                    <th className="py-2 pr-4 font-medium">Downloads</th>
                    <th className="py-2 pr-4 font-medium">Copies</th>
                    <th className="py-2 pr-4 font-medium">👍</th>
                    <th className="py-2 pr-4 font-medium">👎</th>
                  </tr>
                </thead>
                <tbody>
                  {pc.agencyTypeBreakdown.length === 0 ? (
                    <tr><td colSpan={9} className="py-6 text-gray-500">No signup or activity data yet.</td></tr>
                  ) : (
                    pc.agencyTypeBreakdown.map((row) => (
                      <tr key={row.type} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium">{row.type}</td>
                        <td className="py-2 pr-4">{row.signups}</td>
                        <td className="py-2 pr-4">{row.agencies}</td>
                        <td className="py-2 pr-4">{row.activeAgencies}</td>
                        <td className="py-2 pr-4">{row.totalSessions}</td>
                        <td className="py-2 pr-4">{row.downloads}</td>
                        <td className="py-2 pr-4">{row.copies}</td>
                        <td className="py-2 pr-4 text-green-700">{row.positiveFeedback}</td>
                        <td className="py-2 pr-4 text-amber-800">{row.negativeFeedback}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ChartTitle title="Signups vs sessions by type" help={METRIC_HELP.signupsVsSessions} />
            </CardHeader>
            <CardContent>
              <VerticalBarChart
                data={agencyTypeChart}
                categoryKey="type"
                bars={[
                  { dataKey: "signups", name: "Signups", color: "#059669" },
                  { dataKey: "sessions", name: "Sessions", color: "#1470AF" },
                ]}
                height={320}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <ChartTitle title="Top agencies by sessions" help={METRIC_HELP.topAgencies} />
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={topAgenciesChart} dataKey="sessions" categoryKey="name" height={320} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ChartTitle title="Active agencies by type" help={METRIC_HELP.activeByType} />
              </CardHeader>
              <CardContent>
                <HorizontalBarChart
                  data={agencyTypeChart.map((r) => ({ type: r.type, active: r.active }))}
                  dataKey="active"
                  categoryKey="type"
                  color="#0891b2"
                  height={320}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <ChartTitle
                title="All agency activity"
                help={METRIC_HELP.agencyTable}
                description="Click column headers to sort"
              />
            </CardHeader>
            <CardContent className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Agency</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("lastActive")}>Last Active</th>
                    <th className="py-2 pr-4 font-medium">PR</th>
                    <th className="py-2 pr-4 font-medium">Video</th>
                    <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("totalSessions")}>Total</th>
                    <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("downloads")}>Downloads</th>
                    <th className="py-2 pr-4 font-medium">Copies</th>
                    <th className="py-2 pr-4 font-medium">Spanish</th>
                    <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("feedbackScore")}>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgencies.length === 0 ? (
                    <tr><td colSpan={11} className="py-6 text-gray-500">No agency activity yet.</td></tr>
                  ) : (
                    sortedAgencies.map((a) => (
                      <tr key={`${a.agencyName}-${a.lastActive}`} className="border-b border-gray-100">
                        <td className="py-2 pr-4 font-medium text-gray-900">{a.agencyName}</td>
                        <td className="py-2 pr-4">{a.agencyType}</td>
                        <td className="py-2 pr-4">{a.plan}</td>
                        <td className="py-2 pr-4">{formatDate(a.lastActive)}</td>
                        <td className="py-2 pr-4">{a.newPressReleaseSessions}</td>
                        <td className="py-2 pr-4">{a.videoRequestSessions}</td>
                        <td className="py-2 pr-4">{a.totalSessions}</td>
                        <td className="py-2 pr-4">{a.downloads}</td>
                        <td className="py-2 pr-4">{a.copies}</td>
                        <td className="py-2 pr-4">{a.spanishTranslations}</td>
                        <td className="py-2 pr-4">{a.feedbackScore != null ? `${a.feedbackScore}%` : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-6 space-y-6">
          <SummaryCards
            items={[
              { label: "Positive", value: pc.feedback.positiveCount, help: METRIC_HELP.positiveCount },
              { label: "Negative", value: pc.feedback.negativeCount, help: METRIC_HELP.negativeCount },
              { label: "Positive Rate", value: `${pc.feedback.positivePercent}%`, help: METRIC_HELP.positiveRate },
              { label: "Top Complaint", value: pc.feedback.mostCommonComplaint ?? "—", help: METRIC_HELP.topComplaint },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <ChartTitle title="Helpful vs not helpful" help={METRIC_HELP.feedbackSummary} />
              </CardHeader>
              <CardContent className="h-[220px] sm:h-[260px]">
                {feedbackSummaryChart.every((d) => d.count === 0) ? (
                  <ChartEmpty message="No feedback yet." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedbackSummaryChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} width={32} />
                      <RechartsTooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        <Cell fill="#059669" />
                        <Cell fill="#d97706" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ChartTitle title="Negative feedback reasons" help={METRIC_HELP.feedbackReasons} />
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.feedbackByReason} dataKey="count" categoryKey="reason" color="#d97706" height={260} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <ChartTitle title="Feedback by department type" help={METRIC_HELP.feedbackByType} />
            </CardHeader>
            <CardContent>
              <VerticalBarChart
                data={agencyTypeFeedbackChart}
                categoryKey="type"
                bars={[
                  { dataKey: "positive", name: "Positive", color: "#059669" },
                  { dataKey: "negative", name: "Negative", color: "#d97706" },
                ]}
                height={300}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ChartTitle title="Recent feedback" help={METRIC_HELP.recentFeedback} />
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {pc.feedback.recent.length === 0 ? (
                <p className="text-sm text-gray-500">No feedback yet.</p>
              ) : (
                pc.feedback.recent.map((f) => (
                  <div key={f.id} className="rounded border p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{f.agencyName}</span>
                      <span className="text-gray-500">{formatDate(f.createdAt)}</span>
                    </div>
                    <p className={f.rating === "positive" ? "text-green-700" : "text-amber-800"}>
                      {f.rating === "positive" ? "Helpful" : "Not helpful"}
                      {f.reason ? ` — ${f.reason}` : ""}
                    </p>
                    {f.comment && <p className="text-gray-600 mt-1">{f.comment}</p>}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6 space-y-6">
          {content ? (
            <>
              <SummaryCards
                items={[
                  { label: "Article Views", value: content.totals.views, help: METRIC_HELP.curatedViews },
                  { label: "Copies", value: content.totals.copies, help: METRIC_HELP.curatedCopies },
                  { label: "Downloads", value: content.totals.downloads, help: METRIC_HELP.curatedDownloads },
                  { label: "Unused Articles (sample)", value: content.unusedArticles.length, help: METRIC_HELP.unusedArticles },
                ]}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <ChartTitle title="Top articles" help={METRIC_HELP.topArticles} />
                  </CardHeader>
                  <CardContent>
                    <VerticalBarChart
                      data={contentArticlesChart}
                      categoryKey="name"
                      bars={[
                        { dataKey: "views", name: "Views", color: "#1470AF" },
                        { dataKey: "copies", name: "Copies", color: "#059669" },
                        { dataKey: "downloads", name: "Downloads", color: "#7c3aed" },
                      ]}
                      height={340}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <ChartTitle title="Views by category" help={METRIC_HELP.viewsByCategory} />
                  </CardHeader>
                  <CardContent>
                    <VerticalBarChart
                      data={contentCategoriesChart}
                      categoryKey="category"
                      bars={[
                        { dataKey: "views", name: "Views", color: "#1470AF" },
                        { dataKey: "copies", name: "Copies", color: "#059669" },
                      ]}
                      height={340}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Article detail</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Top articles</h3>
                    <ul className="space-y-2 text-sm">
                      {content.topArticles.length === 0 ? (
                        <li className="text-gray-500">No activity in this period.</li>
                      ) : (
                        content.topArticles.map((a) => (
                          <li key={a.path} className="flex justify-between gap-2 border-b pb-1">
                            <span className="truncate">{a.title}</span>
                            <span className="shrink-0 text-gray-500">{a.views}v · {a.copies}c · {a.downloads}d</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Not viewed (sample)</h3>
                    <ul className="space-y-1 text-sm text-gray-600 max-h-64 overflow-y-auto">
                      {content.unusedArticles.length === 0 ? (
                        <li>All tracked articles had at least one view.</li>
                      ) : (
                        content.unusedArticles.map((a) => (
                          <li key={a.path}>{a.category}: {a.title}</li>
                        ))
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <ChartEmpty message="Curated content analytics unavailable." />
          )}
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  )
}

/** @deprecated Use MetricsDashboardView */
export const PressCenterDashboardView = MetricsDashboardView
