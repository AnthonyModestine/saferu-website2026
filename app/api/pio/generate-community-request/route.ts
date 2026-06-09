import { NextResponse } from "next/server"
import { generateCommunityRequestWithAI } from "@/lib/community-request-ai"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { consumeGeneration } from "@/lib/pio-generations"

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

  const allowed = await consumeGeneration(session.email)
  if (!allowed) {
    return NextResponse.json(
      { error: "You have used all your generations for this month. Purchase a generation pack to continue." },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const payload = {
      agencyName: cap(body.agencyName, 100) || "Agency Name",
      incidentType: cap(body.incidentType, 100) || "incident",
      otherIncidentType: body.otherIncidentType != null ? cap(body.otherIncidentType, 100) : undefined,
      address: body.address != null ? cap(body.address, 200) : undefined,
      incidentDate: body.incidentDate != null ? cap(body.incidentDate, 20) : undefined,
      description: body.description != null ? cap(body.description, 4500) : undefined,
      footageTimeframe: body.footageTimeframe != null ? cap(body.footageTimeframe, 200) : undefined,
      whatToLookFor: body.whatToLookFor != null ? cap(body.whatToLookFor, 500) : undefined,
      contactDetails: body.contactDetails != null ? cap(body.contactDetails, 200) : undefined,
      caseNumber: body.caseNumber != null ? cap(body.caseNumber, 50) : undefined,
      tipLine: body.tipLine != null ? cap(body.tipLine, 100) : undefined,
    }

    const content = await generateCommunityRequestWithAI(payload)
    if (!content) {
      return NextResponse.json(
        { error: "Drafting is temporarily unavailable. Please try again in a few minutes." },
        { status: 503 }
      )
    }
    return NextResponse.json({ content })
  } catch (e) {
    console.error("Generate video request error:", e)
    return NextResponse.json({ error: "Failed to generate video request." }, { status: 500 })
  }
}
