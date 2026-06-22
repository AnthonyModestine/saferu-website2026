/**
 * Normalized Press Center JSON payloads for OpenAI user messages.
 * Universal policy is hardcoded — not per-agency.
 */

import { UNIVERSAL_POLICY } from "./pio-prompts"

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
  requestFootage?: boolean
  footageTimeframe?: string
  whatToLookFor?: string
  onlineTipsUrl?: string
  caseNumber?: string
}

export type PersonFact = {
  name: string | null
  is_minor: boolean
  description: string | null
}

export type ArrestFact = {
  name: string | null
  details: string | null
}

/** Shared facts object for Call 1 (press release) and Call 2 (social). */
export type Call1Facts = {
  incident_type: string | null
  investigation_status: "ongoing" | "resolved" | null
  incident_summary: string | null
  incident_date: string | null
  incident_time: string | null
  general_location: string | null
  suspects: PersonFact[]
  victims: PersonFact[]
  arrests: ArrestFact[]
  resolution: string | null
  anonymous_tip_line: string | null
  detective_contact: string | null
  online_tip_url: string | null
  footage_video_request: boolean
  footage_timeframe: string | null
  footage_look_for: string | null
  footage_submission_methods: string[]
}

const PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "unknown",
  "tbd",
  "not provided",
  "none",
  "—",
  "-",
])

function orNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) return null
  return trimmed
}

function buildFootageSubmissionMethods(p: PressReleasePayload): string[] {
  const methods: string[] = []
  const tip = orNull(p.tipLine)
  const detective = orNull(p.detectiveContact)
  const online = orNull(p.onlineTipsUrl)
  const media =
    orNull(p.contactName) && orNull(p.contactPhone)
      ? `${p.contactName}, ${p.contactPhone}`
      : null
  if (tip) methods.push(`Anonymous tip line: ${tip}`)
  if (detective) methods.push(`Detective contact: ${detective}`)
  if (online) methods.push(`Online tips: ${online}`)
  if (media) methods.push(`Media contact: ${media}`)
  return methods
}

export function buildCall1Facts(p: PressReleasePayload): Call1Facts {
  const entryType =
    p.entryType === "suspect" ? "suspect" : p.entryType === "victim" ? "victim" : "none"

  const mapPerson = (person: PressReleasePayload["persons"][0]): PersonFact => ({
    name: person.isMinor ? null : orNull(person.name),
    is_minor: person.isMinor,
    description: orNull(person.description),
  })

  const suspects =
    entryType === "suspect" ? p.persons.map(mapPerson).filter((x) => x.description || x.name) : []
  const victims =
    entryType === "victim" ? p.persons.map(mapPerson).filter((x) => x.description || x.name) : []

  const wantsVideo = Boolean(
    p.requestFootage || orNull(p.footageTimeframe) || orNull(p.whatToLookFor)
  )

  return {
    incident_type: orNull(p.incidentType),
    investigation_status: p.investigationOngoing ? "ongoing" : "resolved",
    incident_summary: orNull(p.incidentSummary),
    incident_date: orNull(p.incidentDate),
    incident_time: orNull(p.incidentTime),
    general_location: orNull(p.location),
    suspects,
    victims,
    arrests: p.arrests
      .map((a) => ({ name: orNull(a.name), details: orNull(a.details) }))
      .filter((a) => a.name || a.details),
    resolution: orNull(p.resolutionText),
    anonymous_tip_line: orNull(p.tipLine),
    detective_contact: orNull(p.detectiveContact),
    online_tip_url: orNull(p.onlineTipsUrl),
    footage_video_request: wantsVideo,
    footage_timeframe: orNull(p.footageTimeframe),
    footage_look_for: orNull(p.whatToLookFor),
    footage_submission_methods: wantsVideo ? buildFootageSubmissionMethods(p) : [],
  }
}

