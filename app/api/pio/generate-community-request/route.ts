import { NextResponse } from "next/server"
import { generateMultiOutput } from "@/lib/multi-output-ai"
import { normalizePressReleasePayload } from "@/lib/pio-normalized-facts"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { consumeGeneration, getGenerationStatus } from "@/lib/pio-generations"
import { aiErrorPayload } from "@/lib/ai-result"
import { validateVideoRequestInput } from "@/lib/pio-generate-validation"
import { logVideoRequestSession } from "@/lib/pio-session-helper"
import { resolveMemberDepartment } from "@/lib/member-profile"

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

  if (!checkRateLimit(`pio-cr:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-cr-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const status = await getGenerationStatus(session.email)
  if (status.remaining === 0) {
    return NextResponse.json(
      { error: "You have used all your generations for this month. Purchase a generation pack to continue." },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    const validationError = validateVideoRequestInput({
      incidentType: body.incidentType,
      otherIncidentType: body.otherIncidentType,
      description: body.description,
      whatToLookFor: body.whatToLookFor,
      footageTimeframe: body.footageTimeframe,
      address: body.address,
    })
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const rawType = cap(body.incidentType, 100)
    const resolvedType =
      rawType === "other" ? cap(body.otherIncidentType, 100) || "other" : rawType

    const userPayload = normalizePressReleasePayload({
      agencyName: cap(body.agencyName, 100),
      incidentType: resolvedType,
      location: body.address != null ? cap(body.address, 200) : undefined,
      incidentDate: body.incidentDate != null ? cap(body.incidentDate, 20) : undefined,
      incidentSummary: body.description != null ? cap(body.description, 4500) : undefined,
      investigationOngoing: true,
      persons: [],
      arrests: [],
      entryType: "none",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      requestFootage: true,
      footageTimeframe: body.footageTimeframe != null ? cap(body.footageTimeframe, 200) : undefined,
      whatToLookFor: body.whatToLookFor != null ? cap(body.whatToLookFor, 500) : undefined,
      detectiveContact: body.contactDetails != null ? cap(body.contactDetails, 200) : undefined,
      caseNumber: body.caseNumber != null ? cap(body.caseNumber, 50) : undefined,
      tipLine: body.tipLine != null ? cap(body.tipLine, 100) : undefined,
    })

    const result = await generateMultiOutput(userPayload, {
      pressRelease: false,
      facebook: false,
      twitter: false,
      talkingPoints: false,
      videoRequest: true,
    })
    if (!result.ok) {
      console.error("[generate-community-request] AI failed:", result.reason, result.detail ?? "")
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const consumed = await consumeGeneration(session.email)
    if (!consumed) {
      return NextResponse.json(
        { error: "You have used all your generations for this month. Purchase a generation pack to continue." },
        { status: 403 }
      )
    }

    const { departmentType, departmentOther } = await resolveMemberDepartment(session.email, {
      departmentType: typeof body.departmentType === "string" ? body.departmentType : body.agencyType,
      departmentOther: body.departmentOther,
    })

    const sessionId = await logVideoRequestSession({
      memberSession: session,
      stripePaid,
      trialActive,
      agencyName: cap(body.agencyName, 100) || undefined,
      departmentType,
      departmentOther,
      incidentType: resolvedType,
    })

    return NextResponse.json({
      content: result.data.communityRequest || "",
      ...result.data,
      sessionId,
    })
  } catch (e) {
    console.error("Generate video request error:", e)
    return NextResponse.json({ error: "Failed to generate video request." }, { status: 500 })
  }
}
