import { NextResponse } from "next/server"
import { generateCommunityRequestWithAI } from "@/lib/community-request-ai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = {
      agencyName: String(body.agencyName ?? "").trim() || "Agency Name",
      incidentType: String(body.incidentType ?? "").trim() || "incident",
      otherIncidentType: body.otherIncidentType != null ? String(body.otherIncidentType).trim() : undefined,
      address: body.address != null ? String(body.address).trim() : undefined,
      incidentDate: body.incidentDate != null ? String(body.incidentDate).trim() : undefined,
      description: body.description != null ? String(body.description).trim() : undefined,
      footageTimeframe: body.footageTimeframe != null ? String(body.footageTimeframe).trim() : undefined,
      whatToLookFor: body.whatToLookFor != null ? String(body.whatToLookFor).trim() : undefined,
      contactDetails: body.contactDetails != null ? String(body.contactDetails).trim() : undefined,
      caseNumber: body.caseNumber != null ? String(body.caseNumber).trim() : undefined,
      tipLine: body.tipLine != null ? String(body.tipLine).trim() : undefined,
    }

    const content = await generateCommunityRequestWithAI(payload)
    if (!content) {
      return NextResponse.json(
        { error: "AI generation unavailable. Check OPENAI_API_KEY in Vercel or use the template." },
        { status: 503 }
      )
    }
    return NextResponse.json({ content })
  } catch (e) {
    console.error("Generate community request error:", e)
    return NextResponse.json({ error: "Failed to generate community request." }, { status: 500 })
  }
}
