/**
 * Pure inspection normalization — no OpenAI / server-only.
 *
 * Philosophy: creative preferences must not block publication;
 * unresolved material safety/factual concerns must not silently pass.
 */

import type {
  GraphicInspection,
  InspectionDefect,
  InspectionOutcome,
} from "@/lib/graphic-studio/inspection-types"
import type { GraphicQaResult } from "@/lib/graphic-studio/schemas"
import {
  compareExtractedText,
  textFidelityNeedsHumanReview,
  type TextFidelityStatus,
} from "@/lib/graphic-studio/text-fidelity"

/** Pure design preference — never critical by itself. */
const DESIGN_PREFERENCE_RE =
  /\b(artistic|aesthetic|composition preference|color preference|style preference|layout preference|personal taste)\b/i

/** Material safety / factual language — never demote away from blocking review. */
const MATERIAL_SAFETY_RE =
  /\b(unsafe|safety|airbag|rear-?facing|hazard|injury|death|incorrect (practice|depiction|equipment)|misleading|wrong (agency|contact|logo)|fabricat|seal|badge|emergency contact)\b/i

const SUBJECTIVE_TONE_RE =
  /\b(urgency|panic|dramatic|emotional tone|feels? (too )?(intense|alarming))\b/i

function isMaterialSafetyOrFactual(d: InspectionDefect): boolean {
  if (
    d.category === "safety_accuracy" ||
    d.category === "agency_branding" ||
    d.category === "text_fidelity"
  ) {
    return true
  }
  return MATERIAL_SAFETY_RE.test(d.description)
}

function isPureDesignPreference(d: InspectionDefect): boolean {
  if (isMaterialSafetyOrFactual(d)) return false
  return (
    (d.category === "composition" ||
      d.category === "typography" ||
      d.category === "message_clarity" ||
      d.category === "other") &&
    (DESIGN_PREFERENCE_RE.test(d.description) ||
      (SUBJECTIVE_TONE_RE.test(d.description) && !MATERIAL_SAFETY_RE.test(d.description)))
  )
}

function isCaseOnlyTextNit(d: InspectionDefect): boolean {
  if (d.category !== "text_fidelity") return false
  if (
    /\b(missing|wrong meaning|different words|extra instruction|invent|unreadable|not present)\b/i.test(
      d.description
    )
  ) {
    return false
  }
  return /\b(capitali[sz]|punctuation|colon|comma|apostrophe)\b/i.test(d.description)
}

/**
 * Demote only harmless creative preferences and pure case/punctuation nits.
 * Never demote material safety/factual defects merely because wording is uncertain
 * ("may", "might", "could", "appears").
 */
export function demoteUnsupportedCriticals(
  defects: InspectionDefect[]
): InspectionDefect[] {
  return defects.map((d) => {
    if (d.severity !== "critical") return d
    if (isMaterialSafetyOrFactual(d)) return d
    if (isPureDesignPreference(d) || isCaseOnlyTextNit(d)) {
      return { ...d, severity: "major" as const }
    }
    return d
  })
}

/** Unresolved material concerns with low confidence → human review, not silent pass. */
export function needsHumanReviewForUnresolvedSafety(
  defects: InspectionDefect[]
): boolean {
  return defects.some((d) => {
    if (!isMaterialSafetyOrFactual(d)) return false
    if (d.severity === "critical") return false // already blocks as critical
    const conf = d.confidence
    const uncertainLang = /\b(may|might|could|possibly|seem|appears?|unclear|uncertain)\b/i.test(
      d.description
    )
    return conf === "low" || conf === "medium" || uncertainLang
  })
}

function statusFromRaw(
  status: TextFidelityStatus | undefined,
  extracted: string | undefined
): TextFidelityStatus {
  if (status) return status
  if (!extracted?.trim()) return "missing"
  return "uncertain"
}

