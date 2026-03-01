"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Download, Copy, BarChart3, FileText, MapPin, Clock, TrendingUp, Sparkles } from "lucide-react"

interface AggregatedMetrics {
  totalEvents: number
  byEvent: { page_view: number; download: number; copy: number; log: number; pio_generate: number }
  pageViewsByPath: Record<string, number>
  pageViewsByArticle: Record<string, number>
  downloadsByName: Record<string, number>
  copiesByPost: Record<string, number>
  pioGenerateCount: number
  pioGenerateBySource: Record<string, number>
  viewsByIp: Record<string, number>
  recentPageViews: { path: string; articleLabel: string; ip: string; timestamp: string }[]
  trendsByDay: Record<string, number>
  trendsByWeek: Record<string, number>
  trendsByMonth: Record<string, number>
  pioGenerateByDay: Record<string, number>
  pioGenerateByWeek: Record<string, number>
  pioGenerateByMonth: Record<string, number>
  pioGenerateByQuarter: Record<string, number>
  pioGenerateByYear: Record<string, number>
  pioGenerateByDayBySource: Record<string, Record<string, number>>
  pioGenerateByWeekBySource: Record<string, Record<string, number>>
  pioGenerateByMonthBySource: Record<string, Record<string, number>>
  pioGenerateByQuarterBySource: Record<string, Record<string, number>>
  pioGenerateByYearBySource: Record<string, Record<string, number>>
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [trendRange, setTrendRange] = useState<"day" | "week" | "month">("day")
  const [pioPeriod, setPioPeriod] = useState<"day" | "week" | "month" | "quarter" | "year">("day")

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading metrics…</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Failed to load metrics.</p>
      </div>
    )
  }

  const topPaths = Object.entries(metrics.pageViewsByPath)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const topArticles = Object.entries(metrics.pageViewsByArticle)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
  const topDownloads = Object.entries(metrics.downloadsByName)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
  const topIps = Object.entries(metrics.viewsByIp)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)

  const trendData =
    trendRange === "day"
      ? Object.entries(metrics.trendsByDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
      : trendRange === "week"
        ? Object.entries(metrics.trendsByWeek).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
        : Object.entries(metrics.trendsByMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  const trendLabel = trendRange === "day" ? "Last 14 days" : trendRange === "week" ? "Last 12 weeks" : "Last 12 months"

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Metrics</h1>
        <p className="mt-1 text-gray-500">
          Article views, IP/areas, time trends, and Press Center usage. Data resets on server restart unless you add a database.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total events</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Page views</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.byEvent.page_view}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Press Center Generate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.pioGenerateCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.byEvent.download}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500">
              <Copy className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Copies</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.byEvent.copy}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Article views */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Article views
          </CardTitle>
          <CardDescription>Which articles are being viewed (by article/topic)</CardDescription>
        </CardHeader>
        <CardContent>
          {topArticles.length === 0 ? (
            <p className="text-sm text-gray-500">No article views yet.</p>
          ) : (
            <ul className="space-y-2">
              {topArticles.map(([label, count]) => (
                <li key={label} className="flex justify-between text-sm">
                  <span className="text-gray-700 capitalize">{label}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Views by IP / areas */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Views by IP (areas)
          </CardTitle>
          <CardDescription>Which IPs are viewing the site — use for geographic/area insight</CardDescription>
        </CardHeader>
        <CardContent>
          {topIps.length === 0 ? (
            <p className="text-sm text-gray-500">No IP data yet. Views are recorded with IP when the request includes it (e.g. behind a proxy).</p>
          ) : (
            <ul className="space-y-2">
              {topIps.map(([ip, count]) => (
                <li key={ip} className="flex justify-between text-sm font-mono">
                  <span className="text-gray-700">{ip}</span>
                  <span className="font-medium">{count} views</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Time trends */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trends — page views over time
          </CardTitle>
          <CardDescription>Day, week, or month to see if you&apos;re headed in the right direction</CardDescription>
          <div className="flex gap-2 pt-2">
            {(["day", "week", "month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTrendRange(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${trendRange === r ? "bg-[#1470AF] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {r === "day" ? "By day" : r === "week" ? "By week" : "By month"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-500">No trend data yet.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">{trendLabel}</p>
              {trendData.map(([key, count]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">{key}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-[#1470AF] rounded"
                      style={{
                        width: `${Math.min(100, (count / Math.max(...trendData.map(([, c]) => c), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent page views with IP and time */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent page views
          </CardTitle>
          <CardDescription>Latest views with IP and timestamp</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.recentPageViews.length === 0 ? (
            <p className="text-sm text-gray-500">No page views yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Article / path</th>
                    <th className="pb-2">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentPageViews.slice(0, 25).map((v, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-600">{formatTimestamp(v.timestamp)}</td>
                      <td className="py-2 pr-4">
                        <span className="font-mono text-gray-700 truncate max-w-[200px] inline-block" title={v.path}>
                          {v.articleLabel || v.path || "—"}
                        </span>
                      </td>
                      <td className="py-2 font-mono text-gray-600">{v.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Press Center Generate — totals and by source */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Press Center — Generate button</CardTitle>
          <CardDescription>How many times users hit Generate (Press Release vs Community Request)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Total: <strong>{metrics.pioGenerateCount}</strong> generate{metrics.pioGenerateCount !== 1 ? "s" : ""}
          </p>
          {Object.keys(metrics.pioGenerateBySource).length === 0 ? (
            <p className="text-sm text-gray-500">No Press Center generate events yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(metrics.pioGenerateBySource).map(([source, count]) => (
                <li key={source} className="flex justify-between text-sm">
                  <span className="text-gray-700 capitalize">{source.replace(/_/g, " ")}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Press Center usage by day / week / month / quarter / year */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Press Center usage by period</CardTitle>
          <CardDescription>
            Press generator and community request usage broken down by day, week, month, quarter, or year
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {(["day", "week", "month", "quarter", "year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setPioPeriod(period)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${pioPeriod === period ? "bg-[#1470AF] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                By {period}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const byPeriod =
              pioPeriod === "day"
                ? metrics.pioGenerateByDay
                : pioPeriod === "week"
                  ? metrics.pioGenerateByWeek
                  : pioPeriod === "month"
                    ? metrics.pioGenerateByMonth
                    : pioPeriod === "quarter"
                      ? metrics.pioGenerateByQuarter
                      : metrics.pioGenerateByYear
            const bySource =
              pioPeriod === "day"
                ? metrics.pioGenerateByDayBySource
                : pioPeriod === "week"
                  ? metrics.pioGenerateByWeekBySource
                  : pioPeriod === "month"
                    ? metrics.pioGenerateByMonthBySource
                    : pioPeriod === "quarter"
                      ? metrics.pioGenerateByQuarterBySource
                      : metrics.pioGenerateByYearBySource
            const periodKeys = Object.keys(byPeriod).sort()
            const pressLabel = "Press Release"
            const communityLabel = "Community Request"
            if (periodKeys.length === 0) {
              return <p className="text-sm text-gray-500">No Press Center generate events yet for this period.</p>
            }
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 pr-4">Period</th>
                      <th className="pb-2 pr-4 text-right">{pressLabel}</th>
                      <th className="pb-2 pr-4 text-right">{communityLabel}</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodKeys.map((key) => {
                      const press = bySource.press_release?.[key] ?? 0
                      const community = bySource.community_post?.[key] ?? 0
                      const total = byPeriod[key] ?? 0
                      return (
                        <tr key={key} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium text-gray-800">{key}</td>
                          <td className="py-2 pr-4 text-right text-gray-600">{press}</td>
                          <td className="py-2 pr-4 text-right text-gray-600">{community}</td>
                          <td className="py-2 text-right font-medium">{total}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Legacy: Page views by path + Downloads */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Page views by path</CardTitle>
            <CardDescription>Full URL path (most viewed)</CardDescription>
          </CardHeader>
          <CardContent>
            {topPaths.length === 0 ? (
              <p className="text-sm text-gray-500">No page views yet.</p>
            ) : (
              <ul className="space-y-2">
                {topPaths.map(([path, count]) => (
                  <li key={path} className="flex justify-between text-sm">
                    <span className="font-mono text-gray-700 truncate max-w-[70%]">{path}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Downloads by graphic</CardTitle>
            <CardDescription>Most downloaded post titles</CardDescription>
          </CardHeader>
          <CardContent>
            {topDownloads.length === 0 ? (
              <p className="text-sm text-gray-500">No downloads yet.</p>
            ) : (
              <ul className="space-y-2">
                {topDownloads.map(([name, count]) => (
                  <li key={name} className="flex justify-between text-sm">
                    <span className="text-gray-700 truncate max-w-[70%]">{name}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
