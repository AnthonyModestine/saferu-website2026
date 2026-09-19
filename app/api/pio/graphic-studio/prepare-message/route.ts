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
  debitAiTokens,
  outOfTokensResponse,
  rejectIfOutOfTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

export const maxDuration = 120

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-prepare", 30, 60)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  const outOfTokens = await rejectIfOutOfTokens(session.email)
  if (outOfTokens) return outOfTokens

  try {
    const body = await request.json()
    const category = String(body.category || "Other / Custom").trim()
    const topic = String(body.topic || body.residentNeed || body.prompt || "").trim()
    const audience = String(body.audience || "General Community").trim()
    const style = String(body.style || "Let SaferU Decide").trim()
    const visualNotes = String(body.visualNotes || body.visualRequest || "").trim()

    if (category && !isSafetyTipCategory(category)) {
      return NextResponse.json({ error: "Invalid safety category." }, { status: 400 })
    }
    if ((audience && !isSafetyAudience(audience)) || (style && !isSafetyGraphicStyle(style))) {
      return NextResponse.json({ error: "Invalid audience or style." }, { status: 400 })
    }
    if (topic.length < 8) {
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
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const debit = await debitAiTokens(
      session.email,
      result.tokensUsed,
      TOKEN_ESTIMATES.graphicStudioPrepare
    )
    if (!debit.ok) return outOfTokensResponse()

    return NextResponse.json({
      headline: result.data.headline,
      message: result.data.message,
      messageFormat: result.data.message_format,
      visualConcept: result.data.visual_concept,
      importantVisualDetails: result.data.important_visual_details,
      sourceRecords: result.data.source_records,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/prepare-message]", err)
    return NextResponse.json({ error: "Failed to prepare message." }, { status: 500 })
  }
}
