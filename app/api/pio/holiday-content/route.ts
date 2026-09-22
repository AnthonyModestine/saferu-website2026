import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit } from "@/lib/rate-limit"
import { aiErrorPayload } from "@/lib/ai-result"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { generateHolidayMessagesBatch } from "@/lib/post-generator-ai"
import {
  generateHolidayBackgroundsBatch,
  type HolidayBackgroundRequest,
} from "@/lib/pio-holiday-image-ai"
import type { HolidayTheme } from "@/lib/pio-holiday-graphic"
import {
  abandonAiTokens,
  reserveAiTokens,
  settleAiTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

type HolidayInput = {
  id: string
  label: string
  slogan: string
  theme: HolidayTheme
}

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive, localPreview] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
    isLocalPreviewServer(),
  ])
  if (!stripePaid && !trialActive && !localPreview) {
    return NextResponse.json({ error: "Press Center subscription required" }, { status: 403 })
  }

  if (!checkRateLimit(`pio-holiday-content:${session.email}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  let includeBackgrounds = false
  let agencyName = ""
  let city = ""
  let state = ""
  let holidays: HolidayInput[] = []

  try {
    const body = await request.json()
    agencyName = String(body.agencyName || "").trim()
    city = String(body.city || "").trim()
    state = String(body.state || "").trim()
    includeBackgrounds = Boolean(body.includeBackgrounds)

    holidays = Array.isArray(body.holidays)
      ? body.holidays
          .map((item: unknown) => {
            if (!item || typeof item !== "object") return null
            const o = item as Record<string, unknown>
            const id = String(o.id || "").trim()
            const label = String(o.label || "").trim()
            const slogan = String(o.slogan || "").trim()
            const theme = String(o.theme || "default").trim() as HolidayTheme
            if (!id || !label) return null
            return { id, label, slogan, theme }
          })
          .filter((item: HolidayInput | null): item is HolidayInput => Boolean(item))
      : []
  } catch (e) {
    console.error("Holiday content error:", e)
    return NextResponse.json({ error: "Failed to generate holiday content." }, { status: 500 })
  }

  if (!holidays.length) {
    return NextResponse.json({ error: "No holidays provided." }, { status: 400 })
  }

  const estimate = includeBackgrounds
    ? TOKEN_ESTIMATES.holidayContentWithBackgrounds
    : TOKEN_ESTIMATES.holidayContent
  const reservation = await reserveAiTokens(session.email, estimate)
  if (!reservation.ok) return reservation.response

  try {
    const [messagesResult, backgrounds] = await Promise.all([
      generateHolidayMessagesBatch(holidays, agencyName, city, state),
      includeBackgrounds
        ? generateHolidayBackgroundsBatch(
            holidays.map(
              (h): HolidayBackgroundRequest => ({
                id: h.id,
                label: h.label,
                theme: h.theme,
              })
            ),
            2
          )
        : Promise.resolve({} as Record<string, string>),
    ])

    if (!messagesResult.ok) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json(
        aiErrorPayload(messagesResult.reason, messagesResult.detail),
        { status: 503 }
      )
    }

    const settled = await settleAiTokens(
      session.email,
      reservation.reservationId,
      reservation.reserved,
      null
    )

    return NextResponse.json({
      messages: messagesResult.data,
      backgrounds: includeBackgrounds ? backgrounds : undefined,
      backgroundsGenerated: includeBackgrounds ? Object.keys(backgrounds).length : 0,
      tokensUsed: settled.amount,
    })
  } catch (e) {
    await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
    console.error("Holiday content error:", e)
    return NextResponse.json({ error: "Failed to generate holiday content." }, { status: 500 })
  }
}
