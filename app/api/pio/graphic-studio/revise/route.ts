import { NextResponse } from "next/server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import { reviseSafetyGraphic } from "@/lib/graphic-studio/revise-image"
import {
  getGraphicStudioRecord,
  resolveMemberAgencyLogo,
  updateGraphicImage,
} from "@/lib/graphic-studio-store"
import {
  debitAiTokens,
  outOfTokensResponse,
  rejectIfOutOfTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-revise", 15, 30)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  const outOfTokens = await rejectIfOutOfTokens(session.email)
  if (outOfTokens) return outOfTokens

  try {
    const body = await request.json()
    const imageDataUrl = String(body.imageDataUrl || "").trim()
    const editRequest = String(body.editRequest || body.notes || "").trim()
    const headline = String(body.headline || "").trim()
    const message = String(body.message || "").trim()

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Current graphic is required to make an edit." }, { status: 400 })
    }
    // Vercel request body limit ~4.5MB — reject early with a clear message
    if (imageDataUrl.length > 3_800_000) {
      return NextResponse.json(
        {
          error:
            "This graphic is too large to edit in one request. Refresh and try the edit again.",
        },
        { status: 413 }
      )
    }
    if (editRequest.length < 4) {
      return NextResponse.json(
        { error: "Describe what you want changed (keep it specific)." },
        { status: 400 }
      )
    }

    const agencyLogoUrl = await resolveMemberAgencyLogo(
      session.memberId,
      typeof body.agencyLogoUrl === "string" ? body.agencyLogoUrl : null
    )

    const result = await reviseSafetyGraphic({
      currentImageDataUrl: imageDataUrl,
      editRequest,
      approvedHeadline: headline,
      approvedMessage: message,
      agencyLogoUrl,
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), {
        status: 503,
      })
    }

    const debit = await debitAiTokens(
      session.email,
      result.tokensUsed,
      TOKEN_ESTIMATES.graphicStudioRevise
    )
    if (!debit.ok) return outOfTokensResponse()

    const graphicId = String(body.graphicId || "").trim()
    if (graphicId) {
      const existing = await getGraphicStudioRecord(graphicId)
      if (existing && existing.user_id.toLowerCase() === session.email.toLowerCase()) {
        try {
          const { storeGraphicStudioImageFromDataUrl } = await import(
            "@/lib/graphic-studio/store-image"
          )
          const stored = await storeGraphicStudioImageFromDataUrl(
            graphicId,
            result.data.imageDataUrl
          )
          await updateGraphicImage({
            graphicId,
            userEmail: session.email,
            imageUrl: stored.url,
            status: existing.saved_at ? "saved" : "revised",
            revisionCount: (existing.revision_count || 0) + 1,
            generationModel: result.data.generationModel,
            clearFeedback: true,
          })
        } catch (err) {
          console.warn(
            "[api/pio/graphic-studio/revise] Could not update stored image:",
            err instanceof Error ? err.message : err
          )
        }
      }
    }

    return NextResponse.json({
      imageDataUrl: result.data.imageDataUrl,
      generationModel: result.data.generationModel,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/revise]", err)
    return NextResponse.json({ error: "Failed to revise graphic." }, { status: 500 })
  }
}
