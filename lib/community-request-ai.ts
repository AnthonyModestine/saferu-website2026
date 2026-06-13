/**
 * Generate video request (footage request) text using OpenAI.
 * Uses OPENAI_API_KEY (same as press release).
 */

import type { AiResult } from "./ai-result"
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

const SYSTEM_PROMPT = `You are a public information officer writing a short video request for an active investigation.

CRITICAL — FACTS ONLY:
- Use ONLY the facts provided. Do NOT invent any details, names, exact addresses, suspects, vehicles, or circumstances.
- If facts are limited, write a shorter request that states only what is provided.
- Never fill gaps with plausible-sounding fiction.

Use clear, professional language. Keep it concise (a few short paragraphs). Include: (1) a clear headline that the agency is requesting video footage related to the incident, (2) what happened and the general area (never exact address), (3) what footage or information you need and the timeframe, (4) how to submit (contact info, case number if provided, tip line if provided), (5) a brief safety line (e.g. do not approach suspects; call 911 if you see something). Do not use markdown or asterisks. No victim names or private information.`

export async function generateCommunityRequestWithAI(payload: CommunityRequestPayload): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[community-request-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

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
          content: `Write a video request for an active investigation using only these facts. Keep it suitable for social media and platforms like Neighbors by Ring.\n\nFacts:\n${userContent}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.3,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return { ok: false, reason: "empty_response" }
    }
    return { ok: true, data: text }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[community-request-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
