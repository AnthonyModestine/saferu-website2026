import { NextResponse } from "next/server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import { researchSafetyGraphic } from "@/lib/graphic-studio/research"
import {
  isSafetyAudience,
  isSafetyGraphicStyle,
  isSafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"
import {
  abandonAiTokens,
  reserveAiTokens,
  settleAiTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

export const maxDuration = 120

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-prepare", 30, 60)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  const reservation = await reserveAiTokens(session.email, TOKEN_ESTIMATES.graphicStudioPrepare)
  if (!reservation.ok) return reservation.response

  try {
    const body = await request.json()
    const category = String(body.category || "Other / Custom").trim()
    const topic = String(body.topic || body.residentNeed || body.prompt || "").trim()
    const audience = String(body.audience || "General Community").trim()
    const style = String(body.style || "Let SaferU Decide").trim()
    const visualNotes = String(body.visualNotes || body.visualRequest || "").trim()

    if (category && !isSafetyTipCategory(category)) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json({ error: "Invalid safety category." }, { status: 400 })
    }
    if ((audience && !isSafetyAudience(audience)) || (style && !isSafetyGraphicStyle(style))) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json({ error: "Invalid audience or style." }, { status: 400 })
    }
    if (topic.length < 8) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json(
        { error: "Describe what residents should know (at least a short sentence)." },
        { status: 400 }
      )
    }

    const result = await researchSafetyGraphic({
      category,
      topic,
      audience,
      style,
      visualNotes,
    })

    if (!result.ok) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    await settleAiTokens(
      session.email,
      reservation.reservationId,
      reservation.reserved,
      result.tokensUsed
    )

    return NextResponse.json({
      headline: result.data.headline,
      message: result.data.message,
      messageFormat: result.data.message_format,
      visualConcept: result.data.visual_concept,
      importantVisualDetails: result.data.important_visual_details,
      sourceRecords: result.data.source_records,
    })
  } catch (err) {
    await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
    console.error("[api/pio/graphic-studio/prepare-message]", err)
    return NextResponse.json({ error: "Failed to prepare message." }, { status: 500 })
  }
}
