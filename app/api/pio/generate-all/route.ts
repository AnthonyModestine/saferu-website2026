import { NextResponse } from "next/server"
import { generateMultiOutput } from "@/lib/multi-output-ai"
import { getMemberSession } from "@/lib/member-session"

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const body = await request.json()
    const payload = {
      agencyName: String(body.agencyName ?? "").trim() || "Agency Name",
      city: String(body.city ?? "").trim() || "City",
      state: String(body.state ?? "").trim() || "State",
      incidentType: String(body.incidentType ?? "").trim() || "incident",
      incidentSummary: body.incidentSummary != null ? String(body.incidentSummary).trim() : undefined,
      incidentDate: body.incidentDate != null ? String(body.incidentDate).trim() : undefined,
      incidentTime: body.incidentTime != null ? String(body.incidentTime).trim() : undefined,
      location: body.location != null ? String(body.location).trim() : undefined,
      investigationOngoing: Boolean(body.investigationOngoing),
      persons: Array.isArray(body.persons) ? body.persons.map((p: { name?: string; isMinor?: boolean; description?: string }) => ({
        name: String(p?.name ?? "").trim(),
        isMinor: Boolean(p?.isMinor),
        description: String(p?.description ?? "").trim(),
      })) : [],
      entryType: String(body.entryType ?? "none").trim(),
      arrests: Array.isArray(body.arrests) ? body.arrests.map((a: { name?: string; details?: string }) => ({
        name: String(a?.name ?? "").trim(),
        details: String(a?.details ?? "").trim(),
      })) : [],
      propertyDamage: body.propertyDamage != null ? String(body.propertyDamage).trim() : undefined,
      tipLine: body.tipLine != null ? String(body.tipLine).trim() : undefined,
      detectiveContact: body.detectiveContact != null ? String(body.detectiveContact).trim() : undefined,
      resolutionText: body.resolutionText != null ? String(body.resolutionText).trim() : undefined,
      boilerplate: body.boilerplate != null ? String(body.boilerplate).trim() : undefined,
      contactName: String(body.contactName ?? "").trim() || "Contact Name",
      contactPhone: String(body.contactPhone ?? "").trim() || "Phone Number",
      contactPhone2: body.contactPhone2 != null ? String(body.contactPhone2).trim() || undefined : undefined,
      contactEmail: String(body.contactEmail ?? "").trim() || "email@agency.gov",
      requestFootage: Boolean(body.requestFootage),
      footageTimeframe: body.footageTimeframe != null ? String(body.footageTimeframe).trim() : undefined,
      whatToLookFor: body.whatToLookFor != null ? String(body.whatToLookFor).trim() : undefined,
    }

    const result = await generateMultiOutput(payload)
    if (!result) {
      return NextResponse.json(
        { error: "AI generation unavailable. Add OPENAI_API_KEY in Vercel (or .env.local) and try again." },
        { status: 503 }
      )
    }
    return NextResponse.json(result)
  } catch (e) {
    console.error("Generate all outputs error:", e)
    return NextResponse.json({ error: "Failed to generate outputs." }, { status: 500 })
  }
}
