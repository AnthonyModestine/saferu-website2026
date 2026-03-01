"use client"

import React, { useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface DashboardMetrics {
  /** All page views by period */
  trendsByDay: Record<string, number>
  trendsByWeek: Record<string, number>
  trendsByMonth: Record<string, number>
  /** Unique visitors (by IP) by period */
  uniqueVisitorsByDay: Record<string, number>
  uniqueVisitorsByWeek: Record<string, number>
  uniqueVisitorsByMonth: Record<string, number>
  pioGenerateByDayBySource: Record<string, Record<string, number>>
  pioGenerateByWeekBySource: Record<string, Record<string, number>>
  pioGenerateByMonthBySource: Record<string, Record<string, number>>
}

function formatPeriodLabel(period: string, granularity: "day" | "week" | "month"): string {
  if (granularity === "month") {
    const [y, m] = period.split("-")
    if (y && m) {
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1)
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }
  }
  if (granularity === "week" || granularity === "day") {
    const d = new Date(period)
    if (!Number.isNaN(d.getTime())) {
      return granularity === "day"
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " (w)"
    }
  }
  return period
}

type ChartDatum = {
  period: string
  visits: number
  unique: number
  pressRelease: number
  communityPost: number
}

function buildChartData(
  metrics: DashboardMetrics,
  granularity: "day" | "week" | "month"
): ChartDatum[] {
  const trendsMap =
    granularity === "day"
      ? metrics.trendsByDay
      : granularity === "week"
        ? metrics.trendsByWeek
        : metrics.trendsByMonth
  const uniqueMap =
    granularity === "day"
      ? metrics.uniqueVisitorsByDay
      : granularity === "week"
        ? metrics.uniqueVisitorsByWeek
        : metrics.uniqueVisitorsByMonth
  const pioMap =
    granularity === "day"
      ? metrics.pioGenerateByDayBySource
      : granularity === "week"
        ? metrics.pioGenerateByWeekBySource
        : metrics.pioGenerateByMonthBySource

  const allKeys = new Set<string>()
  Object.keys(trendsMap).forEach((k) => allKeys.add(k))
  Object.keys(uniqueMap).forEach((k) => allKeys.add(k))
  Object.keys(pioMap).forEach((k) => allKeys.add(k))
  Object.values(pioMap).forEach((bySource) => Object.keys(bySource).forEach((k) => allKeys.add(k)))
  const sorted = Array.from(allKeys).sort()

  const real = sorted.map((period) => ({
    period,
    visits: trendsMap[period] ?? 0,
    unique: uniqueMap[period] ?? 0,
    pressRelease: pioMap[period]?.["press_release"] ?? 0,
    communityPost: pioMap[period]?.["community_post"] ?? 0,
  }))

  if (real.length > 0) return real

  return getExampleChartData(granularity)
}

function getExampleChartData(granularity: "day" | "week" | "month"): ChartDatum[] {
  const now = new Date()
  const data: ChartDatum[] = []
  const visitPattern = [12, 28, 19, 35, 22, 41, 31, 18, 44, 26, 38, 24]
  const uniquePattern = [5, 11, 8, 14, 9, 16, 12, 7, 15, 10, 13, 8]
  const pressPattern = [2, 5, 1, 4, 3, 6, 2, 1, 4, 2, 3, 1]
  const communityPattern = [1, 3, 2, 4, 1, 5, 3, 2, 4, 2, 3, 1]

  if (granularity === "day") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const j = 6 - i
      data.push({
        period: key,
        visits: visitPattern[j % visitPattern.length],
        unique: uniquePattern[j % uniquePattern.length],
        pressRelease: pressPattern[j % pressPattern.length],
        communityPost: communityPattern[j % communityPattern.length],
      })
    }
  } else if (granularity === "week") {
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay() - i * 7)
      const key = d.toISOString().slice(0, 10)
      const j = 3 - i
      data.push({
        period: key,
        visits: visitPattern[j] * 3,
        unique: uniquePattern[j] * 2,
        pressRelease: pressPattern[j] * 2,
        communityPost: communityPattern[j] * 2,
      })
    }
  } else {
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      const j = 2 - i
      data.push({
        period: key,
        visits: visitPattern[j] * 10,
        unique: uniquePattern[j] * 5,
        pressRelease: pressPattern[j] * 8,
        communityPost: communityPattern[j] * 6,
      })
    }
  }
  return data
}

interface Props {
  metrics: DashboardMetrics
}


export function DashboardCharts({ metrics }: Props) {
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day")

  const chartData = useMemo(
    () => buildChartData(metrics, granularity),
    [metrics, granularity]
  )

  const hasRealData = useMemo(() => {
    const trends =
      granularity === "day"
        ? metrics.trendsByDay
        : granularity === "week"
          ? metrics.trendsByWeek
          : metrics.trendsByMonth
    return Object.keys(trends).length > 0
  }, [metrics, granularity])

  const displayData = useMemo(
    () =>
      chartData.map((d) => ({
        ...d,
        label: formatPeriodLabel(d.period, granularity),
      })),
    [chartData, granularity]
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b bg-muted/30 px-6 py-4">
        <div>
          <CardTitle className="text-lg">
            Activity &amp; usage
            {!hasRealData && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">
                Example data
              </span>
            )}
          </CardTitle>
          <CardDescription className="mt-0.5">
            {!hasRealData &&
              "No traffic yet — showing example data. Charts will show real visitors and Press Center usage once you have activity. "}
            Visitors and Press Center usage over time. Filter by days, weeks, or months.
          </CardDescription>
        </div>
        <Tabs
          value={granularity}
          onValueChange={(v) => setGranularity(v as "day" | "week" | "month")}
        >
          <TabsList className="bg-background">
            <TabsTrigger value="day">Days</TabsTrigger>
            <TabsTrigger value="week">Weeks</TabsTrigger>
            <TabsTrigger value="month">Months</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        {/* Visitors: all + unique */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Visitors</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "visits" ? "All visits" : "Unique visitors",
                  ]}
                />
                <Legend formatter={(value) => (value === "visits" ? "All visits" : "Unique visitors")} />
                <Line
                  type="monotone"
                  dataKey="visits"
                  name="visits"
                  stroke="#64748b"
                  strokeWidth={2}
                  dot={{ fill: "#64748b", r: 2.5 }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="unique"
                  name="unique"
                  stroke="#1470AF"
                  strokeWidth={2}
                  dot={{ fill: "#1470AF", r: 2.5 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Press generator */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Press release generator</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: number) => [value, "Press releases"]}
                />
                <Line
                  type="monotone"
                  dataKey="pressRelease"
                  name="Press releases"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ fill: "#059669", r: 2.5 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Community request */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Community request usage</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  formatter={(value: number) => [value, "Community requests"]}
                />
                <Line
                  type="monotone"
                  dataKey="communityPost"
                  name="Community requests"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ fill: "#7c3aed", r: 2.5 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
