/**
 * Generate press release body text using OpenAI from structured form data.
 * Set OPENAI_API_KEY in Vercel (Project → Settings → Environment Variables) or in .env.local.
 * If the key is missing or the request fails, returns null.
 *
 * To use YOUR prompt + user info: edit SYSTEM_PROMPT below (and the user message in generatePressReleaseWithAI).
 * Word-count rules: lib/press-release-length.ts
 */

import {
  PRESS_RELEASE_LENGTH_RULES,
  getPressReleaseLengthGuidance,
} from "./press-release-length"
import type { AiResult } from "./ai-result"

export interface PressReleasePayload {
  agencyName: string
  city: string
  state: string
  incidentType: string
  incidentSummary?: string
  incidentDate?: string
  incidentTime?: string
  location?: string
  investigationOngoing: boolean
  persons: { name: string; isMinor: boolean; description: string }[]
  entryType: string
  arrests: { name: string; details: string }[]
  propertyDamage?: string
  tipLine?: string
  detectiveContact?: string
  resolutionText?: string
  boilerplate?: string
  contactName: string
  contactPhone: string
  contactPhone2?: string
  contactEmail: string
}

function buildUserMessage(p: PressReleasePayload): string {
  const lines: string[] = [
    `Agency: ${p.agencyName}`,
    `Location: ${p.city}, ${p.state}`,
    `Incident type: ${p.incidentType || "incident"}`,
    `Investigation status: ${p.investigationOngoing ? "Ongoing" : "Resolved"}`,
  ]
  if (p.incidentSummary) lines.push(`Incident summary: ${p.incidentSummary}`)
  if (p.incidentDate) lines.push(`Incident date: ${p.incidentDate}`)
  if (p.incidentTime) lines.push(`Incident time: ${p.incidentTime}`)
  if (p.location) lines.push(`Location of incident: ${p.location}`)
  if (p.entryType !== "none" && p.persons.length > 0) {
    p.persons.forEach((person, i) => {
      const role = p.entryType === "suspect" ? "Suspect" : "Victim/Missing person"
      const name = person.isMinor ? "minor (do not use name)" : person.name || "name not provided"
      lines.push(`${role} ${i + 1}: ${name}. ${person.description || ""}`.trim())
    })
  }
  if (p.arrests.length > 0) {
    p.arrests.forEach((a, i) => lines.push(`Arrest ${i + 1}: ${a.name}. ${a.details}`.trim()))
  }
  if (p.propertyDamage) lines.push(`Property/damage: ${p.propertyDamage}`)
  if (p.investigationOngoing) {
    if (p.tipLine) lines.push(`Anonymous tip line: ${p.tipLine}`)
    if (p.detectiveContact) lines.push(`Detective contact: ${p.detectiveContact}`)
  } else if (p.resolutionText) {
    lines.push(`Resolution: ${p.resolutionText}`)
  }
  return lines.join("\n")
}

const SYSTEM_PROMPT = `You are a professional public information officer (PIO) writing an official press release about a crime, fire, traffic accident, or other public-safety emergency for a law enforcement or public safety agency.

CRITICAL — FACTS ONLY:
- Use ONLY facts explicitly listed in the user message. Do NOT invent suspects, victims, locations, times, evidence, quotes, charges, injuries, property loss, or outcomes.
- Never fill gaps with plausible-sounding fiction or generic incident narrative.
- If facts are limited, write a shorter release that states only what is provided and omits unknown details.
- Do not use placeholder agency or contact details as if they describe the incident.

Use neutral, formal language. Avoid speculation, opinions, or emotional language. For minors, never include the name; use "a juvenile" or "a minor" as appropriate. Use "alleged" only for unconfirmed actions. Format the release as plain text with a clear dateline (CITY, STATE – Date – For Immediate Release), body paragraphs, and end with a Media Contact section listing the contact name, agency, phone, and email. Do not use markdown or asterisks for bold.

${PRESS_RELEASE_LENGTH_RULES}

Match the word-count target specified in the user message. Never pad with invented detail to reach word count.`

export async function generatePressReleaseWithAI(payload: PressReleasePayload): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[press-release-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const userContent = buildUserMessage(payload)
    const lengthGuidance = getPressReleaseLengthGuidance()
    const dateStr = payload.incidentDate
      ? new Date(payload.incidentDate + (payload.incidentTime ? `T${payload.incidentTime}` : "")).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Write a press release using only these facts.\n\n${lengthGuidance}\n\nRelease date for the dateline: ${dateStr}. Contact: ${payload.contactName}, ${payload.agencyName}, Phone: ${payload.contactPhone}${payload.contactPhone2 ? `, Secondary: ${payload.contactPhone2}` : ""}, Email: ${payload.contactEmail}. ${payload.boilerplate ? `Include this standard closing paragraph after the body: ${payload.boilerplate}` : ""}\n\nFacts:\n${userContent}`,
        },
      ],
      max_tokens: 3500,
      temperature: 0.3,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return { ok: false, reason: "empty_response" }
    }
    return { ok: true, data: text }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[press-release-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
