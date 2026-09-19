import { NextResponse } from "next/server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import {
  adjustSafetySocialCaption,
  generateSafetySocialCaption,
  isCaptionAdjustMode,
} from "@/lib/graphic-studio/social-caption"
import {
  debitAiTokens,
  outOfTokensResponse,
  rejectIfOutOfTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

export const maxDuration = 60

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-caption", 40, 80)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  const outOfTokens = await rejectIfOutOfTokens(session.email)
  if (outOfTokens) return outOfTokens

  try {
    const body = await request.json()
    const action = String(body.action || "generate").trim()
    const topic = String(body.topic || "").trim()
    const headline = String(body.headline || "").trim()
    const message = String(body.message || "").trim()
    const agencyName = String(body.agencyName || "").trim()
    const caption = String(body.caption || "").trim()
    const mode = String(body.mode || "").trim()

    if (action === "adjust") {
      if (!isCaptionAdjustMode(mode)) {
        return NextResponse.json({ error: "Choose a valid caption adjustment." }, { status: 400 })
      }
      if (caption.length < 8) {
        return NextResponse.json({ error: "Generate a caption before adjusting it." }, { status: 400 })
      }
      const result = await adjustSafetySocialCaption({
        caption,
        mode,
        headline,
        message,
        agencyName,
      })
      if (!result.ok) {
        return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), {
          status: 503,
        })
      }
      const debit = await debitAiTokens(
        session.email,
        result.tokensUsed,
        TOKEN_ESTIMATES.graphicStudioCaption
      )
      if (!debit.ok) return outOfTokensResponse()
      return NextResponse.json({ caption: result.data, mode })
    }

    const result = await generateSafetySocialCaption({
      topic,
      headline,
      message,
      agencyName,
    })
    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), {
        status: 503,
      })
    }
    const debit = await debitAiTokens(
      session.email,
      result.tokensUsed,
      TOKEN_ESTIMATES.graphicStudioCaption
    )
    if (!debit.ok) return outOfTokensResponse()
    return NextResponse.json({ caption: result.data })
  } catch (err) {
    console.error("[api/pio/graphic-studio/caption]", err)
    return NextResponse.json({ error: "Failed to craft social caption." }, { status: 500 })
  }
}
