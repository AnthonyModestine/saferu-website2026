import { NextRequest, NextResponse } from "next/server"
import { recordEvent } from "@/lib/metrics"
import type { TrackEvent } from "@/lib/metrics"
import { recordContentEvent, parseContentPath } from "@/lib/content-analytics"
import { getMemberSession } from "@/lib/member-session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`track:${ip}`, 120, 60 * 1000)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const body = await request.json()
    const { event, path, name, postId, postTitle, source, sessionId, ...rest } = body as {
      event: TrackEvent
      path?: string
      name?: string
      postId?: string
      postTitle?: string
      source?: string
      sessionId?: string
      [key: string]: unknown
    }
    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "Missing or invalid event" }, { status: 400 })
    }
    const allowed: TrackEvent[] = ["page_view", "download", "copy", "log", "pio_generate", "signup"]
    if (!allowed.includes(event)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }
    const ip = getClientIp(request)
    const userAgent = request.headers.get("user-agent") ?? undefined
    const memberSession = await getMemberSession()
    const memberEmail = memberSession?.email
    recordEvent({
      event,
      path,
      name,
      postId,
      postTitle,
      source,
      ip,
      userAgent,
      ...rest,
    })

    if (event === "page_view" || event === "copy" || event === "download") {
      const parsed = path ? parseContentPath(path) : {}
      await recordContentEvent({
        eventType: event,
        path,
        postId,
        postTitle,
        sessionId: typeof sessionId === "string" ? sessionId.slice(0, 80) : undefined,
        memberEmail,
        categoryId: parsed.categoryId,
        subcategoryId: parsed.subcategoryId,
        articleId: parsed.articleId,
        articleTitle: postTitle,
        ip,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
