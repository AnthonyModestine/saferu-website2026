/**
 * Shared Facebook caption voice rules for specialized model calls.
 * Keep this focused — do not paste the full product prompt into every call.
 */

import { buildWeatherAlertPost, type WeatherMessageContext } from "./weather-alert-message"

export const CAPTION_BANNED_PHRASES = [
  "please be advised",
  "we are writing to inform you",
  "as a reminder",
  "stay safe out there",
  "with the holidays coming up",
  "this time of year",
  "in today's fast-paced world",
  "officials ask residents",
] as const

/** Generic stand-ins that must not replace a real agency name. */
export const CAPTION_GENERIC_AGENCY_STANDINS = [
  "our local police",
  "your local police",
  "local police",
  "our local fire department",
  "your local fire department",
  "our department",
  "our officers",
  "our local agency",
  "local law enforcement",
  "your local department",
] as const

const PLACEHOLDER_AGENCY_NAMES = new Set([
  "",
  "our department",
  "this agency",
  "your agency",
  "the public safety agency",
  "public safety agency",
  "the agency",
])

export type PioAttributionContext = {
  title?: string
  sourceName?: string
  issuingAuthority?: string
  sourceLabel?: string
}

/** True when settings supplied a real agency name (not a prompt placeholder). */
export function hasRealAgencyName(agencyName?: string | null): boolean {
  const name = (agencyName || "").trim()
  if (!name) return false
  return !PLACEHOLDER_AGENCY_NAMES.has(name.toLowerCase())
}

/**
 * Resolve the display name used in prompts and template fallbacks.
 * Missing names become neutral PIO phrasing — never "our department" / "local police".
 */
export function resolveAgencyDisplayName(agencyName?: string | null): string {
  const name = (agencyName || "").trim()
  if (hasRealAgencyName(name)) return name
  return "your agency"
}

/** Normalize issuing-authority labels for readable attribution. */
export function resolveIssuingAuthority(ctx?: PioAttributionContext): string | null {
  const raw = (ctx?.issuingAuthority || ctx?.sourceName || "").trim()
  if (!raw) return null
  if (/national weather service/i.test(raw)) return "National Weather Service"
  return raw.replace(/\s+alert$/i, "").trim() || raw
}

function isWeatherContext(ctx?: PioAttributionContext): boolean {
  if (ctx?.sourceLabel === "Weather Alert") return true
  const issuer = resolveIssuingAuthority(ctx)
  return Boolean(issuer && /weather service/i.test(issuer))
}

/** Lead-in for deterministic / template messages when AI stages fail. */
export function pioAgencyLeadIn(
  agencyName?: string | null,
  ctx?: PioAttributionContext
): string {
  const issuer = resolveIssuingAuthority(ctx)
  const alertTitle = ctx?.title?.trim()
  const weather = isWeatherContext(ctx)

  if (hasRealAgencyName(agencyName)) {
    const agency = agencyName!.trim()
    if (issuer && alertTitle) {
      if (weather) {
        return `${agency} is sharing this National Weather Service alert with residents: ${alertTitle}.`
      }
      return `${agency} is sharing this update from the ${issuer}: ${alertTitle}.`
    }
    if (issuer) {
      return `${agency} is sharing verified information from the ${issuer} with our community:`
    }
    if (alertTitle) {
      return `${agency} is sharing this update with our community regarding ${alertTitle}:`
    }
    return `${agency} is sharing this update with our community:`
  }

  if (issuer && alertTitle) {
    if (weather) {
      return `The National Weather Service has issued ${alertTitle}. Residents in the area should take note:`
    }
    return `The ${issuer} has issued ${alertTitle}. Residents in the area should take note:`
  }
  if (issuer) {
    return `The ${issuer} issued the following verified information. Residents should take note:`
  }
  if (alertTitle) {
    return `${alertTitle}. Residents should take note:`
  }
  return "The following verified public safety information is being shared with residents:"
}

/**
 * Wrap a scanner/template message so it names the agency and issuing authority.
 * Skips wrapping when the body already includes the agency or issuer.
 */
export function withPioAgencyAttribution(
  message: string,
  agencyName?: string | null,
  ctx?: PioAttributionContext
): string {
  const body = message.trim()
  if (!body) return body

  const issuer = resolveIssuingAuthority(ctx)

  if (hasRealAgencyName(agencyName)) {
    const name = agencyName!.trim()
    if (body.toLowerCase().includes(name.toLowerCase())) return body
  }
  if (issuer && body.toLowerCase().includes(issuer.toLowerCase())) {
    if (!hasRealAgencyName(agencyName)) return body
    const name = agencyName!.trim()
    if (body.toLowerCase().includes(name.toLowerCase())) return body
  }

  const lead = pioAgencyLeadIn(agencyName, ctx)
  const alertTitle = ctx?.title?.trim()
  if (alertTitle && body.toLowerCase().startsWith(alertTitle.toLowerCase())) {
    const remainder = body.slice(alertTitle.length).trim().replace(/^[.:]\s*/, "")
    return remainder ? `${lead}\n\n${remainder}` : lead
  }
  return `${lead}\n\n${body}`
}

