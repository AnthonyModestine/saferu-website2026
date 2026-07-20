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
  releaseDate?: string
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
  releaseType?: string
  proceduralStatus?: string
  injuries?: string
  medicalResponse?: string
  vehicleDescriptions?: string
  quotes?: { text: string; attribution: string; approved?: boolean }[]
  exactAddress?: string
  publishExactAddress?: boolean
  ownership?: string
  operationalSafety?: string
  protectedVictim?: boolean
  release?: Record<string, unknown>
  agency?: Record<string, unknown>
  mediaContact?: Record<string, unknown>
  policy?: Record<string, unknown>
  facts?: Record<string, unknown>
}

export type PublicationFact = {
  id: string
  domain: "release" | "agency" | "mediaContact" | "policy" | "facts"
  field: string
  value: string | number | boolean
}

export type NormalizedPressReleasePackage = {
  release: Record<string, unknown>
  agency: Record<string, unknown>
  mediaContact: Record<string, unknown>
  policy: Record<string, unknown>
  facts: Call1Facts & Record<string, unknown>
  publicationFacts: PublicationFact[]
  normalizationWarnings: string[]
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

function orNull(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const trimmed = String(value).trim()
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
    entryType === "victim" && !p.protectedVictim
      ? p.persons.map(mapPerson).filter((x) => x.description || x.name)
      : []

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

function hashFact(value: string): string {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function flattenFacts(
  domain: PublicationFact["domain"],
  input: unknown,
  path = ""
): Array<Omit<PublicationFact, "id">> {
  if (input == null || input === "" || input === false) return []
  if (Array.isArray(input)) {
    return input.flatMap((value, index) => flattenFacts(domain, value, `${path}[${index}]`))
  }
  if (typeof input === "object") {
    return Object.entries(input as Record<string, unknown>).flatMap(([key, value]) =>
      flattenFacts(domain, value, path ? `${path}.${key}` : key)
    )
  }
  if (typeof input !== "string" && typeof input !== "number" && typeof input !== "boolean") return []
  const value = typeof input === "string" ? orNull(input) : input
  if (value == null) return []
  return [{ domain, field: path, value }]
}

function valueAt(record: unknown, key: string): unknown {
  return record && typeof record === "object" ? (record as Record<string, unknown>)[key] : undefined
}

/** Accepts both the legacy flat form body and the richer package request shape. */
export function normalizePressReleasePayload(raw: Record<string, unknown>): PressReleasePayload {
  const release = raw.release
  const agency = raw.agency
  const media = raw.mediaContact
  const policy = raw.policy
  const facts = raw.facts
  const text = (value: unknown, max: number) => {
    const serialized =
      value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "")
    return serialized.trim().slice(0, max)
  }
  const pick = (...values: unknown[]) => values.find((value) => value != null && value !== "")
  const nestedSuspects = valueAt(facts, "suspects")
  const nestedVictims = valueAt(facts, "victims")
  const people = pick(raw.persons, valueAt(facts, "persons"), nestedSuspects, nestedVictims)
  const arrests = pick(raw.arrests, valueAt(facts, "arrests"))

  return {
    agencyName: text(pick(raw.agencyName, valueAt(agency, "name"), valueAt(agency, "agency_name")), 100),
    city: text(pick(raw.city, valueAt(release, "city")), 100),
    state: text(pick(raw.state, valueAt(release, "state")), 50),
    incidentType: text(pick(raw.incidentType, valueAt(facts, "incidentType"), valueAt(facts, "incident_type")), 100),
    incidentSummary: text(pick(raw.incidentSummary, valueAt(facts, "incidentSummary"), valueAt(facts, "incident_summary")), 4500),
    incidentDate: text(pick(raw.incidentDate, valueAt(facts, "incidentDate"), valueAt(facts, "incident_date")), 20),
    releaseDate: text(pick(raw.releaseDate, valueAt(release, "date"), valueAt(release, "release_date")), 20),
    incidentTime: text(pick(raw.incidentTime, valueAt(facts, "incidentTime"), valueAt(facts, "incident_time")), 20),
    location: text(pick(raw.location, valueAt(facts, "generalLocation"), valueAt(facts, "general_location")), 300),
    investigationOngoing: Boolean(pick(raw.investigationOngoing, valueAt(facts, "investigationOngoing"), valueAt(facts, "investigation_ongoing"))),
    persons: Array.isArray(people)
      ? people.slice(0, 10).map((item) => {
          const person = item as Record<string, unknown>
          return {
            name: text(person.name, 100),
            isMinor: Boolean(person.isMinor ?? person.is_minor),
            description: text(person.description ?? person.descriptors, 1000),
          }
        })
      : [],
    entryType:
      text(pick(raw.entryType, valueAt(facts, "entryType"), valueAt(facts, "entry_type")), 20) ||
      (Array.isArray(nestedSuspects) && nestedSuspects.length
        ? "suspect"
        : Array.isArray(nestedVictims) && nestedVictims.length
          ? "victim"
          : "none"),
    arrests: Array.isArray(arrests)
      ? arrests.slice(0, 10).map((item) => {
          const arrest = item as Record<string, unknown>
          return { name: text(arrest.name, 100), details: text(arrest.details, 1000) }
        })
      : [],
    propertyDamage: text(pick(raw.propertyDamage, valueAt(facts, "propertyDamage"), valueAt(facts, "property_damage")), 1000),
    tipLine: text(pick(raw.tipLine, valueAt(facts, "tipLine"), valueAt(facts, "anonymous_tip_line")), 100),
    detectiveContact: text(pick(raw.detectiveContact, valueAt(facts, "detectiveContact"), valueAt(facts, "detective_contact")), 300),
    resolutionText: text(pick(raw.resolutionText, valueAt(facts, "resolution")), 1000),
    boilerplate: text(pick(raw.boilerplate, valueAt(agency, "boilerplate")), 2000),
    contactName: text(pick(raw.contactName, valueAt(media, "name")), 100),
    contactPhone: text(pick(raw.contactPhone, valueAt(media, "phone")), 50),
    contactPhone2: text(pick(raw.contactPhone2, valueAt(media, "secondaryPhone"), valueAt(media, "secondary_phone")), 50),
    contactEmail: text(pick(raw.contactEmail, valueAt(media, "email")), 150),
    requestFootage: Boolean(pick(raw.requestFootage, valueAt(facts, "requestFootage"))),
    footageTimeframe: text(pick(raw.footageTimeframe, valueAt(facts, "footageTimeframe"), valueAt(facts, "footage_timeframe")), 300),
    whatToLookFor: text(pick(raw.whatToLookFor, valueAt(facts, "whatToLookFor"), valueAt(facts, "footage_look_for")), 1000),
    onlineTipsUrl: text(pick(raw.onlineTipsUrl, valueAt(facts, "onlineTipsUrl"), valueAt(facts, "online_tip_url")), 500),
    caseNumber: text(pick(raw.caseNumber, valueAt(facts, "caseNumber"), valueAt(facts, "case_number")), 100),
    releaseType: text(pick(raw.releaseType, valueAt(release, "type"), valueAt(release, "release_type")), 100),
    proceduralStatus: text(pick(raw.proceduralStatus, valueAt(facts, "proceduralStatus"), valueAt(facts, "procedural_status")), 500),
    injuries: text(pick(raw.injuries, valueAt(facts, "injuries")), 1000),
    medicalResponse: text(pick(raw.medicalResponse, valueAt(facts, "medicalResponse"), valueAt(facts, "medical_response")), 1000),
    vehicleDescriptions: text(pick(raw.vehicleDescriptions, valueAt(facts, "vehicleDescriptions"), valueAt(facts, "vehicles")), 1500),
    quotes: Array.isArray(pick(raw.quotes, valueAt(facts, "quotes")))
      ? (pick(raw.quotes, valueAt(facts, "quotes")) as unknown[]).slice(0, 5).map((item) => {
          const quote = item as Record<string, unknown>
          return {
            text: text(quote.text, 1000),
            attribution: text(quote.attribution, 300),
            approved: Boolean(quote.approved),
          }
        })
      : [],
    exactAddress: text(pick(raw.exactAddress, valueAt(facts, "exactAddress"), valueAt(facts, "exact_address")), 300),
    publishExactAddress: Boolean(pick(raw.publishExactAddress, valueAt(policy, "publishExactAddress"), valueAt(policy, "publish_exact_address"))),
    ownership: text(pick(raw.ownership, valueAt(facts, "ownership")), 500),
    operationalSafety: text(pick(raw.operationalSafety, valueAt(facts, "operationalSafety")), 1000),
    protectedVictim: Boolean(pick(raw.protectedVictim, valueAt(facts, "protectedVictim"))),
    release: release && typeof release === "object" ? release as Record<string, unknown> : undefined,
    agency: agency && typeof agency === "object" ? agency as Record<string, unknown> : undefined,
    mediaContact: media && typeof media === "object" ? media as Record<string, unknown> : undefined,
    policy: policy && typeof policy === "object" ? policy as Record<string, unknown> : undefined,
    facts: facts && typeof facts === "object" ? facts as Record<string, unknown> : undefined,
  }
}

export function buildNormalizedPackage(
  p: PressReleasePayload,
  options: { releaseDateDisplay: string; releaseDateIso: string; wordCountMin: number; wordCountMax: number }
): NormalizedPressReleasePackage {
  const baseFacts = buildCall1Facts(p)
  const additionalFacts = { ...(p.facts || {}) }
  for (const key of [
    "persons", "victims", "suspects", "arrests", "exactAddress", "exact_address",
    "quotes", "vehicleDescriptions", "protectedVictim", "protected_victim",
  ]) {
    delete additionalFacts[key]
  }
  const domains: Omit<NormalizedPressReleasePackage, "publicationFacts" | "normalizationWarnings"> = {
    release: {
      type: orNull(p.releaseType) || "incident_release",
      date: options.releaseDateIso,
      dateDisplay: options.releaseDateDisplay,
      city: orNull(p.city),
      state: orNull(p.state),
      targetLength: {
        preferredMinWords: options.wordCountMin,
        preferredMaxWords: options.wordCountMax,
      },
    },
    agency: { name: orNull(p.agencyName), boilerplate: orNull(p.boilerplate), ...p.agency },
    mediaContact: {
      name: orNull(p.contactName),
      agency: orNull(p.agencyName),
      phone: orNull(p.contactPhone),
      secondaryPhone: orNull(p.contactPhone2),
      email: orNull(p.contactEmail),
      ...p.mediaContact,
    },
    policy: {
      ...p.policy,
      ...UNIVERSAL_POLICY,
      publish_exact_address: Boolean(p.publishExactAddress),
      juvenile_names_prohibited: true,
      protected_victim_identification_prohibited: true,
      no_automatic_publication: true,
    },
    facts: {
      ...additionalFacts,
      ...baseFacts,
      release_type: orNull(p.releaseType),
      procedural_status: orNull(p.proceduralStatus),
      property_damage: orNull(p.propertyDamage),
      injuries: orNull(p.injuries),
      medical_response: orNull(p.medicalResponse),
      vehicle_descriptions: orNull(p.vehicleDescriptions),
      quotes: (p.quotes || []).filter((quote) => quote.approved),
      exact_address: p.publishExactAddress ? orNull(p.exactAddress) : null,
      ownership_attribution: orNull(p.ownership),
      operational_safety: orNull(p.operationalSafety),
      protected_victim: Boolean(p.protectedVictim),
      case_number: orNull(p.caseNumber),
    },
  }
  const publicationFacts = (Object.entries(domains) as Array<
    [PublicationFact["domain"], unknown]
  >).flatMap(([domain, input]) => flattenFacts(domain, input))
    .map((fact) => ({
      ...fact,
      id: `fact_${fact.domain}_${hashFact(`${fact.field}:${String(fact.value)}`)}`,
    }))
  const warnings: string[] = []
  if (p.incidentDate && !/^\d{4}-\d{2}-\d{2}$/.test(p.incidentDate)) {
    warnings.push("Confirm the incident date format.")
  }
  if (p.incidentTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(p.incidentTime)) {
    warnings.push("Confirm the incident time format.")
  }
  if ((p.quotes || []).some((quote) => quote.text && !quote.approved)) {
    warnings.push("Confirm quote approval before publication.")
  }
  const conflicts = valueAt(p.facts, "conflicts")
  if ((Array.isArray(conflicts) && conflicts.length) || (typeof conflicts === "string" && conflicts.trim())) {
    warnings.push("Material conflict in supplied facts requires human review.")
  }
  return { ...domains, publicationFacts, normalizationWarnings: warnings }
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
  return buildNormalizedPackage(p, options)
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
