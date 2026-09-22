import { NextResponse } from "next/server"
import { generateMultiOutput } from "@/lib/multi-output-ai"
import { normalizePressReleasePayload } from "@/lib/pio-normalized-facts"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { aiErrorPayload } from "@/lib/ai-result"
import { validatePressReleaseInput } from "@/lib/pio-generate-validation"
import {
  abandonAiTokens,
  reserveAiTokens,
  settleAiTokens,
} from "@/lib/pio-token-gate"
import { TOKEN_ESTIMATES } from "@/lib/openai-usage"

const MAX = 1000

function cap(val: unknown, max = MAX): string {
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

  if (!checkRateLimit(`pio-pr:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-pr-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const reservation = await reserveAiTokens(session.email, TOKEN_ESTIMATES.pressReleasePackage)
  if (!reservation.ok) return reservation.response

  try {
    const body = await request.json()
    const nestedFacts =
      body.facts && typeof body.facts === "object" ? body.facts as Record<string, unknown> : {}
    const validationError = validatePressReleaseInput({
      incidentType: body.incidentType ?? nestedFacts.incidentType ?? nestedFacts.incident_type,
      incidentSummary: body.incidentSummary ?? nestedFacts.incidentSummary ?? nestedFacts.incident_summary,
      otherIncidentType: body.otherIncidentType,
    })
    if (validationError) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const rawType = cap(body.incidentType ?? nestedFacts.incidentType ?? nestedFacts.incident_type, 100)
    const resolvedType =
      rawType === "other" ? cap(body.otherIncidentType, 100) || "other" : rawType

    const payload = normalizePressReleasePayload({ ...body, incidentType: resolvedType })

    const result = await generateMultiOutput(payload, {
      pressRelease: true,
      facebook: false,
      twitter: false,
      talkingPoints: false,
      videoRequest: false,
    })
    if (!result.ok) {
      await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
      console.error("[generate-press-release] AI failed:", result.reason, result.detail ?? "")
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const settled = await settleAiTokens(
      session.email,
      reservation.reservationId,
      reservation.reserved,
      result.tokensUsed
    )

    return NextResponse.json({
      content: result.data.pressRelease,
      ...result.data,
      tokensUsed: settled.amount,
    })
  } catch (e) {
    await abandonAiTokens(session.email, reservation.reservationId, reservation.reserved)
    console.error("Generate press release error:", e)
    return NextResponse.json({ error: "Failed to generate press release." }, { status: 500 })
  }
}
