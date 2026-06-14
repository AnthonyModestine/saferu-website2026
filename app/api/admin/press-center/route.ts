import { NextRequest, NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import { getPressCenterDashboard, parseDateRange } from "@/lib/pio-analytics"
import { getContentAnalytics } from "@/lib/content-analytics"
import { getAllArticlePaths } from "@/lib/content-paths"

export async function GET(request: NextRequest) {
  const ok = await checkAdminSession()
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const preset = searchParams.get("preset") ?? "30d"
  const start = searchParams.get("start") ?? undefined
  const end = searchParams.get("end") ?? undefined
  const groupBy = (searchParams.get("groupBy") ?? "day") as "day" | "week" | "month"

  const range = parseDateRange(preset, start, end)
  const [pressCenter, content] = await Promise.all([
    getPressCenterDashboard(range, groupBy),
    getContentAnalytics(range, getAllArticlePaths()),
  ])

  return NextResponse.json({ pressCenter, content })
}
