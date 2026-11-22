import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { planWeeklyCampaignBatch } from "@/lib/weekly-campaigns/plan"
import {
  getLatestOpenBatch,
  listWeeklyCampaignBatches,
} from "@/lib/weekly-campaigns/store"

export const maxDuration = 120

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const batches = await listWeeklyCampaignBatches()
    const latest = (await getLatestOpenBatch()) || batches[0] || null
    return NextResponse.json({ batches, latest })
  } catch (err) {
    console.error("[admin/weekly-campaigns] GET", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load campaigns" },
      { status: 500 }
    )
  }
}

export async function POST() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const batch = await planWeeklyCampaignBatch()
    return NextResponse.json({ ok: true, batch })
  } catch (err) {
    console.error("[admin/weekly-campaigns] POST", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to plan campaigns" },
      { status: 500 }
    )
  }
}