/** Build a fallback PIO message from opportunity facts when AI stages did not run. */
export function buildOpportunityFallbackMessage(
  opportunity: {
    title: string
    summary?: string
    verifiedFacts?: string[]
    publicCallToAction?: string[]
    sourceName?: string
    issuingAuthority?: string
    sourceLabel?: string
    eventStart?: string
    eventEnd?: string
    category?: string
  },
  agencyName?: string | null,
  serviceArea?: Pick<WeatherMessageContext, "city" | "county" | "state">
): string {
  if (
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Weather Analysis"
  ) {
    return buildWeatherAlertPost(opportunity, {
      agencyName,
      city: serviceArea?.city,
      county: serviceArea?.county,
      state: serviceArea?.state,
    })
  }

  const facts = opportunity.verifiedFacts ?? []
  const actions = opportunity.publicCallToAction ?? []
  const body = [opportunity.summary, ...facts, ...actions].filter(Boolean).join(" ")
  const message = body || `${opportunity.title}.`
  return withPioAgencyAttribution(message, agencyName, {
    title: opportunity.title,
    sourceName: opportunity.sourceName,
    issuingAuthority: opportunity.issuingAuthority,
    sourceLabel: opportunity.sourceLabel,
  })
}

/** Agency naming rules shared by writer / customize / final-gate prompts. */
export function agencyNamingBrief(agency: string): string {
  const named = hasRealAgencyName(agency)
  const standins = CAPTION_GENERIC_AGENCY_STANDINS.map((p) => `"${p}"`).join(", ")
  if (named) {
    return (
      "AGENCY IDENTITY (required):\n" +
      `- This post is from "${agency}" to THAT agency's local community — write as their PIO.\n` +
      `- Name "${agency}" at least once (e.g. "${agency} is sharing this National Weather Service alert…", "We at ${agency} ask residents…").\n` +
      `- Prefer first-person plural from the agency ("We ask residents…", "We're monitoring…") after naming the agency.\n` +
      `- Address residents directly and personally ("residents", "neighbors", "our community") — not a generic national audience.\n` +
      `- NEVER use generic stand-ins instead of the agency name: ${standins}.\n` +
      `- Do not invent a different agency type or nickname.`
    )
  }
  return (
    "AGENCY IDENTITY (no specific name provided):\n" +
    `- Name the issuing authority in the first sentence (e.g. "The National Weather Service has issued a Tornado Watch for…").\n` +
    `- Never open with vague phrasing like "Officials ask residents…" without naming who issued the alert or update.\n` +
    `- Prefer first-person plural only when it stays generic ("We ask residents…") without inventing a department type.\n` +
    `- NEVER invent or default to: ${standins}.`
  )
}

/** Compact caption rules for writer / final-gate prompts. */
export function captionVoiceBrief(agency: string, place: string): string {
  const banned = CAPTION_BANNED_PHRASES.map((p) => '"' + p + '"').join(", ")
  const display = resolveAgencyDisplayName(agency)
  return (
    "CAPTION VOICE — publish as " +
    display +
    " to residents in " +
    place +
    ":\n" +
    agencyNamingBrief(hasRealAgencyName(agency) ? agency.trim() : "") +
    "\n" +
    "- Lead with WHO issued the alert or update and WHAT it is (e.g. " +
    '"The National Weather Service has issued a Severe Thunderstorm Warning for [area]…").\n' +
    "- For weather alerts, always include a short Safety reminder with one practical step residents can take right now.\n" +
    "- For weather alerts, name the issuer and alert type, but focus on THIS community's city/county — never paste the full multi-county NWS zone list.\n" +
    "- Then explain why THIS agency is sharing it and what residents should know, expect, avoid, verify, or do.\n" +
    "- Attribute alerts/official info to the issuing authority. If another authority issued it, credit them and have the agency relay it.\n" +
    "- Calm, credible, human, professional — clear, authoritative, helpful PIO tone. Short paragraphs for mobile (usually 2-3).\n" +
    "- One clear call to action. Do not turn every post into a tip list.\n" +
    "- Use only verified facts. Zero or one emoji. No hashtag stuffing.\n" +
    "- Never claim " +
    display +
    " owns another authority's project, crews, investigation, alert, or event.\n" +
    "- Avoid: " +
    banned +
    ", clickbait, slang, generic PSA/corporate filler, unsupported reassurance.\n" +
    "- For agency-content follow-ups: do not restate the full incident; move quickly into prevention, education, or reassurance."
  )
}

export function containsBannedCaptionLanguage(text: string): boolean {
  const lower = text.toLowerCase()
  return CAPTION_BANNED_PHRASES.some((phrase) => lower.includes(phrase))
}

export function containsGenericAgencyStandIn(text: string): boolean {
  const lower = text.toLowerCase()
  return CAPTION_GENERIC_AGENCY_STANDINS.some((phrase) => lower.includes(phrase))
}
