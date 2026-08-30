import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { generateSimpleSafetyGraphic } from "@/lib/graphic-studio-simple"
import { getGraphicStudioRecord, saveGraphicStudioRecord } from "@/lib/graphic-studio-store"

export const maxDuration = 120

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive, localPreview] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
    isLocalPreviewServer(),
  ])
  if (!stripePaid && !trialActive && !localPreview) {
    return NextResponse.json({ error: "Press Center subscription required" }, { status: 403 })
  }

  if (!checkRateLimit(`pio-graphic-revise:${session.email}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many revision requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const revisionRequest = String(body.revisionRequest || "").trim()
    const sourceImageDataUrl =
      typeof body.sourceImageDataUrl === "string" && body.sourceImageDataUrl.startsWith("data:")
        ? body.sourceImageDataUrl
        : null
    if (!revisionRequest || !sourceImageDataUrl) {
      return NextResponse.json(
        { error: "Provide the current graphic and the change you want." },
        { status: 400 }
      )
    }

    const result = await generateSimpleSafetyGraphic({
      topic: String(body.residentNeed || body.topic || "safety graphic").trim(),
      revisionRequest,
      sourceImageDataUrl,
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const graphicId = String(body.graphicId || "")
    if (graphicId) {
      const existing = await getGraphicStudioRecord(graphicId)
      if (existing && existing.user_id === session.email) {
        await saveGraphicStudioRecord({
          ...existing,
          revision_count: existing.revision_count + 1,
          status: "revised",
          generated_at: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      imageDataUrl: result.data.dataUrl,
      generationModel: result.data.model,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/revise]", err)
    return NextResponse.json({ error: "Failed to revise graphic." }, { status: 500 })
  }
}
