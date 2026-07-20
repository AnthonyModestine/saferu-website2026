import type { AiResult } from "./ai-result"
import { INCIDENT_MAX, INCIDENT_MIN } from "./press-release-length"
import {
  buildCall1UserPayload,
  formatTalkingPointsForDisplay,
  type PressReleasePayload,
} from "./pio-normalized-facts"
import {
  generateStructuredPressReleaseDraft,
  renderStructuredPressRelease,
} from "./press-release-ai"
import {
  generateStructuredCommunityRequest,
  renderAssistanceRequest,
} from "./community-request-ai"
import {
  PIO_QUALITY_GATE_PROMPT,
  SUPPLEMENTARY_DRAFT_PROMPT,
} from "./pio-prompts"
import {
  QUALITY_GATE_RESPONSE_FORMAT,
  SUPPLEMENTARY_RESPONSE_FORMAT,
  qualityGateSchema,
  supplementaryDraftSchema,
  type AssistanceDraft,
  type PressReleaseDraft,
  type QualityGateResult,
  type SupplementaryDraft,
} from "./pio-structured-schemas"
import { runPioStructuredCall } from "./pio-structured-call"

export interface MultiOutputResult {
  pressRelease: string
  facebook: string
  twitter: string
  talkingPoints: string
  communityRequest: string | null
  headline: string
  body: string[]
  mediaContact: PressReleaseDraft["mediaContact"]
  detailsToVerify: string[]
  humanReviewReason: string
  qualityStatus: "approved" | "approved_with_revisions" | "needs_human_review"
  statusLabel: "SaferU reviewed" | "Needs confirmation" | "Ready for agency review"
  revisionsMade: string[]
}

export type MultiOutputSelection = {
  pressRelease: boolean
  facebook: boolean
  twitter: boolean
  talkingPoints: boolean
  videoRequest: boolean
}

export const DEFAULT_MULTI_OUTPUT_SELECTION: MultiOutputSelection = {
  pressRelease: true,
  facebook: false,
  twitter: false,
  talkingPoints: false,
  videoRequest: false,
}

export function parseMultiOutputSelection(raw: unknown): MultiOutputSelection | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  return {
    pressRelease: Boolean(o.pressRelease),
    facebook: Boolean(o.facebook),
    twitter: Boolean(o.twitter),
    talkingPoints: Boolean(o.talkingPoints),
    videoRequest: Boolean(o.videoRequest),
  }
}

export function selectionHasAny(selection: MultiOutputSelection): boolean {
  return Object.values(selection).some(Boolean)
}

export type AncillaryPayload = PressReleasePayload

export function payloadWantsVideoRequest(payload: AncillaryPayload): boolean {
  return Boolean(
    payload.requestFootage ||
      payload.footageTimeframe?.trim() ||
      payload.whatToLookFor?.trim()
  )
}

const emptyContact = (): PressReleaseDraft["mediaContact"] => ({
  name: "",
  agency: "",
  phone: "",
  secondaryPhone: "",
  email: "",
})

function emptyRelease(): PressReleaseDraft {
  return {
    status: "ready",
    headline: "",
    dateline: { city: "", state: "", releaseDate: "" },
    bodyParagraphs: [],
    boilerplate: "",
    mediaContact: emptyContact(),
    usedFactIds: [],
    detailsToVerify: [],
    humanReviewReason: "",
  }
}

function emptySupplementary(): SupplementaryDraft {
  return {
    status: "ready",
    facebook: "",
    x: "",
    talkingPoints: [],
    usedFactIds: [],
    detailsToVerify: [],
    humanReviewReason: "",
  }
}

