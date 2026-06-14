import { NextRequest, NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import { getAdminMetricsDashboard } from "@/lib/admin-metrics"
import { parseDateRange } from "@/lib/pio-analytics"

export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const preset = searchParams.get("preset") ?? "30d"
  const start = searchParams.get("start") ?? undefined
  const end = searchParams.get("end") ?? undefined
  const groupBy = (searchParams.get("groupBy") ?? "day") as "day" | "week" | "month"

  const range = parseDateRange(preset, start, end)
  const data = await getAdminMetricsDashboard(range, groupBy)
  return NextResponse.json(data)
}
