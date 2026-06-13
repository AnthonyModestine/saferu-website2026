/**
 * Multi-output AI generation: from one set of form data, produce a press release,
 * Facebook post, X/Twitter post, talking points, and optionally a video request.
 *
 * Uses OPENAI_API_KEY. Two-step generation: press release first, then social outputs.
 */

import type { PressReleasePayload } from "./press-release-ai"
import { generatePressReleaseWithAI } from "./press-release-ai"
import { parseModelJson } from "./parse-model-json"
import type { AiResult } from "./ai-result"

export interface MultiOutputResult {
  pressRelease: string
  facebook: string
  twitter: string
  talkingPoints: string
  communityRequest: string | null
}

function buildFactsBlock(p: PressReleasePayload & { requestFootage?: boolean; footageTimeframe?: string; whatToLookFor?: string }): string {
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
  if (p.requestFootage) {
    lines.push(`FOOTAGE/VIDEO REQUEST: Yes`)
    if (p.footageTimeframe) lines.push(`Timeframe for footage: ${p.footageTimeframe}`)
    if (p.whatToLookFor) lines.push(`What to look for in footage: ${p.whatToLookFor}`)
    if (p.entryType === "suspect" && p.persons.length > 0) {
      lines.push(`Suspect descriptions to reference in the video request:`)
      p.persons.forEach((person, i) => {
        const name = person.isMinor ? "minor (do not use name)" : person.name || "name not provided"
        lines.push(`  Suspect ${i + 1}: ${name}. ${person.description || "no description provided"}`.trim())
      })
    }
    if (p.incidentSummary) {
      lines.push(`Incident context for footage request: ${p.incidentSummary.slice(0, 500)}`)
    }
    if (p.investigationOngoing) {
      if (p.tipLine) lines.push(`How to submit footage — tip line: ${p.tipLine}`)
      if (p.detectiveContact) lines.push(`How to submit footage — detective: ${p.detectiveContact}`)
    }
  }
  return lines.join("\n")
}

const ANCILLARY_SYSTEM_PROMPT = `You are SaferU, a law enforcement and public safety communications assistant.

Generate supplementary outputs for an incident that already has an approved press release. Use ONLY the facts provided. Do not invent details.

Suspect description rule: if race is mentioned, include at least two additional descriptors (clothing, height, vehicle, etc.). Never use race alone.

Return valid JSON with these exact keys:
{
  "facebook": "...",
  "twitter": "...",
  "talkingPoints": "...",
  "communityRequest": "..." or null
}

FACEBOOK: Clear post about the incident for a law enforcement page. Include incident type and general location.

TWITTER: Under 280 characters. Concise alert with incident type, summary, and contact if provided.

TALKING POINTS: Bullet points for leadership or media inquiries. Factual only.

VIDEO REQUEST (communityRequest): ONLY if facts include "FOOTAGE/VIDEO REQUEST: Yes". Otherwise null.

When writing the video request:
- State clearly that the agency is requesting doorbell, security camera, or business footage.
- Include the specific suspect/subject descriptions from the facts ("Suspect descriptions to reference" and "What to look for in footage"). Use the exact physical details provided (clothing, height, build, vehicle, behavior). Do NOT write vague requests like "anyone with information" without describing who or what to look for.
- Include the footage timeframe if provided.
- Include how to submit (tip line, detective contact, or media contact from facts).
- Brief safety reminder (do not approach suspects; call 911 if you see something).
- Plain text only, suitable for Neighbors by Ring or social media. No markdown.

Return ONLY the JSON object.`

type AncillaryPayload = PressReleasePayload & {
  requestFootage?: boolean
  footageTimeframe?: string
  whatToLookFor?: string
}

async function generateAncillaryOutputs(
  payload: AncillaryPayload,
  pressRelease: string
): Promise<
  AiResult<Pick<MultiOutputResult, "facebook" | "twitter" | "talkingPoints" | "communityRequest">>
> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const facts = buildFactsBlock(payload)

    const userMessage = `Generate supplementary outputs using these facts and the press release below.

Facts:
${facts}

Press release (for consistency — do not copy verbatim into social posts):
${pressRelease.slice(0, 3500)}`

    let lastRaw: string | undefined

    for (let attempt = 0; attempt < 2; attempt++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: ANCILLARY_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2500,
        temperature: attempt === 0 ? 0.3 : 0.2,
        response_format: { type: "json_object" },
      })

      const finishReason = completion.choices?.[0]?.finish_reason
      const raw = completion.choices?.[0]?.message?.content?.trim()
      lastRaw = raw
      if (!raw) continue

      if (finishReason === "length") {
        console.error("[multi-output-ai] Ancillary response truncated (attempt", attempt + 1, ")")
        continue
      }

      const parsed = parseModelJson<{
        facebook?: string
        twitter?: string
        talkingPoints?: string
        communityRequest?: string | null
      }>(raw)

      if (!parsed) {
        console.error("[multi-output-ai] Invalid ancillary JSON (attempt", attempt + 1, "):", raw.slice(0, 300))
        continue
      }

      return {
        ok: true,
        data: {
          facebook: parsed.facebook || "",
          twitter: parsed.twitter || "",
          talkingPoints: parsed.talkingPoints || "",
          communityRequest: parsed.communityRequest || null,
        },
      }
    }

    if (!lastRaw) return { ok: false, reason: "empty_response" }
    return { ok: false, reason: "invalid_json", detail: lastRaw.slice(0, 200) }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[multi-output-ai] Ancillary OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function generateMultiOutput(
  payload: AncillaryPayload
): Promise<AiResult<MultiOutputResult>> {
  const pressReleaseResult = await generatePressReleaseWithAI(payload)
  if (!pressReleaseResult.ok) {
    return pressReleaseResult
  }

  const ancillaryResult = await generateAncillaryOutputs(payload, pressReleaseResult.data)
  if (!ancillaryResult.ok) {
    console.error("[multi-output-ai] Ancillary outputs failed:", ancillaryResult.reason, ancillaryResult.detail ?? "")
    // Press release succeeded — return it with empty ancillary fields rather than failing entirely.
    return {
      ok: true,
      data: {
        pressRelease: pressReleaseResult.data,
        facebook: "",
        twitter: "",
        talkingPoints: "",
        communityRequest: null,
      },
    }
  }

  return {
    ok: true,
    data: {
      pressRelease: pressReleaseResult.data,
      ...ancillaryResult.data,
    },
  }
}
