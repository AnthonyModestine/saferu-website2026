import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import {
  generationSessionBelongsToMember,
  recordGenerationAction,
  type GenerationActionType,
} from "@/lib/pio-analytics"

const ALLOWED: GenerationActionType[] = [
  "press_release_copied",
  "press_release_downloaded",
  "facebook_copied",
  "spanish_generated",
  "spanish_copied",
  "x_copied",
  "talking_points_downloaded",
  "video_request_copied",
  "video_request_downloaded",
]

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const sessionId = String(body.generationSessionId ?? "").trim()
    const actionType = String(body.actionType ?? "") as GenerationActionType

    if (!sessionId || !ALLOWED.includes(actionType)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const owned = await generationSessionBelongsToMember(
      sessionId,
      session.memberId,
      session.email
    )
    if (!owned) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 })
    }

    await recordGenerationAction(sessionId, actionType)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to record action" }, { status: 500 })
  }
}
