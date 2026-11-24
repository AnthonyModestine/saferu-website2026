import { z } from "zod"
import {
  CREATIVE_STRATEGY_JSON_SCHEMA,
  creativeStrategySchema,
} from "@/lib/ai-intelligence/creative-strategy"

export const MESSAGE_FORMATS = ["paragraph", "bullets", "callout"] as const
export type MessageFormat = (typeof MESSAGE_FORMATS)[number]

export const safetyResearchSchema = z.object({
  headline: z.string().min(1),
  message: z.string().min(1),
  message_format: z.enum(MESSAGE_FORMATS).default("paragraph"),
  /** Complementary social caption — should not duplicate the full graphic. */
  social_caption: z.string().optional().default(""),
  visual_concept: z.string().min(1),
  important_visual_details: z.array(z.string()).default([]),
  /** Details researched but intentionally left out of graphic/caption. */
  omit_from_communication: z.array(z.string()).optional().default([]),
  source_records: z
    .array(
      z.object({
        organization: z.string(),
        url: z.string(),
        claim_supported: z.string(),
      })
    )
    .default([]),
  /** Present when creative strategist mode is enabled in research. */
  creative_strategy: creativeStrategySchema.optional(),
  /**
   * When authoritative web research was unavailable and claims are material,
   * research should set this so callers can prefer conceptual visuals / human review.
   */
  research_confidence: z.enum(["verified", "partial", "unavailable"]).optional(),
  /**
   * Shadow-mode adaptive recommendation: whether Variant B (creative direction)
   * would better serve this request than Variant A (model autonomy).
   * Never auto-routes production until evaluations prove value.
   */
  creative_direction_needed: z.boolean().optional(),
  creative_direction_reason: z.string().optional().default(""),
})

export type SafetyResearchResult = z.infer<typeof safetyResearchSchema>

const sourceRecordsSchema = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["organization", "url", "claim_supported"],
    properties: {
      organization: { type: "string" },
      url: { type: "string" },
      claim_supported: { type: "string" },
    },
  },
} as const

export const SAFETY_RESEARCH_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "message",
    "message_format",
    "visual_concept",
    "important_visual_details",
    "source_records",
  ],
  properties: {
    headline: { type: "string" },
    message: { type: "string" },
    message_format: { type: "string", enum: [...MESSAGE_FORMATS] },
    visual_concept: { type: "string" },
    important_visual_details: { type: "array", items: { type: "string" } },
    source_records: sourceRecordsSchema,
  },
} as const

/** Extended research schema — research model acts as creative strategist in one call. */
export const SAFETY_RESEARCH_WITH_STRATEGY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "message",
    "message_format",
    "visual_concept",
    "important_visual_details",
    "source_records",
    "creative_strategy",
    "research_confidence",
  ],
  properties: {
    headline: { type: "string" },
    message: { type: "string" },
    message_format: { type: "string", enum: [...MESSAGE_FORMATS] },
    visual_concept: { type: "string" },
    important_visual_details: { type: "array", items: { type: "string" } },
    source_records: sourceRecordsSchema,
    creative_strategy: CREATIVE_STRATEGY_JSON_SCHEMA,
    research_confidence: { type: "string", enum: ["verified", "partial", "unavailable"] },
  },
} as const

/** Lean research schema — caption distribution + adaptive shadow recommendation. */
export const SAFETY_RESEARCH_LEAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "message",
    "message_format",
    "social_caption",
    "visual_concept",
    "important_visual_details",
    "omit_from_communication",
    "source_records",
    "research_confidence",
    "creative_direction_needed",
    "creative_direction_reason",
  ],
  properties: {
    headline: { type: "string" },
    message: { type: "string" },
    message_format: { type: "string", enum: [...MESSAGE_FORMATS] },
    social_caption: { type: "string" },
    visual_concept: { type: "string" },
    important_visual_details: { type: "array", items: { type: "string" } },
    omit_from_communication: { type: "array", items: { type: "string" } },
    source_records: sourceRecordsSchema,
    research_confidence: { type: "string", enum: ["verified", "partial", "unavailable"] },
    creative_direction_needed: { type: "boolean" },
    creative_direction_reason: { type: "string" },
  },
} as const

