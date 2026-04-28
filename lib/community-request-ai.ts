/**
 * Generate community request (footage request / community alert) text using OpenAI.
 * Uses OPENAI_API_KEY (same as press release). Falls back to template if key missing or request fails.
 *
 * To use YOUR prompt + user info: edit SYSTEM_PROMPT below (and the user message in generateCommunityRequestWithAI).
 * User data is built in buildUserMessage() and sent with the system prompt to OpenAI.
 */

export interface CommunityRequestPayload {
  agencyName: string
  incidentType: string
  otherIncidentType?: string
  address?: string
  incidentDate?: string
  description?: string
  footageTimeframe?: string
  whatToLookFor?: string
  contactDetails?: string
  caseNumber?: string
  tipLine?: string
}

function buildUserMessage(p: CommunityRequestPayload): string {
  const lines: string[] = [
    `Agency: ${p.agencyName}`,
    `Incident type: ${p.incidentType === "other" ? p.otherIncidentType || "incident" : p.incidentType || "incident"}`,
  ]
  if (p.address) lines.push(`General area (do not publish exact address): ${p.address}`)
  if (p.incidentDate) lines.push(`Incident date: ${p.incidentDate}`)
  if (p.description) lines.push(`Additional details: ${p.description}`)
  if (p.footageTimeframe) lines.push(`Timeframe needed for footage: ${p.footageTimeframe}`)
  if (p.whatToLookFor) lines.push(`What to look for in footage: ${p.whatToLookFor}`)
  if (p.contactDetails) lines.push(`Contact for submissions: ${p.contactDetails}`)
  if (p.caseNumber) lines.push(`Case number (optional to include): ${p.caseNumber}`)
  if (p.tipLine) lines.push(`Anonymous tip line: ${p.tipLine}`)
  return lines.join("\n")
}

const SYSTEM_PROMPT = `You are a public information officer writing a short community alert / footage request for social media or platforms like Neighbors by Ring. Use ONLY the facts provided. Do not invent any details, names, or exact addresses. Use clear, professional language. Keep it concise (a few short paragraphs). Include: (1) a clear headline that the agency is requesting community assistance, (2) what happened and the general area (never exact address), (3) what footage or information you need and the timeframe, (4) how to submit (contact info, case number if provided, tip line if provided), (5) a brief safety line (e.g. do not approach suspects; call 911 if you see something). Do not use markdown or asterisks. No victim names or private information.`

export async function generateCommunityRequestWithAI(payload: CommunityRequestPayload): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const userContent = buildUserMessage(payload)

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Write a community request / footage request using only these facts. Keep it suitable for social media and community platforms.\n\nFacts:\n${userContent}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch {
    return null
  }
}
