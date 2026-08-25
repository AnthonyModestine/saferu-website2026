import { z } from "zod"
import type { SafetyResearchBrief } from "@/lib/pio-graphic-studio-types"

const stringArray = { type: "array", items: { type: "string" } } as const

const sourceJson = {
  type: "object",
  additionalProperties: false,
  required: ["organization", "title", "url", "claim_supported"],
  properties: {
    organization: { type: "string" },
    title: { type: "string" },
    url: { type: "string" },
    claim_supported: { type: "string" },
  },
} as const

export const safetyResearchBriefSchema = z
  .object({
    verified_topic: z.string(),
    primary_hazard: z.string(),
    primary_takeaway: z.string(),
    headline_options: z.array(z.string()).max(6),
    recommended_headline: z.string(),
    supporting_line: z.string(),
    resident_message: z.string(),
    emergency_message: z.string(),
    visual_concept: z.string(),
    visual_style_recommendation: z.string(),
    visual_must_show: z.array(z.string()).max(8),
    visual_must_avoid: z.array(z.string()).max(8),
    accuracy_notes: z.array(z.string()).max(8),
    user_request_corrected: z.boolean(),
    correction_explanation: z.string(),
    sources: z
      .array(
        z
          .object({
            organization: z.string(),
            title: z.string(),
            url: z.string(),
            claim_supported: z.string(),
          })
          .strict()
      )
      .max(6),
    caption: z.string(),
  })
  .strict()

export type SafetyResearchBriefPayload = z.infer<typeof safetyResearchBriefSchema>

export const SAFETY_RESEARCH_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_safety_graphic_brief",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "verified_topic",
        "primary_hazard",
        "primary_takeaway",
        "headline_options",
        "recommended_headline",
        "supporting_line",
        "resident_message",
        "emergency_message",
        "visual_concept",
        "visual_style_recommendation",
        "visual_must_show",
        "visual_must_avoid",
        "accuracy_notes",
        "user_request_corrected",
        "correction_explanation",
        "sources",
        "caption",
      ],
      properties: {
        verified_topic: { type: "string" },
        primary_hazard: { type: "string" },
        primary_takeaway: { type: "string" },
        headline_options: stringArray,
        recommended_headline: { type: "string" },
        supporting_line: { type: "string" },
        resident_message: { type: "string" },
        emergency_message: { type: "string" },
        visual_concept: { type: "string" },
        visual_style_recommendation: { type: "string" },
        visual_must_show: stringArray,
        visual_must_avoid: stringArray,
        accuracy_notes: stringArray,
        user_request_corrected: { type: "boolean" },
        correction_explanation: { type: "string" },
        sources: { type: "array", items: sourceJson },
        caption: { type: "string" },
      },
    },
  },
}

export function normalizeSafetyResearchBrief(
  brief: SafetyResearchBriefPayload
): SafetyResearchBrief {
  return {
    verified_topic: brief.verified_topic.trim().slice(0, 160),
    primary_hazard: brief.primary_hazard.trim().slice(0, 220),
    primary_takeaway: brief.primary_takeaway.trim().slice(0, 220),
    headline_options: brief.headline_options.map((item) => item.trim()).filter(Boolean).slice(0, 6),
    recommended_headline: brief.recommended_headline.trim().slice(0, 80),
    supporting_line: brief.supporting_line.trim().slice(0, 160),
    resident_message: brief.resident_message.trim().slice(0, 320),
    emergency_message: brief.emergency_message.trim().slice(0, 160),
    visual_concept: brief.visual_concept.trim().slice(0, 400),
    visual_style_recommendation: brief.visual_style_recommendation.trim().slice(0, 80),
    visual_must_show: brief.visual_must_show.map((item) => item.trim()).filter(Boolean).slice(0, 8),
    visual_must_avoid: brief.visual_must_avoid.map((item) => item.trim()).filter(Boolean).slice(0, 8),
    accuracy_notes: brief.accuracy_notes.map((item) => item.trim()).filter(Boolean).slice(0, 8),
    user_request_corrected: brief.user_request_corrected,
    correction_explanation: brief.correction_explanation.trim().slice(0, 400),
    sources: brief.sources
      .map((source) => ({
        organization: source.organization.trim().slice(0, 120),
        title: source.title.trim().slice(0, 200),
        url: source.url.trim().slice(0, 400),
        claim_supported: source.claim_supported.trim().slice(0, 300),
      }))
      .filter((source) => source.organization || source.url)
      .slice(0, 6),
    caption: (brief.caption.trim() || brief.resident_message.trim()).slice(0, 500),
  }
}

export function buildFallbackSafetyResearchBrief(opts: {
  category: string
  residentNeed: string
  audience: string
  style: string
  visualRequest?: string
}): SafetyResearchBrief {
  const need = opts.residentNeed.trim()
  const firstSentence = need.split(/(?<=[.!?])\s+/)[0]?.trim() || need
  const headline =
    firstSentence.length <= 48
      ? firstSentence.replace(/[.!?]+$/, "").toUpperCase()
      : "STOP. VERIFY BEFORE YOU ACT."

  const residentMessage =
    need.length <= 220 ? need : `${need.slice(0, 200).replace(/\s+\S*$/, "")}…`

  const visualConcept =
    opts.visualRequest?.trim() ||
    `A clear ${opts.category.toLowerCase()} public-safety graphic that shows the hazard and the correct resident action.`

  return normalizeSafetyResearchBrief({
    verified_topic: opts.category,
    primary_hazard: `Residents may face a ${opts.category.toLowerCase()} risk.`,
    primary_takeaway: residentMessage,
    headline_options: [headline],
    recommended_headline: headline,
    supporting_line: "",
    resident_message: residentMessage,
    emergency_message: "",
    visual_concept: visualConcept,
    visual_style_recommendation: opts.style,
    visual_must_show: ["clear safety warning", "one dominant visual"],
    visual_must_avoid: ["fake agency badge", "fearmongering", "excessive text"],
    accuracy_notes: ["Generated from agency input without live web research."],
    user_request_corrected: false,
    correction_explanation: "",
    sources: [],
    caption: residentMessage,
  })
}
