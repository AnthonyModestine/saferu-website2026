import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import {
  generateSimpleSafetyGraphic,
  suggestSafetyGraphicCaption,
} from "@/lib/graphic-studio-simple"
import { saveGraphicStudioRecord, resolveMemberAgencyLogo } from "@/lib/graphic-studio-store"
import {
  isSafetyTipCategory,
  type GraphicStudioSource,
} from "@/lib/pio-graphic-studio-types"

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

  if (!checkRateLimit(`pio-graphic-safety:${session.email}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many graphic requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-graphic-safety-ip:${ip}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests.", code: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const category = String(body.category || "Other / Custom").trim()
    const topic = String(body.residentNeed || body.prompt || body.topic || "").trim()
    const visualNotes = String(body.visualRequest || body.visualDirection || body.visualConcept || "").trim()
    const agencyName = String(body.agencyName || "").trim()
    const agencyLogoUrl = await resolveMemberAgencyLogo(
      session.memberId,
      typeof body.agencyLogoUrl === "string" ? body.agencyLogoUrl : null
    )

    if (!isSafetyTipCategory(category)) {
      return NextResponse.json({ error: "Choose a safety graphic category." }, { status: 400 })
    }
    if (topic.length < 8) {
      return NextResponse.json(
        { error: "Describe what you want residents to know (at least a short sentence)." },
        { status: 400 }
      )
    }

    const result = await generateSimpleSafetyGraphic({
      topic,
      category,
      visualNotes: visualNotes || undefined,
      agencyName: agencyName || undefined,
      agencyLogoUrl,
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const caption = await suggestSafetyGraphicCaption({
      topic,
      agencyName: agencyName || undefined,
    })

    const graphicId = crypto.randomUUID()
    const sources = (Array.isArray(body.sources) ? body.sources : []) as GraphicStudioSource[]
    const saved = await saveGraphicStudioRecord({
      graphic_id: graphicId,
      agency_id: agencyName || session.email,
      user_id: session.email,
      graphic_type: "safety",
      category,
      audience: "General Community",
      original_user_request: topic,
      approved_headline: "",
      approved_supporting_line: "",
      approved_body_copy: topic,
      approved_emergency_message: "",
      visual_style: "Let SaferU Decide",
      research_json: null,
      source_records: sources,
      image_prompt: topic,
      agency_logo_used: Boolean(agencyLogoUrl),
      generation_model: result.data.model,
      generated_at: new Date().toISOString(),
      revision_count: 0,
      status: "generated",
    })
    if (!saved) {
      console.warn("[api/pio/graphic-studio/safety-tip] generation record not persisted")
    }

    return NextResponse.json({
      imageDataUrl: result.data.dataUrl,
      generationModel: result.data.model,
      graphicId,
      caption,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/safety-tip]", err)
    return NextResponse.json({ error: "Failed to create safety graphic." }, { status: 500 })
  }
}