function retainSelectedDraftOutputs(
  finalPackage: QualityGateResult["finalPackage"],
  supplementary: SupplementaryDraft,
  assistance: AssistanceDraft | null,
  selection: MultiOutputSelection
): QualityGateResult["finalPackage"] {
  const assistanceRendered = assistance ? renderAssistanceRequest(assistance) : ""
  const retainFacebook =
    selection.facebook && !finalPackage.facebook.trim() && Boolean(supplementary.facebook.trim())
  const retainX =
    selection.twitter && !finalPackage.x.trim() && Boolean(supplementary.x.trim())
  const retainTalkingPoints =
    selection.talkingPoints &&
    finalPackage.talkingPoints.length === 0 &&
    supplementary.talkingPoints.length > 0
  const retainAssistance =
    selection.videoRequest &&
    !finalPackage.assistanceRequest.trim() &&
    Boolean(assistanceRendered.trim())
  const usedFactIds = new Set(finalPackage.usedFactIds)

  if (retainFacebook || retainX || retainTalkingPoints) {
    supplementary.usedFactIds.forEach((id) => usedFactIds.add(id))
  }
  if (retainAssistance) {
    assistance?.usedFactIds.forEach((id) => usedFactIds.add(id))
  }

  return {
    ...finalPackage,
    facebook: retainFacebook ? supplementary.facebook : finalPackage.facebook,
    x: retainX ? supplementary.x : finalPackage.x,
    talkingPoints: retainTalkingPoints
      ? supplementary.talkingPoints
      : finalPackage.talkingPoints,
    assistanceRequest: retainAssistance
      ? assistanceRendered
      : finalPackage.assistanceRequest,
    usedFactIds: [...usedFactIds],
  }
}

function knownFactError(ids: string[], known: Set<string>, call: string): string | null {
  const unknown = ids.filter((id) => !known.has(id))
  return unknown.length ? `${call} returned unknown fact IDs: ${unknown.join(", ")}` : null
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function deterministicChecks(
  payload: PressReleasePayload,
  finalPackage: {
    dateline: { city: string; state: string; releaseDate: string }
    bodyParagraphs: string[]
    mediaContact: PressReleaseDraft["mediaContact"]
    facebook: string
    x: string
    talkingPoints: string[]
    assistanceRequest: string
  },
  selection: MultiOutputSelection
): { fatal: string[]; verify: string[] } {
  const fatal: string[] = []
  const verify: string[] = []
  const allPublicText = [
    finalPackage.bodyParagraphs.join(" "),
    finalPackage.assistanceRequest,
    finalPackage.facebook,
    finalPackage.x,
    finalPackage.talkingPoints.join(" "),
  ].join(" ").toLowerCase()
  if (selection.pressRelease) {
    if (!finalPackage.dateline.city || !finalPackage.dateline.state || !finalPackage.dateline.releaseDate) {
      fatal.push("The press-release dateline is incomplete.")
    }
    const normalized = finalPackage.bodyParagraphs.map((p) => p.trim().toLowerCase()).filter(Boolean)
    if (new Set(normalized).size !== normalized.length) fatal.push("The release contains duplicate paragraphs.")
  }
  if (finalPackage.x.length > 280) fatal.push("The X post exceeds 280 characters.")
  const exactAddress = payload.exactAddress?.trim()
  if (
    exactAddress &&
    !payload.publishExactAddress &&
    [finalPackage.bodyParagraphs.join(" "), finalPackage.assistanceRequest].some((text) =>
      text.toLowerCase().includes(exactAddress.toLowerCase())
    )
  ) {
    fatal.push("An exact address appears despite the publication policy.")
  }
  for (const person of payload.persons) {
    const prohibitedName = (person.isMinor || payload.protectedVictim) && person.name.trim()
    if (prohibitedName && allPublicText.includes(person.name.trim().toLowerCase())) {
      fatal.push("A juvenile or protected-person name appears in public copy.")
      break
    }
  }
  if (payload.incidentDate && !validDate(payload.incidentDate)) verify.push("Confirm the incident date.")
  if (payload.incidentTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(payload.incidentTime)) {
    verify.push("Confirm the incident time.")
  }
  const contact = finalPackage.mediaContact
  if (selection.pressRelease) {
    if (!contact.name) verify.push("Confirm the media contact name.")
    if (!contact.phone) verify.push("Confirm the media contact phone number.")
    else if (!/^[+()0-9.\-\s/extEXT]+$/.test(contact.phone)) verify.push("Confirm the media contact phone format.")
    if (!contact.email) verify.push("Confirm the media contact email.")
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) verify.push("Confirm the media contact email format.")
  }
  if (payload.onlineTipsUrl) {
    try {
      const url = new URL(payload.onlineTipsUrl)
      if (!["http:", "https:"].includes(url.protocol)) verify.push("Confirm the online tip URL.")
    } catch {
      verify.push("Confirm the online tip URL.")
    }
  }
  return { fatal, verify }
}

