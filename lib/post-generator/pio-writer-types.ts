export type WriterFact = {
  id: string
  text: string
}

export type WriterPurpose =
  | "alert"
  | "update"
  | "inform"
  | "request_assistance"
  | "safety_reminder"
  | "invite"
  | "close_loop"

export type WriterUrgency = "critical" | "urgent" | "advisory" | "routine" | "community"

export type WriterBrief = {
  agency: {
    name: string
    type: string
    serviceArea: string
    roleProfile?: string
    voiceProfile?: string
  }
  category: string
  purpose: WriterPurpose
  urgency: WriterUrgency
  audience?: string
  localRelevance?: string
  verifiedFacts: WriterFact[]
  requiredAttribution?: string
  requestedPublicAction?: string
  verifiedAgencyAction?: string
  location?: string
  timing?: string
  sourceLink?: string
  mustInclude?: string[]
  mustNotSay?: string[]
  categoryInstructions?: string[]
  /** Alert or topic title for script selection */
  title?: string
}

export type PioWriterResult = {
  status: "ready" | "needs_human_review"
  postText: string
  usedFactIds: string[]
  sourceAttribution: string | null
  humanReviewReason: string | null
}

export type PioReviewResult = {
  status: "approved" | "edited" | "needs_human_review"
  finalPostText: string
  changed: boolean
  changeReasons: string[]
  checks: {
    factsSupported: boolean
    statusAndUrgencyPreserved: boolean
    agencyPerspectiveCorrect: boolean
    publicActionClear: boolean
    naturalPioVoice: boolean
    safeToPublish: boolean
  }
  humanReviewReason: string | null
}

export type PioCustomizeResult = {
  status: "ready" | "needs_human_review"
  postText: string
  humanReviewReason: string | null
}
