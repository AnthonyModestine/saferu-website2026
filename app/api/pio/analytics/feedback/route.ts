import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import {
  generationSessionBelongsToMember,
  recordGenerationFeedback,
  type FeedbackRating,
  type FeedbackReason,
} from "@/lib/pio-analytics"

const REASONS: FeedbackReason[] = [
  "missing_information",
  "too_long",
  "too_short",
  "wrong_tone",
  "formatting_issue",
  "other",
]

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const generationSessionId = String(body.generationSessionId ?? "").trim()
    const rating = String(body.rating ?? "") as FeedbackRating
    const reason = body.reason ? (String(body.reason) as FeedbackReason) : undefined
    const comment = body.comment != null ? String(body.comment) : undefined

    if (!generationSessionId || (rating !== "positive" && rating !== "negative")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (rating === "negative" && reason && !REASONS.includes(reason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
    }

    const owned = await generationSessionBelongsToMember(
      generationSessionId,
      session.memberId,
      session.email
    )
    if (!owned) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 })
    }

    await recordGenerationFeedback({
      generationSessionId,
      rating,
      reason: rating === "negative" ? reason : undefined,
      comment,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 })
  }
}
