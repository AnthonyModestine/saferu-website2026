import { z } from "zod"

export const MESSAGE_FORMATS = ["paragraph", "bullets", "callout"] as const
export type MessageFormat = (typeof MESSAGE_FORMATS)[number]

export const safetyResearchSchema = z.object({
  headline: z.string().min(1),
  message: z.string().min(1),
  message_format: z.enum(MESSAGE_FORMATS).default("paragraph"),
  visual_concept: z.string().min(1),
  important_visual_details: z.array(z.string()).default([]),
  source_records: z
    .array(
      z.object({
        organization: z.string(),
        url: z.string(),
        claim_supported: z.string(),
      })
    )
    .default([]),
})

export type SafetyResearchResult = z.infer<typeof safetyResearchSchema>

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
    source_records: {
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
    },
  },
} as const

export const graphicQaSchema = z.object({
  pass: z.boolean(),
  issues: z.array(z.string()).default([]),
  accidental_logo: z.boolean().default(false),
})

export type GraphicQaResult = z.infer<typeof graphicQaSchema>

export const GRAPHIC_QA_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["pass", "issues", "accidental_logo"],
  properties: {
    pass: { type: "boolean" },
    issues: { type: "array", items: { type: "string" } },
    accidental_logo: { type: "boolean" },
  },
} as const
