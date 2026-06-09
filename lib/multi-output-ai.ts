/**
 * Multi-output AI generation: from one set of form data, produce a press release,
 * Facebook post, X/Twitter post, talking points, and optionally a video request.
 *
 * Uses OPENAI_API_KEY. Returns null for the whole bundle if the key is missing or the call fails.
 */

import type { PressReleasePayload } from "./press-release-ai"
import {
  PRESS_RELEASE_LENGTH_RULES,
  getPressReleaseLengthGuidance,
} from "./press-release-length"

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
    if (p.whatToLookFor) lines.push(`What to look for: ${p.whatToLookFor}`)
  }
  return lines.join("\n")
}

const SYSTEM_PROMPT = `You are SaferU, a professional public safety communications assistant designed to help law enforcement, fire departments, and public safety agencies generate clear, professional public communications.

Your task is to generate multiple communication outputs from a single incident report submitted by a public safety agency.

Your writing must be:
- professional
- factual
- concise
- neutral in tone
- safe for public release
- appropriate for public safety agencies
- free from speculation or assumptions
- suitable for FOIA/public records

Do not invent facts. Only use information provided in the form.

GENERAL RULES

1. The specific incident type must always be included.
Do not use vague language such as:
- suspicious incident
- suspicious people

If the selected incident type is vague but the description contains a clearer crime, use the more specific incident type.

2. Victim privacy must be protected.
Do NOT include victim names or exact addresses unless the person is a missing person and the name is approved for release.

3. Suspect description rule:
If a suspect's race is mentioned, the description must also include at least TWO additional descriptors such as clothing, hairstyle, height, vehicle, etc.

Example acceptable descriptions:
"white male wearing a black hoodie and blue jeans"
"black female with braided hair wearing a red jacket"

Race alone is never enough.

If race is mentioned without at least two additional descriptors, remove race from the description.

4. Exact addresses should be generalized for public release when appropriate.

Example:
"1200 block of Main Street"

5. If the investigation status is ongoing, the language should reflect that the investigation remains active.

6. If the investigation status is resolved, state that the investigation has concluded if appropriate.

7. If video footage is requested, clearly state:
- the timeframe
- what residents should look for
- who they should contact.

${PRESS_RELEASE_LENGTH_RULES}

OUTPUT FORMAT

Return your response as valid JSON with these exact keys:

{
  "pressRelease": "...",
  "facebook": "...",
  "twitter": "...",
  "talkingPoints": "...",
  "communityRequest": "..." (video request text) or null
}

Generate each section as follows:

---

PRESS RELEASE (pressRelease)

You are a professional public information officer (PIO) writing an official press release for a law enforcement or public safety agency. Use ONLY the facts provided. Do not invent any details, names, addresses, or circumstances. Use neutral, formal language. Avoid speculation, opinions, or emotional language. For minors, never include the name; use "a juvenile" or "a minor" as appropriate. Use "alleged" only for unconfirmed actions.

Format the release as plain text with:
- A clear dateline: CITY, STATE – Date – For Immediate Release
- Body paragraphs
- End with a Media Contact section listing the contact name, agency, phone, and email

Do not use markdown or asterisks for bold. Plain text only.

Match the word-count target for this release category (routine vs incident-related) specified in the facts.

---

FACEBOOK POST (facebook)

Write a clear, community-friendly post suitable for a police or public safety department Facebook page.

Structure:

[emoji] INCIDENT TYPE - GENERAL LOCATION

Short summary of the incident written in plain language.

If applicable include suspect description.

If applicable request residents review cameras or doorbell footage.

Provide contact information and case number if available.

Keep tone informative and professional.

---

X POST (twitter)

Write a concise alert under 280 characters.

Structure:

[emoji] INCIDENT TYPE

Brief summary of what occurred and general location.

If applicable request camera footage during the specified timeframe.

Include contact or tip line if provided.

Include Case # if available.

---

VIDEO REQUEST (communityRequest)

ONLY generate this if the facts include "FOOTAGE/VIDEO REQUEST: Yes". Otherwise set communityRequest to null.

Write a direct video request to residents asking them to check security cameras or provide footage related to the incident.

Structure:

[emoji] VIDEO REQUEST - INCIDENT TYPE

The [Agency Name] is investigating a [specific incident type] that occurred in the [general location] on [date/time].

Residents are asked to review security cameras, doorbell cameras, or other video systems between:

[Timeframe]

Please look for:
[What residents should look for]

If you have video footage or information that may assist investigators, please contact:

[Agency contact]

Case Number: [if provided]

Ensure the message includes the specific incident type and avoids vague language.

Ensure suspect description rules are followed.

Do not include victim names or exact addresses unless it is a missing person case.

---

TALKING POINTS (talkingPoints)

Generate short internal talking points for department leadership or media inquiries.

Format as bullet points starting with bullet character.

Include:

- Summary of the incident
- Date/time and general location
- Investigation status (ongoing or resolved)
- Any suspect information that can be publicly shared
- Whether the department is requesting video footage or tips from the public
- Reminder that the investigation is ongoing if applicable

Talking points must be factual and suitable for a chief or PIO to reference during media inquiries.

---

Now generate the outputs using the form data provided. Return ONLY the JSON object, nothing else.`

export async function generateMultiOutput(
  payload: PressReleasePayload & { requestFootage?: boolean; footageTimeframe?: string; whatToLookFor?: string }
): Promise<MultiOutputResult | null> {
  const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
    console.error("[multi-output-ai] OPENAI_API_KEY is not set")
    return null
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const facts = buildFactsBlock(payload)
    const lengthGuidance = getPressReleaseLengthGuidance(
      payload.incidentType,
      payload.arrests.length > 0
    )
    const dateStr = payload.incidentDate
      ? new Date(payload.incidentDate + (payload.incidentTime ? `T${payload.incidentTime}` : "")).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Generate all outputs using only these facts.\n\n${lengthGuidance}\n\nRelease date for the dateline: ${dateStr}\nContact: ${payload.contactName}, ${payload.agencyName}, Phone: ${payload.contactPhone}${payload.contactPhone2 ? `, Secondary: ${payload.contactPhone2}` : ""}, Email: ${payload.contactEmail}.\n${payload.boilerplate ? `Include this standard closing paragraph in the press release: ${payload.boilerplate}\n` : ""}\nFacts:\n${facts}`,
        },
      ],
      max_tokens: 4500,
      temperature: 0.3,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return {
      pressRelease: parsed.pressRelease || "",
      facebook: parsed.facebook || "",
      twitter: parsed.twitter || "",
      talkingPoints: parsed.talkingPoints || "",
      communityRequest: parsed.communityRequest || null,
    }
  } catch (err) {
    console.error("[multi-output-ai] OpenAI error:", err)
    return null
  }
}
