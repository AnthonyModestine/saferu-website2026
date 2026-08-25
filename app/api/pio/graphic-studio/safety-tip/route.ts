import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { generateSafetyTipGraphicImage } from "@/lib/pio-graphic-studio-ai"
import { saveGraphicStudioRecord, resolveMemberAgencyLogo } from "@/lib/graphic-studio-store"
import {
  isSafetyAudience,
  isSafetyGraphicStyle,
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
    const category = String(body.category || "").trim()
    const residentNeed = String(body.residentNeed || body.prompt || "").trim()
    const audience = String(body.audience || "General Community").trim()
    const style = String(body.style || "Let SaferU Decide").trim()
    const headline = String(body.headline || "").trim()
    const supportingLine = String(body.supportingLine || "").trim()
    const copyBody = String(body.body || "").trim()
    const emergencyMessage = String(body.emergencyMessage || "").trim()
    const visualDirection = String(body.visualDirection || body.visualConcept || "").trim()
    const verifiedTopic = String(body.verifiedTopic || category).trim()
    const agencyLogoUrl = await resolveMemberAgencyLogo(
      session.memberId,
      typeof body.agencyLogoUrl === "string" ? body.agencyLogoUrl : null
    )

    if (!isSafetyTipCategory(category)) {
      return NextResponse.json({ error: "Choose a safety graphic category." }, { status: 400 })
    }
    if (!isSafetyAudience(audience) || !isSafetyGraphicStyle(style)) {
      return NextResponse.json({ error: "Choose audience and style." }, { status: 400 })
    }
    if (!headline || !copyBody) {
      return NextResponse.json(
        { error: "Approve a headline and safety message before generating." },
        { status: 400 }
      )
    }

    const mustShow = Array.isArray(body.mustShow)
      ? body.mustShow.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : []
    const mustAvoid = Array.isArray(body.mustAvoid)
      ? body.mustAvoid.map((item: unknown) => String(item || "").trim()).filter(Boolean)
      : []

    const result = await generateSafetyTipGraphicImage({
      category,
      headline,
      supportingLine,
      body: copyBody,
      emergencyMessage,
      audience,
      visualDirection,
      style,
      mustShow,
      mustAvoid,
      verifiedTopic,
      residentNeed,
      agencyLogoUrl,
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const graphicId = crypto.randomUUID()
    const sources = (Array.isArray(body.sources) ? body.sources : []) as GraphicStudioSource[]
    await saveGraphicStudioRecord({
      graphic_id: graphicId,
      agency_id: String(body.agencyName || session.email),
      user_id: session.email,
      graphic_type: "safety",
      category,
      audience,
      original_user_request: residentNeed,
      approved_headline: headline,
      approved_supporting_line: supportingLine,
      approved_body_copy: copyBody,
      approved_emergency_message: emergencyMessage,
      visual_style: style,
      research_json: body.research ?? null,
      source_records: sources,
      image_prompt: verifiedTopic,
      agency_logo_used: Boolean(agencyLogoUrl),
      generation_model: result.data.model,
      generated_at: new Date().toISOString(),
      revision_count: 0,
      status: "generated",
    })

    return NextResponse.json({
      imageDataUrl: result.data.dataUrl,
      generationModel: result.data.model,
      graphicId,
      headline,
      supportingLine,
      body: copyBody,
      emergencyMessage,
      caption: String(body.caption || copyBody),
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/safety-tip]", err)
    return NextResponse.json({ error: "Failed to create safety graphic." }, { status: 500 })
  }
}
