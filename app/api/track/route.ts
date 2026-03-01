import { NextRequest, NextResponse } from "next/server"
import { recordEvent } from "@/lib/metrics"
import type { TrackEvent } from "@/lib/metrics"

function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  const cf = request.headers.get("cf-connecting-ip")
  if (cf) return cf
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, path, name, postId, postTitle, source, ...rest } = body as {
      event: TrackEvent
      path?: string
      name?: string
      postId?: string
      postTitle?: string
      source?: string
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
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