export const SAFETY_RESEARCH_LEAN_WITH_STRATEGY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "message",
    "message_format",
    "social_caption",
    "visual_concept",
    "important_visual_details",
    "omit_from_communication",
    "source_records",
    "creative_strategy",
    "research_confidence",
    "creative_direction_needed",
    "creative_direction_reason",
  ],
  properties: {
    headline: { type: "string" },
    message: { type: "string" },
    message_format: { type: "string", enum: [...MESSAGE_FORMATS] },
    social_caption: { type: "string" },
    visual_concept: { type: "string" },
    important_visual_details: { type: "array", items: { type: "string" } },
    omit_from_communication: { type: "array", items: { type: "string" } },
    source_records: sourceRecordsSchema,
    creative_strategy: CREATIVE_STRATEGY_JSON_SCHEMA,
    research_confidence: { type: "string", enum: ["verified", "partial", "unavailable"] },
    creative_direction_needed: { type: "boolean" },
    creative_direction_reason: { type: "string" },
  },
} as const

export const graphicQaSchema = z.object({
  pass: z.boolean(),
  issues: z.array(z.string()).default([]),
  accidental_logo: z.boolean().default(false),
  outcome: z
    .enum([
      "passed",
      "passed_with_notes",
      "correction_required",
      "critical_failure",
      "human_review_required",
      "inspection_unavailable",
    ])
    .optional(),
  notes: z.array(z.string()).default([]),
  /** Raw OCR-like extraction — compared programmatically to approved copy. */
  extracted_headline: z.string().default(""),
  extracted_message: z.string().default(""),
  headline_text_status: z
    .enum(["match", "mismatch", "missing", "unreadable", "uncertain"])
    .default("uncertain"),
  message_text_status: z
    .enum(["match", "mismatch", "missing", "unreadable", "uncertain"])
    .default("uncertain"),
  /** Professional creative notes only — never used alone as critical failure. */
  creative_notes: z.array(z.string()).default([]),
  defects: z
    .array(
      z.object({
        category: z.enum([
          "text_fidelity",
          "safety_accuracy",
          "agency_branding",
          "message_clarity",
          "readability",
          "composition",
          "typography",
          "visual_defect",
          "instruction_adherence",
          "other",
        ]),
        severity: z.enum(["critical", "major", "minor", "note"]),
        description: z.string(),
        location: z.string().optional(),
        suggestedCorrection: z.string().optional(),
        confidence: z.enum(["high", "medium", "low"]).optional(),
        /** Required for critical: what visible evidence supports this claim. */
        evidence: z.string().optional(),
      })
    )
    .default([]),
})

export type GraphicQaResult = z.infer<typeof graphicQaSchema>

export const GRAPHIC_QA_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "pass",
    "issues",
    "accidental_logo",
    "outcome",
    "notes",
    "extracted_headline",
    "extracted_message",
    "headline_text_status",
    "message_text_status",
    "creative_notes",
    "defects",
  ],
  properties: {
    pass: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
    accidental_logo: { type: "boolean" },
    outcome: {
      type: "string",
      enum: [
        "passed",
        "passed_with_notes",
        "correction_required",
        "critical_failure",
        "human_review_required",
        "inspection_unavailable",
      ],
    },
    notes: { type: "array", items: { type: "string" } },
    extracted_headline: { type: "string" },
    extracted_message: { type: "string" },
    headline_text_status: {
      type: "string",
      enum: ["match", "mismatch", "missing", "unreadable", "uncertain"],
    },
    message_text_status: {
      type: "string",
      enum: ["match", "mismatch", "missing", "unreadable", "uncertain"],
    },
    creative_notes: { type: "array", items: { type: "string" } },
    defects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        // OpenAI strict JSON schema requires every property key to appear in required.
        required: [
          "category",
          "severity",
          "description",
          "location",
          "suggestedCorrection",
          "confidence",
          "evidence",
        ],
        properties: {
          category: {
            type: "string",
            enum: [
              "text_fidelity",
              "safety_accuracy",
              "agency_branding",
              "message_clarity",
              "readability",
              "composition",
              "typography",
              "visual_defect",
              "instruction_adherence",
              "other",
            ],
          },
          severity: { type: "string", enum: ["critical", "major", "minor", "note"] },
          description: { type: "string" },
          location: { type: "string" },
          suggestedCorrection: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          evidence: { type: "string" },
        },
      },
    },
  },
} as const
