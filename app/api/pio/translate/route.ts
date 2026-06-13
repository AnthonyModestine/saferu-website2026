import { NextResponse } from "next/server"
import { translateToAmericanSpanish } from "@/lib/pio-translate-ai"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { aiErrorPayload } from "@/lib/ai-result"

const MAX_TEXT = 5000

function cap(val: unknown, max = MAX_TEXT): string {
  return String(val ?? "").trim().slice(0, max)
}

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
  ])
  if (!stripePaid && !trialActive) {
    return NextResponse.json({ error: "Press Center subscription required" }, { status: 403 })
  }

  if (!checkRateLimit(`pio-tr:${session.email}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-tr-ip:${ip}`, 120, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const text = cap(body.text)
    if (!text) {
      return NextResponse.json(
        { error: "Nothing to translate. Generate a Facebook post first." },
        { status: 400 }
      )
    }

    const result = await translateToAmericanSpanish(text)
    if (!result.ok) {
      console.error("[translate] AI failed:", result.reason, result.detail ?? "")
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    return NextResponse.json({ translation: result.data })
  } catch (e) {
    console.error("Translate error:", e)
    return NextResponse.json({ error: "Failed to translate." }, { status: 500 })
  }
}
