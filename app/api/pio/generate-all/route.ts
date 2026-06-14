import { NextResponse } from "next/server"
import { generateMultiOutput } from "@/lib/multi-output-ai"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { consumeGeneration, getGenerationStatus } from "@/lib/pio-generations"
import { aiErrorPayload } from "@/lib/ai-result"
import { validatePressReleaseInput } from "@/lib/pio-generate-validation"
import { logPressReleaseSessions } from "@/lib/pio-session-helper"
import { resolveMemberDepartment } from "@/lib/member-profile"

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

    const validationError = validatePressReleaseInput({
      incidentType: body.incidentType,
      incidentSummary: body.incidentSummary,
      otherIncidentType: body.otherIncidentType,
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const rawType = cap(body.incidentType, 100)
    const resolvedType =
      rawType === "other" ? cap(body.otherIncidentType, 100) || "other" : rawType

    const payload = {
      agencyName: cap(body.agencyName, 100),
      city: cap(body.city, 100),
      state: cap(body.state, 50),
      incidentType: resolvedType,
      incidentSummary: body.incidentSummary != null ? cap(body.incidentSummary, 4500) : undefined,
      incidentDate: body.incidentDate != null ? cap(body.incidentDate, 20) : undefined,
      incidentTime: body.incidentTime != null ? cap(body.incidentTime, 20) : undefined,
      location: body.location != null ? cap(body.location, 200) : undefined,
      investigationOngoing: Boolean(body.investigationOngoing),
      persons: Array.isArray(body.persons) ? body.persons.slice(0, 10).map((p: { name?: string; isMinor?: boolean; description?: string }) => ({
        name: cap(p?.name, 100),
        isMinor: Boolean(p?.isMinor),
        description: cap(p?.description, 500),
      })) : [],
      entryType: cap(body.entryType, 20) || "none",
      arrests: Array.isArray(body.arrests) ? body.arrests.slice(0, 10).map((a: { name?: string; details?: string }) => ({
        name: cap(a?.name, 100),
        details: cap(a?.details, 500),
      })) : [],
      propertyDamage: body.propertyDamage != null ? cap(body.propertyDamage, 500) : undefined,
      tipLine: body.tipLine != null ? cap(body.tipLine, 100) : undefined,
      detectiveContact: body.detectiveContact != null ? cap(body.detectiveContact, 200) : undefined,
      resolutionText: body.resolutionText != null ? cap(body.resolutionText, 500) : undefined,
      boilerplate: body.boilerplate != null ? cap(body.boilerplate, 1000) : undefined,
      contactName: cap(body.contactName, 100),
      contactPhone: cap(body.contactPhone, 30),
      contactPhone2: body.contactPhone2 != null ? cap(body.contactPhone2, 30) || undefined : undefined,
      contactEmail: cap(body.contactEmail, 100),
      requestFootage: Boolean(body.requestFootage),
      footageTimeframe: body.footageTimeframe != null ? cap(body.footageTimeframe, 200) : undefined,
      whatToLookFor: body.whatToLookFor != null ? cap(body.whatToLookFor, 500) : undefined,
      onlineTipsUrl: body.onlineTipsUrl != null ? cap(body.onlineTipsUrl, 200) : undefined,
    }

    const result = await generateMultiOutput(payload)
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

    const includeVideoRequest =
      payload.investigationOngoing ||
      payload.requestFootage ||
      Boolean(payload.footageTimeframe?.trim() || payload.whatToLookFor?.trim())

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
