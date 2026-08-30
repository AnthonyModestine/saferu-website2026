import { NextResponse } from "next/server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import { generateSafetyGraphic } from "@/lib/graphic-studio/generate"
import { saveGraphicStudioRecord, resolveMemberAgencyLogo } from "@/lib/graphic-studio-store"
import {
  isSafetyAudience,
  isSafetyGraphicStyle,
  isSafetyTipCategory,
  type GraphicStudioSource,
} from "@/lib/pio-graphic-studio-types"

export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-generate", 20, 40)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  try {
    const body = await request.json()
    const category = String(body.category || "Other / Custom").trim()
    const topic = String(body.topic || body.residentNeed || "").trim()
    const audience = String(body.audience || "General Community").trim()
    const style = String(body.style || "Let SaferU Decide").trim()
    const headline = String(body.headline || "").trim()
    const message = String(body.message || body.body || "").trim()
    const visualConcept = String(body.visualConcept || "").trim()
    const visualNotes = String(body.visualNotes || body.visualRequest || "").trim()
    const importantVisualDetails = Array.isArray(body.importantVisualDetails)
      ? body.importantVisualDetails.map((v: unknown) => String(v || "").trim()).filter(Boolean)
      : []
    const agencyName = String(body.agencyName || "").trim()

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
    if (!headline || !message) {
      return NextResponse.json(
        { error: "Approve a headline and message before generating." },
        { status: 400 }
      )
    }
    if (!visualConcept) {
      return NextResponse.json({ error: "Visual concept is required." }, { status: 400 })
    }

    const result = await generateSafetyGraphic({
      approvedHeadline: headline,
      approvedMessage: message,
      visualConcept,
      importantVisualDetails,
      visualNotes,
      style,
      agencyLogoUrl,
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const graphicId = crypto.randomUUID()
    const sources = (Array.isArray(body.sourceRecords) ? body.sourceRecords : []) as GraphicStudioSource[]
    await saveGraphicStudioRecord({
      graphic_id: graphicId,
      agency_id: agencyName || session.email,
      user_id: session.email,
      graphic_type: "safety",
      category,
      audience,
      original_user_request: topic,
      approved_headline: headline,
      approved_supporting_line: "",
      approved_body_copy: message,
      approved_emergency_message: "",
      visual_style: style,
      research_json: {
        visual_concept: visualConcept,
        important_visual_details: importantVisualDetails,
      },
      source_records: sources,
      image_prompt: [headline, message].join(" — "),
      agency_logo_used: Boolean(agencyLogoUrl),
      generation_model: result.data.generationModel,
      generated_at: new Date().toISOString(),
      revision_count: 0,
      status: "generated",
    })

    return NextResponse.json({
      imageDataUrl: result.data.imageDataUrl,
      generationModel: result.data.generationModel,
      graphicId,
      qaPassed: result.data.qaPassed,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/generate]", err)
    return NextResponse.json({ error: "Failed to generate graphic." }, { status: 500 })
  }
}