export async function generateMultiOutput(
  payload: AncillaryPayload,
  selection: MultiOutputSelection = {
    pressRelease: true,
    facebook: true,
    twitter: true,
    talkingPoints: true,
    videoRequest: true,
  }
): Promise<AiResult<MultiOutputResult>> {
  if (!selectionHasAny(selection)) {
    return { ok: false, reason: "invalid_json", detail: "Select at least one output to generate." }
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }
  const normalizedPayload = {
    ...payload,
    requestFootage: selection.videoRequest ? true : Boolean(payload.requestFootage),
  }
  const releaseDateIso = validDate(payload.releaseDate || "")
    ? payload.releaseDate!
    : new Date().toISOString().slice(0, 10)
  const releaseDateDisplay = new Date(`${releaseDateIso}T12:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const normalized = buildCall1UserPayload(normalizedPayload, {
    releaseDateDisplay,
    releaseDateIso,
    wordCountMin: INCIDENT_MIN,
    wordCountMax: INCIDENT_MAX,
  })
  const knownIds = new Set(normalized.publicationFacts.map((fact) => fact.id))
  const needsReleaseContext =
    selection.pressRelease || selection.facebook || selection.twitter || selection.talkingPoints

  let releaseDraft = emptyRelease()
  if (needsReleaseContext) {
    const result = await generateStructuredPressReleaseDraft(normalizedPayload)
    if (!result.ok) return result
    releaseDraft = result.data
    const idError = knownFactError(releaseDraft.usedFactIds, knownIds, "Call 1")
    if (idError) return { ok: false, reason: "invalid_json", detail: idError }
    if (releaseDraft.bodyParagraphs.length && !releaseDraft.usedFactIds.length) {
      return { ok: false, reason: "invalid_json", detail: "Call 1 omitted fact citations." }
    }
  }

  const { default: OpenAI } = await import("openai")
  const openai = new OpenAI({ apiKey })
  let supplementary = emptySupplementary()
  if (selection.facebook || selection.twitter || selection.talkingPoints) {
    const result = await runPioStructuredCall(
      openai,
      SUPPLEMENTARY_DRAFT_PROMPT,
      {
        normalized,
        pressReleaseDraft: releaseDraft,
        requested: {
          facebook: selection.facebook,
          x: selection.twitter,
          talkingPoints: selection.talkingPoints,
        },
      },
      SUPPLEMENTARY_RESPONSE_FORMAT,
      supplementaryDraftSchema,
      2400,
      0.1
    )
    if (!result.ok) return result
    supplementary = result.data
    const idError = knownFactError(supplementary.usedFactIds, knownIds, "Call 2")
    if (idError) return { ok: false, reason: "invalid_json", detail: idError }
    if (
      (supplementary.facebook || supplementary.x || supplementary.talkingPoints.length) &&
      !supplementary.usedFactIds.length
    ) {
      return { ok: false, reason: "invalid_json", detail: "Call 2 omitted fact citations." }
    }
  }

  let assistance: AssistanceDraft | null = null
  if (selection.videoRequest) {
    const result = await generateStructuredCommunityRequest({
      normalized,
      requested: true,
      instruction: "Draft a public-assistance, witness, or video request only from supported facts.",
    })
    if (!result.ok) return result
    assistance = result.data
    const idError = knownFactError(assistance.usedFactIds, knownIds, "Call 3")
    if (idError) return { ok: false, reason: "invalid_json", detail: idError }
    if (assistance.paragraphs.length && !assistance.usedFactIds.length) {
      return { ok: false, reason: "invalid_json", detail: "Call 3 omitted fact citations." }
    }
  }

  const gateResult = await runPioStructuredCall(
    openai,
    PIO_QUALITY_GATE_PROMPT,
    {
      normalized,
      selectedOutputs: selection,
      drafts: {
        pressRelease: releaseDraft,
        supplementary,
        assistance,
        assistanceRendered: assistance ? renderAssistanceRequest(assistance) : "",
      },
      instruction:
        "Review all selected drafts. Keep unselected finalPackage fields empty. Correct safely or require human review.",
    },
    QUALITY_GATE_RESPONSE_FORMAT,
    qualityGateSchema,
    6000,
    0
  )
  if (!gateResult.ok) return gateResult
  const gate = gateResult.data
  const finalPackage =
    gate.status === "needs_human_review"
      ? gate.finalPackage
      : retainSelectedDraftOutputs(gate.finalPackage, supplementary, assistance, selection)
  const idError = knownFactError(finalPackage.usedFactIds, knownIds, "Call 4")
  if (idError) return { ok: false, reason: "invalid_json", detail: idError }
  if (
    gate.status !== "needs_human_review" &&
    !finalPackage.usedFactIds.length
  ) {
    return { ok: false, reason: "invalid_json", detail: "Call 4 omitted fact citations." }
  }

  const checks = deterministicChecks(payload, finalPackage, selection)
  const priorHumanReview = [releaseDraft, supplementary, assistance]
    .filter((draft): draft is PressReleaseDraft | SupplementaryDraft | AssistanceDraft => Boolean(draft))
    .filter((draft) => draft.status === "needs_human_review")
  const mustReview =
    gate.status === "needs_human_review" ||
    checks.fatal.length > 0 ||
    priorHumanReview.length > 0 ||
    normalized.normalizationWarnings.some((warning) => warning.startsWith("Material conflict"))
  const detailsToVerify = [
    ...normalized.normalizationWarnings,
    ...releaseDraft.detailsToVerify,
    ...supplementary.detailsToVerify,
    ...(assistance?.detailsToVerify || []),
    ...gate.detailsToVerify,
    ...checks.verify,
    ...checks.fatal,
  ].map((value) => value.trim()).filter(Boolean)
  const uniqueDetails = [...new Set(detailsToVerify)]
  const humanReviewReason = mustReview
    ? [
        gate.humanReviewReason,
        ...priorHumanReview.map((draft) => draft.humanReviewReason),
        ...checks.fatal,
      ].filter(Boolean).join(" ")
    : ""
  const publicRelease = selection.pressRelease && !mustReview
    ? renderStructuredPressRelease(finalPackage)
    : ""

  return {
    ok: true,
    data: {
      pressRelease: publicRelease,
      facebook: selection.facebook && !mustReview ? finalPackage.facebook : "",
      twitter: selection.twitter && !mustReview ? finalPackage.x : "",
      talkingPoints:
        selection.talkingPoints && !mustReview
          ? formatTalkingPointsForDisplay(finalPackage.talkingPoints)
          : "",
      communityRequest:
        selection.videoRequest && !mustReview ? finalPackage.assistanceRequest || null : null,
      headline: mustReview ? "" : finalPackage.headline,
      body: mustReview ? [] : finalPackage.bodyParagraphs,
      mediaContact: mustReview ? emptyContact() : finalPackage.mediaContact,
      detailsToVerify: uniqueDetails,
      humanReviewReason,
      qualityStatus: mustReview ? "needs_human_review" : gate.status,
      statusLabel: mustReview
        ? "Needs confirmation"
        : gate.status === "approved_with_revisions"
          ? "SaferU reviewed"
          : uniqueDetails.length
            ? "Needs confirmation"
            : "Ready for agency review",
      revisionsMade: gate.revisionsMade,
    },
  }
}
