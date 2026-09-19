import { NextResponse } from "next/server"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import { submitGraphicStudioFeedback } from "@/lib/graphic-studio-store"

const NEGATIVE_REASONS = new Set([
  "logo_issue",
  "text_hard_to_read",
  "wrong_visual",
  "inaccurate",
  "looks_unprofessional",
  "other",
])

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-feedback", 40, 80)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  try {
    const body = await request.json()
    const graphicId = String(body.graphicId || "").trim()
    const rating = body.rating === "positive" || body.rating === "negative" ? body.rating : null
    const reason = typeof body.reason === "string" ? body.reason.trim() : ""
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : ""

    if (!graphicId || !rating) {
      return NextResponse.json({ error: "graphicId and rating are required." }, { status: 400 })
    }
    if (rating === "negative" && (!reason || !NEGATIVE_REASONS.has(reason))) {
      return NextResponse.json({ error: "Please choose a reason for the thumbs down." }, { status: 400 })
    }

    const result = await submitGraphicStudioFeedback({
      graphicId,
      userEmail: session.email,
      rating,
      reason: rating === "negative" ? reason : undefined,
      comment: comment || undefined,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[api/pio/graphic-studio/feedback]", err)
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 })
  }
}
