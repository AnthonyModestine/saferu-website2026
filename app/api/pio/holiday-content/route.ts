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

  try {
    const body = await request.json()
    const agencyName = String(body.agencyName || "").trim()
    const city = String(body.city || "").trim()
    const state = String(body.state || "").trim()
    const includeBackgrounds = Boolean(body.includeBackgrounds)

    const holidays: HolidayInput[] = Array.isArray(body.holidays)
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
          .filter((item): item is HolidayInput => Boolean(item))
      : []

    if (!holidays.length) {
      return NextResponse.json({ error: "No holidays provided." }, { status: 400 })
    }

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
      return NextResponse.json(
        aiErrorPayload(messagesResult.reason, messagesResult.detail),
        { status: 503 }
      )
    }

    return NextResponse.json({
      messages: messagesResult.data,
      backgrounds: includeBackgrounds ? backgrounds : undefined,
      backgroundsGenerated: includeBackgrounds ? Object.keys(backgrounds).length : 0,
    })
  } catch (e) {
    console.error("Holiday content error:", e)
    return NextResponse.json({ error: "Failed to generate holiday content." }, { status: 500 })
  }
}
