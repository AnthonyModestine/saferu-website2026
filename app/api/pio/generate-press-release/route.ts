import { NextResponse } from "next/server"
import { generatePressReleaseWithAI } from "@/lib/press-release-ai"
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

  if (!checkRateLimit(`pio-pr:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-pr-ip:${ip}`, 60, 60 * 60 * 1000)) {
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
      city: cap(body.city, 100) || "City",
      state: cap(body.state, 50) || "State",
      incidentType: cap(body.incidentType, 100) || "incident",
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
      contactName: cap(body.contactName, 100) || "Contact Name",
      contactPhone: cap(body.contactPhone, 30) || "Phone Number",
      contactPhone2: body.contactPhone2 != null ? cap(body.contactPhone2, 30) || undefined : undefined,
      contactEmail: cap(body.contactEmail, 100) || "email@agency.gov",
    }

    const content = await generatePressReleaseWithAI(payload)
    if (!content) {
      return NextResponse.json(
        { error: "Drafting is temporarily unavailable. Please try again in a few minutes." },
        { status: 503 }
      )
    }
    return NextResponse.json({ content })
  } catch (e) {
    console.error("Generate press release error:", e)
    return NextResponse.json({ error: "Failed to generate press release." }, { status: 500 })
  }
}
