import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { aiErrorPayload } from "@/lib/ai-result"
import { generateSafetyTipGraphicImage } from "@/lib/pio-graphic-studio-ai"
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

    const agencyLogoUrl =
      typeof body.agencyLogoUrl === "string" &&
      (body.agencyLogoUrl.startsWith("data:") || body.agencyLogoUrl.startsWith("/"))
        ? body.agencyLogoUrl
        : null

    const result = await generateSafetyTipGraphicImage({
      category: String(body.category || "Other / Custom"),
      headline: String(body.headline || ""),
      supportingLine: String(body.supportingLine || ""),
      body: String(body.body || ""),
      emergencyMessage: String(body.emergencyMessage || ""),
      audience: String(body.audience || "General Community"),
      visualDirection: String(body.visualDirection || ""),
      style: String(body.style || "Let SaferU Decide"),
      agencyLogoUrl,
      sourceImageDataUrl,
      revisionRequest,
    })

    if (!result.ok) {
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
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
