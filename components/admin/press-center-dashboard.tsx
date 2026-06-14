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
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { PressCenterDashboard } from "@/lib/pio-analytics"
import type { ContentAnalyticsDashboard } from "@/lib/content-analytics"

type Preset = "7d" | "30d" | "90d" | "year" | "custom"
type SortKey = "lastActive" | "totalSessions" | "downloads" | "feedbackScore"

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

export function PressCenterDashboardView() {
  const [preset, setPreset] = useState<Preset>("30d")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")
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

  if (loading && !data) {
    return <div className="p-8 text-gray-500">Loading Press Center analytics…</div>
  }

  if (!pc) {
    return (
      <div className="p-8">
        <p className="text-gray-500">{error || "Failed to load metrics."}</p>
      </div>
    )
  }

  const util = pc.assetUtilization
  const summaryCards = [
    { label: "Total Agencies", value: pc.summary.totalAgencies },
    { label: "Active (30d)", value: pc.summary.activeAgencies },
    { label: "New Signups", value: pc.summary.newSignups },
    { label: "Press Release Sessions", value: pc.summary.newPressReleaseSessions },
    { label: "Video Request Sessions", value: pc.summary.videoRequestSessions },
    { label: "Total Sessions", value: pc.summary.totalSessions },
    { label: "PR Downloads", value: pc.summary.pressReleaseDownloads },
    { label: "Talking Point Downloads", value: pc.summary.talkingPointDownloads },
    { label: "Spanish Translations", value: pc.summary.spanishTranslationsGenerated },
    { label: "Total Copies", value: pc.summary.totalCopyActions },
    { label: "Paid Agencies", value: pc.summary.paidAgencies },
    { label: "Free Agencies", value: pc.summary.freeAgencies },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
        <p className="mt-1 text-gray-500">
          Press Center usage, agency engagement, curated content, signups, and feedback. Data is stored in the database and persists across deploys.
        </p>
      </div>

      {/* Date filters */}
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

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage over time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Usage over time</CardTitle>
            <CardDescription>Press release and video request sessions</CardDescription>
          </div>
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-[280px]">
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
        </CardContent>
      </Card>

      {/* Incident types */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incident type breakdown</CardTitle>
            <CardDescription>Press Center generations in this period</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {pc.incidentTypes.length === 0 ? (
              <p className="text-sm text-gray-500">No Press Center sessions in this period yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pc.incidentTypes.slice(0, 12)} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1470AF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Signups by department</CardTitle>
            <CardDescription>New member registrations in this period</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {pc.departmentSignups.length === 0 ? (
              <p className="text-sm text-gray-500">No signups in this period yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pc.departmentSignups.slice(0, 12)} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agency activity table - removed duplicate incident chart below */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agency activity</CardTitle>
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
                <th className="py-2 pr-4 font-medium">PR Sessions</th>
                <th className="py-2 pr-4 font-medium">Video Sessions</th>
                <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("totalSessions")}>Total</th>
                <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("downloads")}>Downloads</th>
                <th className="py-2 pr-4 font-medium">Copies</th>
                <th className="py-2 pr-4 font-medium">Spanish</th>
                <th className="py-2 pr-4 font-medium cursor-pointer" onClick={() => toggleSort("feedbackScore")}>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgencies.length === 0 ? (
                <tr><td colSpan={11} className="py-6 text-gray-500">No agency activity in this period.</td></tr>
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

      {/* Asset utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asset utilization</CardTitle>
          <CardDescription>Which generated outputs are actually used</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Press Releases Copied", used: util.pressReleaseCopies, total: util.pressReleaseSessions },
            { label: "Press Release PDFs", used: util.pressReleaseDownloads, total: util.pressReleaseSessions },
            { label: "Facebook Posts Copied", used: util.facebookCopies, total: util.pressReleaseSessions },
            { label: "Spanish Generated", used: util.spanishGenerated, total: util.pressReleaseSessions },
            { label: "Spanish Copies", used: util.spanishCopies, total: util.spanishGenerated || util.pressReleaseSessions },
            { label: "X Posts Copied", used: util.xCopies, total: util.pressReleaseSessions },
            { label: "Talking Points", used: util.talkingPointDownloads, total: util.pressReleaseSessions },
            { label: "Video Requests Copied", used: util.videoRequestCopies, total: util.videoRequestSessions },
            { label: "Video Request Downloads", used: util.videoRequestDownloads, total: util.videoRequestSessions },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900">
                {item.used}
                <span className="text-sm font-normal text-gray-500"> / {item.total} sessions</span>
              </p>
              <p className="text-sm text-[#1470AF]">{pct(item.used, item.total)}% utilization</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feedback */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Feedback summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-gray-500">Positive:</span> <strong>{pc.feedback.positiveCount}</strong></p>
            <p><span className="text-gray-500">Negative:</span> <strong>{pc.feedback.negativeCount}</strong></p>
            <p><span className="text-gray-500">Positive rate:</span> <strong>{pc.feedback.positivePercent}%</strong></p>
            <p><span className="text-gray-500">Top complaint:</span> <strong>{pc.feedback.mostCommonComplaint ?? "—"}</strong></p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Recent feedback</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
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
                    {f.rating === "positive" ? "👍 Helpful" : "👎 Not helpful"}
                    {f.reason ? ` — ${f.reason}` : ""}
                  </p>
                  {f.comment && <p className="text-gray-600 mt-1">{f.comment}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Curated content */}
      {content && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Curated content usage</CardTitle>
            <CardDescription>
              Views: {content.totals.views} · Copies: {content.totals.copies} · Downloads: {content.totals.downloads}
            </CardDescription>
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
              <h3 className="text-sm font-medium mb-2">Categories</h3>
              <ul className="space-y-2 text-sm">
                {content.topCategories.map((c) => (
                  <li key={c.category} className="flex justify-between gap-2 border-b pb-1">
                    <span>{c.category}</span>
                    <span className="text-gray-500">{c.views} views · {c.copies} copies</span>
                  </li>
                ))}
              </ul>
              <h3 className="text-sm font-medium mt-4 mb-2">Not viewed (sample)</h3>
              <ul className="space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
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
      )}
    </div>
  )
}
