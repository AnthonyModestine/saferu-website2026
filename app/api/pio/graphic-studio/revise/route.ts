import { NextResponse } from "next/server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import { reviseSafetyGraphic } from "@/lib/graphic-studio/revise-image"
import { resolveMemberAgencyLogo } from "@/lib/graphic-studio-store"

export const maxDuration = 300

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-revise", 15, 30)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  try {
    const body = await request.json()
    const imageDataUrl = String(body.imageDataUrl || "").trim()
    const editRequest = String(body.editRequest || body.notes || "").trim()
    const headline = String(body.headline || "").trim()
    const message = String(body.message || "").trim()

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Current graphic is required to make an edit." }, { status: 400 })
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

    return NextResponse.json({
      imageDataUrl: result.data.imageDataUrl,
      generationModel: result.data.generationModel,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/revise]", err)
    return NextResponse.json({ error: "Failed to revise graphic." }, { status: 500 })
  }
}
