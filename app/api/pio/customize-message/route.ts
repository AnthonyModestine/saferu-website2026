import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { aiErrorPayload } from "@/lib/ai-result"
import {
  customizeCuratedMessage,
  generateMessageFromOpportunity,
} from "@/lib/post-generator-ai"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { formatDepartmentLabel } from "@/lib/department-types"
import type { CustomizeMessageMode } from "@/lib/post-generator/types"
import { resolveEventHolidayContext } from "@/lib/event-message-prompts"
import {
  abandonAiTokens,
  reserveAiTokens,
  settleAiTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

export const maxDuration = 30

const CUSTOMIZE_MODES: CustomizeMessageMode[] = [
  "shorten",
  "longer",
  "more_excited",
  "conversational",
  "formal",
  "facebook",
  "instagram",
  "twitter",
  "add_emojis",
  "remove_emojis",
]

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

  if (!checkRateLimit(`pio-customize:${session.email}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-customize-ip:${ip}`, 120, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const reservation = await reserveAiTokens(session.email, TOKEN_ESTIMATES.customizeMessage)
  if (!reservation.ok) return reservation.response

  try {
    const body = await request.json()
    const action = String(body.action || "customize")

    if (action === "generate") {
      const fitRaw = String(body.jurisdictionFit || "")
      const jurisdictionFit =
        fitRaw === "own" || fitRaw === "nearby" || fitRaw === "regional" || fitRaw === "unknown"
          ? fitRaw
          : undefined
      const result = await generateMessageFromOpportunity(
        String(body.title || ""),
        String(body.whyItMatters || ""),
        Array.isArray(body.verifiedFacts) ? body.verifiedFacts.map(String) : [],
        Array.isArray(body.doNotClaim) ? body.doNotClaim.map(String) : [],
        Array.isArray(body.publicCallToAction) ? body.publicCallToAction.map(String) : [],
        String(body.recommendedAction || ""),
        String(body.agencyName || ""),
        String(body.city || ""),
        String(body.state || ""),
        String(body.summary || ""),
        String(body.sourceLabel || ""),
        String(body.agencyType || body.departmentType || ""),
        String(body.agencyTypeOther || body.departmentOther || ""),
        String(body.messagingAngle || body.whyThisAgency || ""),
        jurisdictionFit
      )
      if (!result.ok) {
        await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
        return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
      }
      const settled = await settleAiTokens(
        session.email,
        reservation.reservationId,
        reservation.reserved,
        null
      )
      return NextResponse.json({ message: result.data, tokensUsed: settled.amount })
    }

    const mode = String(body.mode || "shorten") as CustomizeMessageMode
    if (!CUSTOMIZE_MODES.includes(mode)) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json({ error: "Invalid customize mode." }, { status: 400 })
    }

    const message = String(body.message || "").trim()
    if (!message) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json({ error: "Add a message before customizing." }, { status: 400 })
    }

    const verifiedFactsRaw = Array.isArray(body.verifiedFacts) ? body.verifiedFacts.map(String) : []
    const verifiedFacts = verifiedFactsRaw
      .map((text: string) => text.trim())
      .filter(Boolean)
      .map((text: string, index: number) => ({
        id: `fact-${index + 1}`,
        text,
      }))

    const agencyType = formatDepartmentLabel(
      String(body.agencyType || body.departmentType || ""),
      String(body.agencyTypeOther || body.departmentOther || "")
    )

    const holiday = resolveEventHolidayContext({
      eventDate: String(body.eventDate || ""),
      eventName: String(body.eventName || body.title || ""),
      eventDescription: String(body.eventDescription || ""),
      eventType: String(body.eventType || ""),
    })

    const result = await customizeCuratedMessage(
      message,
      mode,
      String(body.agencyName || ""),
      {
        city: String(body.city || ""),
        state: String(body.state || ""),
      },
      {
        agencyType,
        verifiedFacts,
        holidayEmojiFocus: holiday?.emojiFocus,
      }
    )
    if (!result.ok) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }
    const settled = await settleAiTokens(
      session.email,
      reservation.reservationId,
      reservation.reserved,
      null
    )
    return NextResponse.json({ message: result.data, tokensUsed: settled.amount })
  } catch (e) {
    await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
    console.error("Customize message error:", e)
    return NextResponse.json({ error: "Failed to customize message." }, { status: 500 })
  }
}
