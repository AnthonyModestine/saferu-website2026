import { NextResponse } from "next/server"
import { getAggregatedMetrics } from "@/lib/metrics"
import { checkAdminSession } from "@/lib/admin-auth"

export async function GET() {
  const isAdmin = await checkAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const metrics = getAggregatedMetrics()
  return NextResponse.json(metrics)
}
