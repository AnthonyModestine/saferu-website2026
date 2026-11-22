import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { renderNextPendingPost } from "@/lib/weekly-campaigns/render-post"

export const maxDuration = 300

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const batchId = String(body.batchId || "").trim()
    const campaignId = String(body.campaignId || "").trim()
    if (!batchId || !campaignId) {
      return NextResponse.json({ error: "batchId and campaignId required" }, { status: 400 })
    }
    const result = await renderNextPendingPost(batchId, campaignId)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[admin/weekly-campaigns/render]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to render graphic" },
      { status: 500 }
    )
  }
}