function deriveOutcome(raw: GraphicQaResult, defects: InspectionDefect[]): InspectionOutcome {
  if (raw.accidental_logo) return "critical_failure"
  if (defects.some((d) => d.severity === "critical")) return "critical_failure"
  if (raw.outcome === "inspection_unavailable") return "inspection_unavailable"
  if (raw.outcome === "human_review_required") return "human_review_required"

  if (needsHumanReviewForUnresolvedSafety(defects)) {
    return "human_review_required"
  }

  const statusFidelity = {
    headlineStatus: statusFromRaw(raw.headline_text_status, raw.extracted_headline),
    messageStatus: statusFromRaw(raw.message_text_status, raw.extracted_message),
    headlineNormalizedExpected: "",
    messageNormalizedExpected: "",
    headlineNormalizedExtracted: raw.extracted_headline
      ? raw.extracted_headline.toLowerCase()
      : null,
    messageNormalizedExtracted: raw.extracted_message
      ? raw.extracted_message.toLowerCase()
      : null,
  }

  // Uncertain text recognition ≠ pass and ≠ confirmed spelling failure.
  if (textFidelityNeedsHumanReview(statusFidelity as never)) {
    return "human_review_required"
  }

  if (
    raw.headline_text_status === "mismatch" ||
    raw.headline_text_status === "missing" ||
    raw.headline_text_status === "unreadable" ||
    raw.message_text_status === "mismatch" ||
    raw.message_text_status === "missing" ||
    raw.message_text_status === "unreadable"
  ) {
    // Confirmed text problems: meaning issues should already be critical defects;
    // otherwise require correction.
    if (defects.some((d) => d.category === "text_fidelity" && d.severity === "critical")) {
      return "critical_failure"
    }
    return "correction_required"
  }

  // Programmatic compare when expected texts are available via extraction only —
  // full expected compare happens in callers that have approved copy.
  void compareExtractedText

  if (raw.outcome === "critical_failure") return "critical_failure"
  if (raw.outcome === "correction_required") return "correction_required"
  if (!raw.pass) {
    const joined = [...raw.issues, ...defects.map((d) => d.description)].join(" ").toLowerCase()
    if (/^headline matches|^message matches/.test(joined)) {
      return "correction_required"
    }
    if (
      /unsafe|fabricat|wrong agency|incorrect contact|missing approved|invented badge/.test(
        joined
      )
    ) {
      return "critical_failure"
    }
    return "correction_required"
  }
  if (
    raw.outcome === "passed_with_notes" ||
    raw.notes?.length ||
    raw.creative_notes?.length
  ) {
    return "passed_with_notes"
  }
  if (raw.outcome === "passed" || !raw.outcome) return "passed"
  return "critical_failure"
}

export function toInspection(raw: GraphicQaResult, model: string): GraphicInspection {
  let defects: InspectionDefect[] =
    raw.defects?.length > 0
      ? raw.defects.map((d) => ({
          category: d.category,
          severity: d.severity,
          description: d.description,
          location: d.location,
          suggestedCorrection: d.suggestedCorrection,
          confidence: d.confidence,
          observation: d.evidence,
        }))
      : (raw.issues || [])
          .filter((issue) => !/matches approved|supports the safety|not overcrowded/i.test(issue))
          .map((issue) => ({
            category: "other" as const,
            severity: "major" as const,
            description: issue,
            confidence: "medium" as const,
          }))

  defects = demoteUnsupportedCriticals(defects)

  let outcome = deriveOutcome(raw, defects)

  const hasCritical =
    raw.accidental_logo || defects.some((d) => d.severity === "critical")

  if (hasCritical) {
    outcome = "critical_failure"
  } else if (needsHumanReviewForUnresolvedSafety(defects)) {
    outcome = "human_review_required"
  } else if (outcome === "critical_failure" && !hasCritical) {
    outcome = "correction_required"
  } else if (
    outcome === "correction_required" ||
    outcome === "human_review_required" ||
    outcome === "inspection_unavailable"
  ) {
    // keep
  } else if (!raw.pass) {
    outcome = "correction_required"
  }

  const pass = outcome === "passed" || outcome === "passed_with_notes"

  return {
    outcome,
    pass,
    accidentalLogo: Boolean(raw.accidental_logo),
    defects,
    issues: defects.map((d) => d.description),
    notes: [...(raw.notes || []), ...(raw.creative_notes || [])],
    model,
    inspectedAt: new Date().toISOString(),
  }
}

/**
 * When no agency logo was supplied, drop "missing logo" complaints and
 * demote airbag/prohibition icons mistaken for invented agency seals.
 */
export function applyLogoExpectationGuards(
  inspection: GraphicInspection,
  hasLogo: boolean
): GraphicInspection {
  let defects = [...inspection.defects]
  let accidentalLogo = inspection.accidentalLogo

  if (!hasLogo) {
    defects = defects.filter(
      (d) => !/\bmissing (?:expected )?logo\b|\blogo (?:is )?missing\b|\bno logo present\b/i.test(d.description)
    )

    const airbagFalsePositive = defects.some((d) =>
      /\bairbag\b/i.test(`${d.description} ${d.observation || ""} ${d.location || ""}`)
    )
    if (airbagFalsePositive && accidentalLogo) {
      accidentalLogo = false
      defects = defects.filter(
        (d) =>
          !(
            d.category === "agency_branding" &&
            /\bairbag\b/i.test(`${d.description} ${d.observation || ""} ${d.location || ""}`)
          )
      )
    }
  }

  const hasCritical =
    accidentalLogo || defects.some((d) => d.severity === "critical")
  let outcome = inspection.outcome
  if (hasCritical) {
    outcome = "critical_failure"
  } else if (outcome === "critical_failure") {
    outcome = defects.length > 0 ? "correction_required" : "passed_with_notes"
  } else if (
    !hasLogo &&
    defects.length === 0 &&
    (outcome === "correction_required" || outcome === "critical_failure")
  ) {
    outcome = "passed"
  }

  const pass = outcome === "passed" || outcome === "passed_with_notes"
  return {
    ...inspection,
    defects,
    accidentalLogo,
    outcome,
    pass,
    issues: defects.map((d) => d.description),
  }
}
