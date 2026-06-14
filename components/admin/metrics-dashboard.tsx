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
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { PressCenterDashboard } from "@/lib/pio-analytics"
import type { ContentAnalyticsDashboard } from "@/lib/content-analytics"

type Preset = "7d" | "30d" | "90d" | "year" | "custom"
type SortKey = "lastActive" | "totalSessions" | "downloads" | "feedbackScore"
type SectionTab = "overview" | "agencies" | "feedback" | "content"

interface DashboardData {
  pressCenter: PressCenterDashboard
  content: ContentAnalyticsDashboard
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

function SummaryCards({ items }: { items: { label: string; value: number | string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
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
  if (data.length === 0) return <ChartEmpty message="No data in this period yet." />
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey={categoryKey} width={130} tick={{ fontSize: 10 }} />
          <Tooltip />
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
  if (data.length === 0) return <ChartEmpty message="No data in this period yet." />
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={categoryKey} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Legend />
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
        setData(await res.json())
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
    return pc.usageOverTime.map((d) => ({
      ...d,
      label: formatPeriod(d.period, groupBy),
    }))
  }, [pc, groupBy])

  const signupsChart = useMemo(() => {
    if (!pc) return []
    return pc.signupsOverTime.map((d) => ({
      ...d,
      label: formatPeriod(d.period, groupBy),
    }))
  }, [pc, groupBy])

  const topAgenciesChart = useMemo(() => {
    if (!pc) return []
    return [...pc.agencyActivity]
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
    return pc.agencyTypeBreakdown.slice(0, 12).map((row) => ({
      type: row.type,
      signups: row.signups,
      sessions: row.totalSessions,
      active: row.activeAgencies,
    }))
  }, [pc])

  const agencyTypeFeedbackChart = useMemo(() => {
    if (!pc) return []
    return pc.agencyTypeBreakdown
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
    const rows = [...pc.agencyActivity]
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
    <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
      <TabsList>
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
    </Tabs>
  )

  if (loading && !data) {
    return <div className="p-8 text-gray-500">Loading metrics…</div>
  }

  if (!pc) {
    return (
      <div className="p-8">
        <p className="text-gray-500">{error || "Failed to load metrics."}</p>
      </div>
    )
  }

  const feedbackSummaryChart = [
    { name: "Positive", count: pc.feedback.positiveCount },
    { name: "Negative", count: pc.feedback.negativeCount },
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
        <p className="mt-1 text-gray-500">
          All site analytics in one place — signups by department, usage, agency activity, feedback, and curated content.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date range</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <TabsList>
              <TabsTrigger value="7d">Last 7 Days</TabsTrigger>
              <TabsTrigger value="30d">Last 30 Days</TabsTrigger>
              <TabsTrigger value="90d">Last 90 Days</TabsTrigger>
              <TabsTrigger value="year">This Year</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          {preset === "custom" && (
            <>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-auto" />
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-auto" />
            </>
          )}
          <Button onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Apply"}
          </Button>
        </CardContent>
      </Card>

      <Tabs value={section} onValueChange={(v) => setSection(v as SectionTab)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agencies">Agencies &amp; Signups</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="content">Curated Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <SummaryCards
            items={[
              { label: "Total Agencies", value: pc.summary.totalAgencies },
              { label: "New Signups", value: pc.summary.newSignups },
              { label: "Press Release Sessions", value: pc.summary.newPressReleaseSessions },
              { label: "Video Request Sessions", value: pc.summary.videoRequestSessions },
              { label: "Downloads", value: pc.summary.pressReleaseDownloads + pc.summary.talkingPointDownloads },
              { label: "Copies", value: pc.summary.totalCopyActions },
              { label: "Positive Feedback", value: `${pc.feedback.positivePercent}%` },
              { label: "Curated Views", value: content?.totals.views ?? 0 },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Generation sessions</CardTitle>
                  <CardDescription>Press releases vs video requests over time</CardDescription>
                </div>
                {groupByTabs}
              </CardHeader>
              <CardContent className="h-[280px]">
                {usageChart.length === 0 ? (
                  <ChartEmpty message="No generation sessions in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="newPressReleaseSessions" name="Press Release" stroke="#1470AF" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="videoRequestSessions" name="Video Request" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">New signups</CardTitle>
                  <CardDescription>Member registrations over time</CardDescription>
                </div>
                {groupByTabs}
              </CardHeader>
              <CardContent className="h-[280px]">
                {signupsChart.length === 0 ? (
                  <ChartEmpty message="No signups in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupsChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                      <Tooltip />
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
                <CardTitle className="text-lg">Signups by department type</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.departmentSignups} dataKey="count" categoryKey="type" color="#059669" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Incident types generated</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.incidentTypes.slice(0, 12)} dataKey="count" categoryKey="type" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Output utilization (%)</CardTitle>
              <CardDescription>How often generated assets are copied or downloaded</CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart data={assetUtilChart} dataKey="rate" categoryKey="name" color="#7c3aed" height={300} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="mt-6 space-y-6">
          <SummaryCards
            items={[
              { label: "New Signups", value: pc.summary.newSignups },
              { label: "Total Agencies", value: pc.summary.totalAgencies },
              { label: "Paid", value: pc.summary.paidAgencies },
              { label: "Free", value: pc.summary.freeAgencies },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Signups over time</CardTitle>
                </div>
                {groupByTabs}
              </CardHeader>
              <CardContent className="h-[300px]">
                {signupsChart.length === 0 ? (
                  <ChartEmpty message="No signups in this period." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={signupsChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} width={32} />
                      <Tooltip />
                      <Bar dataKey="count" name="Signups" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signups by department</CardTitle>
                <CardDescription>Police, Fire, EMS, Sheriff, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.departmentSignups} dataKey="count" categoryKey="type" color="#059669" height={300} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department type breakdown</CardTitle>
              <CardDescription>Signups, registered agencies, and Press Center activity by type</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
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
              <CardTitle className="text-lg">Signups vs sessions by type</CardTitle>
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
                <CardTitle className="text-lg">Top agencies by sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={topAgenciesChart} dataKey="sessions" categoryKey="name" height={320} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active agencies by type</CardTitle>
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
              <CardTitle className="text-lg">All agency activity</CardTitle>
              <CardDescription>Click column headers to sort</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
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
              { label: "Positive", value: pc.feedback.positiveCount },
              { label: "Negative", value: pc.feedback.negativeCount },
              { label: "Positive Rate", value: `${pc.feedback.positivePercent}%` },
              { label: "Top Complaint", value: pc.feedback.mostCommonComplaint ?? "—" },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Helpful vs not helpful</CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                {feedbackSummaryChart.every((d) => d.count === 0) ? (
                  <ChartEmpty message="No feedback yet." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedbackSummaryChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} width={32} />
                      <Tooltip />
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
                <CardTitle className="text-lg">Negative feedback reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizontalBarChart data={pc.feedbackByReason} dataKey="count" categoryKey="reason" color="#d97706" height={260} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback by department type</CardTitle>
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
              <CardTitle className="text-lg">Recent feedback</CardTitle>
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
                  { label: "Article Views", value: content.totals.views },
                  { label: "Copies", value: content.totals.copies },
                  { label: "Downloads", value: content.totals.downloads },
                  { label: "Unused Articles (sample)", value: content.unusedArticles.length },
                ]}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top articles</CardTitle>
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
                    <CardTitle className="text-lg">Views by category</CardTitle>
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
  )
}
