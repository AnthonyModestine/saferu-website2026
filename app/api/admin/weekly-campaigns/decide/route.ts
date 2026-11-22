import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { decideWeeklyCampaign } from "@/lib/weekly-campaigns/publish"

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const batchId = String(body.batchId || "").trim()
    const campaignId = String(body.campaignId || "").trim()
    const decision = body.decision === "approve" || body.decision === "reject" ? body.decision : null
    if (!batchId || !campaignId || !decision) {
      return NextResponse.json(
        { error: "batchId, campaignId, and decision (approve|reject) required" },
        { status: 400 }
      )
    }
    const result = await decideWeeklyCampaign({ batchId, campaignId, decision })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[admin/weekly-campaigns/decide]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to decide campaign" },
      { status: 500 }
    )
  }
}