export function buildCall1UserPayload(
  p: PressReleasePayload,
  options: {
    releaseDateDisplay: string
    releaseDateIso: string
    wordCountMin: number
    wordCountMax: number
  }
) {
  return {
    release_date: options.releaseDateIso,
    release_date_display: options.releaseDateDisplay,
    agency_name: orNull(p.agencyName),
    release_city: orNull(p.city),
    release_state: orNull(p.state),
    target_length: {
      preferred_min_words: options.wordCountMin,
      preferred_max_words: options.wordCountMax,
    },
    boilerplate: orNull(p.boilerplate),
    policy: UNIVERSAL_POLICY,
    media_contact: {
      name: orNull(p.contactName),
      agency: orNull(p.agencyName),
      phone: orNull(p.contactPhone),
      secondary_phone: orNull(p.contactPhone2),
      email: orNull(p.contactEmail),
    },
    facts: buildCall1Facts(p),
  }
}

export function buildCall2UserPayload(p: PressReleasePayload, approvedPressRelease: string) {
  return {
    policy: UNIVERSAL_POLICY,
    facts: buildCall1Facts(p),
    approved_press_release: approvedPressRelease.slice(0, 3500),
  }
}

export function buildCall3UserPayload(input: {
  agencyName?: string
  incidentType?: string
  location?: string
  incidentDate?: string
  incidentSummary?: string
  suspectDescriptions?: string
  footageTimeframe?: string
  whatToLookFor?: string
  submissionMethods?: string[]
  caseNumber?: string
  tipLine?: string
}) {
  const submissionMethods = input.submissionMethods?.filter(Boolean) ?? []
  const tip = orNull(input.tipLine)
  if (tip && !submissionMethods.some((m) => m.includes(tip))) {
    submissionMethods.push(`Anonymous tip line: ${tip}`)
  }

  const summaryParts = [orNull(input.incidentSummary), orNull(input.suspectDescriptions)].filter(
    Boolean
  )

  return {
    policy: UNIVERSAL_POLICY,
    agency_name: orNull(input.agencyName),
    incident_type: orNull(input.incidentType),
    general_area: orNull(input.location),
    incident_date: orNull(input.incidentDate),
    incident_summary: summaryParts.length > 0 ? summaryParts.join("\n\n") : null,
    suspect_descriptions: orNull(input.suspectDescriptions),
    timeframe_needed: orNull(input.footageTimeframe),
    what_to_look_for: orNull(input.whatToLookFor),
    submission_methods: submissionMethods,
    case_number: orNull(input.caseNumber),
    anonymous_tip_line: tip,
  }
}

export function buildCall3UserPayloadFromPressRelease(p: PressReleasePayload) {
  const facts = buildCall1Facts(p)
  const suspectText =
    facts.suspects.length > 0
      ? facts.suspects
          .map((s, i) => {
            const name = s.is_minor ? "minor (do not use name)" : s.name || "name not provided"
            return `Suspect ${i + 1}: ${name}. ${s.description || ""}`.trim()
          })
          .join("\n")
      : undefined

  return buildCall3UserPayload({
    agencyName: p.agencyName,
    incidentType: p.incidentType,
    location: p.location,
    incidentDate: p.incidentDate,
    incidentSummary: p.incidentSummary,
    suspectDescriptions: suspectText,
    footageTimeframe: p.footageTimeframe,
    whatToLookFor: p.whatToLookFor,
    submissionMethods: facts.footage_submission_methods,
    caseNumber: p.caseNumber,
    tipLine: p.tipLine,
  })
}

export function formatTalkingPointsForDisplay(points: string[]): string {
  if (!points.length) return ""
  return points
    .map((point) => {
      const trimmed = point.trim()
      if (!trimmed) return ""
      if (trimmed.startsWith("•") || trimmed.startsWith("-")) return trimmed
      return `• ${trimmed}`
    })
    .filter(Boolean)
    .join("\n")
}

/** @deprecated use buildCall1Facts */
export function buildNormalizedPressReleaseFacts(p: PressReleasePayload) {
  return buildCall1Facts(p)
}
