/** Strict runtime and OpenAI Structured Output contracts for the four-call PIO pipeline. */
import { z } from "zod"

const statusSchema = z.enum(["ready", "needs_human_review"])
const mediaContactSchema = z
  .object({
    name: z.string(),
    agency: z.string(),
    phone: z.string(),
    secondaryPhone: z.string(),
    email: z.string(),
  })
  .strict()

export const pressReleaseDraftSchema = z
  .object({
    status: statusSchema,
    headline: z.string(),
    dateline: z
      .object({ city: z.string(), state: z.string(), releaseDate: z.string() })
      .strict(),
    bodyParagraphs: z.array(z.string()).max(10),
    boilerplate: z.string(),
    mediaContact: mediaContactSchema,
    usedFactIds: z.array(z.string()),
    detailsToVerify: z.array(z.string()),
    humanReviewReason: z.string(),
  })
  .strict()

export const supplementaryDraftSchema = z
  .object({
    status: statusSchema,
    facebook: z.string(),
    x: z.string().max(280),
    talkingPoints: z.array(z.string()).max(8),
    usedFactIds: z.array(z.string()),
    detailsToVerify: z.array(z.string()),
    humanReviewReason: z.string(),
  })
  .strict()

export const assistanceDraftSchema = z
  .object({
    status: statusSchema,
    headline: z.string(),
    paragraphs: z.array(z.string()).max(5),
    safetyLine: z.string(),
    usedFactIds: z.array(z.string()),
    detailsToVerify: z.array(z.string()),
    humanReviewReason: z.string(),
  })
  .strict()

const finalPackageSchema = z
  .object({
    headline: z.string(),
    dateline: z
      .object({ city: z.string(), state: z.string(), releaseDate: z.string() })
      .strict(),
    bodyParagraphs: z.array(z.string()).max(10),
    boilerplate: z.string(),
    mediaContact: mediaContactSchema,
    facebook: z.string(),
    x: z.string().max(280),
    talkingPoints: z.array(z.string()).max(8),
    assistanceRequest: z.string(),
    usedFactIds: z.array(z.string()),
  })
  .strict()

export const qualityGateSchema = z
  .object({
    status: z.enum(["approved", "approved_with_revisions", "needs_human_review"]),
    finalPackage: finalPackageSchema,
    detailsToVerify: z.array(z.string()),
    humanReviewReason: z.string(),
    revisionsMade: z.array(z.string()),
  })
  .strict()

const stringArray = { type: "array", items: { type: "string" } } as const
const datelineJson = {
  type: "object",
  additionalProperties: false,
  required: ["city", "state", "releaseDate"],
  properties: {
    city: { type: "string" },
    state: { type: "string" },
    releaseDate: { type: "string" },
  },
} as const
const contactJson = {
  type: "object",
  additionalProperties: false,
  required: ["name", "agency", "phone", "secondaryPhone", "email"],
  properties: {
    name: { type: "string" },
    agency: { type: "string" },
    phone: { type: "string" },
    secondaryPhone: { type: "string" },
    email: { type: "string" },
  },
} as const
const responseFormat = (name: string, schema: object) => ({
  type: "json_schema" as const,
  json_schema: { name, strict: true, schema },
})

export const PRESS_RELEASE_DRAFT_RESPONSE_FORMAT = responseFormat(
  "saferu_press_release_draft",
  {
    type: "object",
    additionalProperties: false,
    required: [
      "status", "headline", "dateline", "bodyParagraphs", "boilerplate",
      "mediaContact", "usedFactIds", "detailsToVerify", "humanReviewReason",
    ],
    properties: {
      status: { type: "string", enum: ["ready", "needs_human_review"] },
      headline: { type: "string" },
      dateline: datelineJson,
      bodyParagraphs: { ...stringArray, maxItems: 10 },
      boilerplate: { type: "string" },
      mediaContact: contactJson,
      usedFactIds: stringArray,
      detailsToVerify: stringArray,
      humanReviewReason: { type: "string" },
    },
  }
)

export const SUPPLEMENTARY_RESPONSE_FORMAT = responseFormat("saferu_supplementary_outputs", {
  type: "object",
  additionalProperties: false,
  required: [
    "status", "facebook", "x", "talkingPoints", "usedFactIds",
    "detailsToVerify", "humanReviewReason",
  ],
  properties: {
    status: { type: "string", enum: ["ready", "needs_human_review"] },
    facebook: { type: "string" },
    x: { type: "string", maxLength: 280 },
    talkingPoints: { ...stringArray, maxItems: 8 },
    usedFactIds: stringArray,
    detailsToVerify: stringArray,
    humanReviewReason: { type: "string" },
  },
})

export const ASSISTANCE_RESPONSE_FORMAT = responseFormat("saferu_public_assistance_request", {
  type: "object",
  additionalProperties: false,
  required: [
    "status", "headline", "paragraphs", "safetyLine", "usedFactIds",
    "detailsToVerify", "humanReviewReason",
  ],
  properties: {
    status: { type: "string", enum: ["ready", "needs_human_review"] },
    headline: { type: "string" },
    paragraphs: { ...stringArray, maxItems: 5 },
    safetyLine: { type: "string" },
    usedFactIds: stringArray,
    detailsToVerify: stringArray,
    humanReviewReason: { type: "string" },
  },
})

export const QUALITY_GATE_RESPONSE_FORMAT = responseFormat("saferu_pio_quality_gate", {
  type: "object",
  additionalProperties: false,
  required: [
    "status", "finalPackage", "detailsToVerify", "humanReviewReason", "revisionsMade",
  ],
  properties: {
    status: {
      type: "string",
      enum: ["approved", "approved_with_revisions", "needs_human_review"],
    },
    finalPackage: {
      type: "object",
      additionalProperties: false,
      required: [
        "headline", "dateline", "bodyParagraphs", "boilerplate", "mediaContact",
        "facebook", "x", "talkingPoints", "assistanceRequest", "usedFactIds",
      ],
      properties: {
        headline: { type: "string" },
        dateline: datelineJson,
        bodyParagraphs: { ...stringArray, maxItems: 10 },
        boilerplate: { type: "string" },
        mediaContact: contactJson,
        facebook: { type: "string" },
        x: { type: "string", maxLength: 280 },
        talkingPoints: { ...stringArray, maxItems: 8 },
        assistanceRequest: { type: "string" },
        usedFactIds: stringArray,
      },
    },
    detailsToVerify: stringArray,
    humanReviewReason: { type: "string" },
    revisionsMade: stringArray,
  },
})

/** @deprecated use SUPPLEMENTARY_RESPONSE_FORMAT */
export const ANCILLARY_OUTPUTS_JSON_SCHEMA = SUPPLEMENTARY_RESPONSE_FORMAT

export type PressReleaseDraft = z.infer<typeof pressReleaseDraftSchema>
export type SupplementaryDraft = z.infer<typeof supplementaryDraftSchema>
export type AssistanceDraft = z.infer<typeof assistanceDraftSchema>
export type QualityGateResult = z.infer<typeof qualityGateSchema>
