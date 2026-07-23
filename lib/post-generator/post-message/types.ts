export type PostMessageStatus =
  | "watch"
  | "warning"
  | "advisory"
  | "active"
  | "update"
  | "extended"
  | "lifted"
  | "resolved"

export type IncidentCategory =
  | "severe_thunderstorm"
  | "tornado"
  | "flood"
  | "winter_storm"
  | "hurricane"
  | "heat"
  | "wind"
  | "boil_water"
  | "road_closure"
  | "evacuation"
  | "shelter_in_place"
  | "missing_person"
  | "fire"
  | "power_outage"
  | "police_activity"
  | "general_safety"
  | "informational"

export type PostMessageUrgency = "critical" | "urgent" | "advisory" | "routine"

/** Verified fields only — null/empty means do not invent in the post. */
export type PostMessagePlaceholders = {
  agencyName: string
  alertType?: string | null
  issuingAuthority?: string | null
  affectedArea?: string | null
  issuedTime?: string | null
  expirationTime?: string | null
  primaryThreats?: string[] | null
  localImpacts?: string[] | null
  publicActions?: string[] | null
  agencyLocalAction?: string | null
  updatedStormDetail?: string | null
  postExpirationImpacts?: string[] | null
  reportingMethod?: string | null
  reason?: string | null
  boilDuration?: string | null
  unaffectedAreaNote?: string | null
  roadName?: string | null
  closureBoundaries?: string | null
  closureCause?: string | null
  alternateRoute?: string | null
  reopenCondition?: string | null
  partnerAgencies?: string[] | null
  subjectDescription?: string | null
  lastKnownLocation?: string | null
  restorationEstimate?: string | null
  caseDetails?: string | null
}

export type PostMessageClassification = {
  alertType: string
  incidentCategory: IncidentCategory
  status: PostMessageStatus
  urgency: PostMessageUrgency
  scriptId: string
  agencyTookLocalAction: boolean
}

export type PostMessageFact = {
  id: string
  text: string
}

export type PostMessageInput = {
  agencyName: string
  agencyType?: string
  serviceArea?: string
  title: string
  category?: string
  sourceLabel?: string
  issuingAuthority?: string
  verifiedFacts: PostMessageFact[]
  publicCallToAction?: string[]
  verifiedAgencyAction?: string
  eventEnd?: string
}
