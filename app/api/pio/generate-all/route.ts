import { NextResponse } from "next/server"
import {
  generateMultiOutput,
  parseMultiOutputSelection,
  selectionHasAny,
  type MultiOutputSelection,
} from "@/lib/multi-output-ai"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { consumeGeneration, getGenerationStatus } from "@/lib/pio-generations"
import { aiErrorPayload } from "@/lib/ai-result"
import { validatePressReleaseInput } from "@/lib/pio-generate-validation"
import { logPressReleaseSessions } from "@/lib/pio-session-helper"
import { resolveMemberDepartment } from "@/lib/member-profile"
import { normalizePressReleasePayload } from "@/lib/pio-normalized-facts"

const MAX = 1000 // max chars for free-text fields

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

  // Rate limit: 30 generation requests per hour per user
  if (!checkRateLimit(`pio-all:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  // Rate limit by IP as secondary check
  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-all-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  let status
  try {
    status = await getGenerationStatus(session.email)
  } catch (e) {
    console.error("[generate-all] generation status error:", e)
    return NextResponse.json(
      { error: "Could not verify generation quota. Check database connection.", code: "quota_error" },
      { status: 500 }
    )
  }
  if (status.remaining === 0) {
    return NextResponse.json(
      { error: "You have used all your generations for this month. Purchase a generation pack to continue." },
      { status: 403 }
    )
  }

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
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const rawType = cap(body.incidentType ?? nestedFacts.incidentType ?? nestedFacts.incident_type, 100)
    const resolvedType =
      rawType === "other" ? cap(body.otherIncidentType, 100) || "other" : rawType

    const payload = normalizePressReleasePayload({
      ...body,
      incidentType: resolvedType,
    })

    const parsedSelection = parseMultiOutputSelection(body.outputs)
    // If client doesn't send outputs, keep legacy "generate everything" behavior
    const selection: MultiOutputSelection = parsedSelection ?? {
      pressRelease: true,
      facebook: true,
      twitter: true,
      talkingPoints: true,
      videoRequest:
        payload.investigationOngoing ||
        payload.requestFootage ||
        Boolean(payload.footageTimeframe?.trim() || payload.whatToLookFor?.trim()),
    }
    if (!selectionHasAny(selection)) {
      return NextResponse.json(
        { error: "Select at least one message type to generate." },
        { status: 400 }
      )
    }

    const result = await generateMultiOutput(payload, selection)
    if (!result.ok) {
      console.error("[generate-all] AI failed:", result.reason, result.detail ?? "")
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const consumed = await consumeGeneration(session.email)
    if (!consumed) {
      return NextResponse.json(
        { error: "You have used all your generations for this month. Purchase a generation pack to continue." },
        { status: 403 }
      )
    }

    const includeVideoRequest = Boolean(selection.videoRequest && result.data.communityRequest)

    const { departmentType, departmentOther } = await resolveMemberDepartment(session.email, {
      departmentType: typeof body.departmentType === "string" ? body.departmentType : body.agencyType,
      departmentOther: body.departmentOther,
    })

    const sessionIds = await logPressReleaseSessions({
      memberSession: session,
      stripePaid,
      trialActive,
      agencyName: payload.agencyName || undefined,
      departmentType,
      departmentOther,
      incidentType: resolvedType,
      investigationOngoing: payload.investigationOngoing,
      includeVideoRequest,
    })

    return NextResponse.json({ ...result.data, sessionIds })
  } catch (e) {
    console.error("Generate all outputs error:", e)
    return NextResponse.json({ error: "Failed to generate outputs." }, { status: 500 })
  }
}
