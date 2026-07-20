import { z } from "zod"

export const EVENT_CAMPAIGN_KEYS = [
  "initial_announcement",
  "event_highlight",
  "one_week_reminder",
  "what_to_expect",
  "day_before",
  "event_day",
  "optional_final",
  "thank_you",
] as const

export const eventCampaignKeySchema = z.enum(EVENT_CAMPAIGN_KEYS)

export const eventStrategySlotSchema = z
  .object({
    key: eventCampaignKeySchema,
    included: z.boolean(),
    campaignStage: z.string(),
    strategicPurpose: z.string(),
    focus: z.string(),
    reason: z.string(),
  })
  .strict()

export const eventStrategySchema = z
  .object({
    status: z.enum(["ready", "needs_human_review"]),
    campaignApproach: z.string(),
    slots: z.array(eventStrategySlotSchema).length(EVENT_CAMPAIGN_KEYS.length),
    detailsToVerify: z.array(z.string()),
    humanReviewReason: z.string(),
  })
  .strict()

export const eventWriterPostSchema = z
  .object({
    key: eventCampaignKeySchema,
    postTitle: z.string(),
    message: z.string(),
    callToAction: z.string(),
    suggestedImage: z.string(),
    detailsToVerify: z.array(z.string()),
    tag: z.string(),
  })
  .strict()

export const eventWriterSchema = z
  .object({
    status: z.enum(["ready", "needs_human_review"]),
    posts: z.array(eventWriterPostSchema),
    humanReviewReason: z.string(),
  })
  .strict()

const qualityCheckSchema = z
  .object({
    factsSupported: z.boolean(),
    timingAccurate: z.boolean(),
    agencyRoleCorrect: z.boolean(),
    organizationVoiceCorrect: z.boolean(),
    stagePurposeMet: z.boolean(),
    channelConstraintMet: z.boolean(),
    ctaSupported: z.boolean(),
    readyToPublish: z.boolean(),
  })
  .strict()

export const eventQualityPostSchema = z
  .object({
    key: eventCampaignKeySchema,
    status: z.enum(["approved", "needs_correction", "needs_human_review"]),
    checks: qualityCheckSchema,
    feedback: z.array(z.string()),
    detailsToVerify: z.array(z.string()),
  })
  .strict()

export const eventQualitySchema = z
  .object({
    status: z.enum(["approved", "needs_correction", "needs_human_review"]),
    posts: z.array(eventQualityPostSchema),
    humanReviewReason: z.string(),
  })
  .strict()

const stringArray = { type: "array", items: { type: "string" } } as const
const keyProperty = { type: "string", enum: EVENT_CAMPAIGN_KEYS } as const

export const EVENT_STRATEGY_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_event_campaign_strategy",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "campaignApproach", "slots", "detailsToVerify", "humanReviewReason"],
      properties: {
        status: { type: "string", enum: ["ready", "needs_human_review"] },
        campaignApproach: { type: "string" },
        slots: {
          type: "array",
          minItems: EVENT_CAMPAIGN_KEYS.length,
          maxItems: EVENT_CAMPAIGN_KEYS.length,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["key", "included", "campaignStage", "strategicPurpose", "focus", "reason"],
            properties: {
              key: keyProperty,
              included: { type: "boolean" },
              campaignStage: { type: "string" },
              strategicPurpose: { type: "string" },
              focus: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
        detailsToVerify: stringArray,
        humanReviewReason: { type: "string" },
      },
    },
  },
}

export const EVENT_WRITER_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_event_campaign_copy",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "posts", "humanReviewReason"],
      properties: {
        status: { type: "string", enum: ["ready", "needs_human_review"] },
        posts: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "key",
              "postTitle",
              "message",
              "callToAction",
              "suggestedImage",
              "detailsToVerify",
              "tag",
            ],
            properties: {
              key: keyProperty,
              postTitle: { type: "string" },
              message: { type: "string" },
              callToAction: { type: "string" },
              suggestedImage: { type: "string" },
              detailsToVerify: stringArray,
              tag: { type: "string" },
            },
          },
        },
        humanReviewReason: { type: "string" },
      },
    },
  },
}

export const EVENT_QUALITY_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_event_campaign_quality_gate",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "posts", "humanReviewReason"],
      properties: {
        status: {
          type: "string",
          enum: ["approved", "needs_correction", "needs_human_review"],
        },
        posts: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["key", "status", "checks", "feedback", "detailsToVerify"],
            properties: {
              key: keyProperty,
              status: {
                type: "string",
                enum: ["approved", "needs_correction", "needs_human_review"],
              },
              checks: {
                type: "object",
                additionalProperties: false,
                required: [
                  "factsSupported",
                  "timingAccurate",
                  "agencyRoleCorrect",
                  "organizationVoiceCorrect",
                  "stagePurposeMet",
                  "channelConstraintMet",
                  "ctaSupported",
                  "readyToPublish",
                ],
                properties: {
                  factsSupported: { type: "boolean" },
                  timingAccurate: { type: "boolean" },
                  agencyRoleCorrect: { type: "boolean" },
                  organizationVoiceCorrect: { type: "boolean" },
                  stagePurposeMet: { type: "boolean" },
                  channelConstraintMet: { type: "boolean" },
                  ctaSupported: { type: "boolean" },
                  readyToPublish: { type: "boolean" },
                },
              },
              feedback: stringArray,
              detailsToVerify: stringArray,
            },
          },
        },
        humanReviewReason: { type: "string" },
      },
    },
  },
}

export type EventStrategy = z.infer<typeof eventStrategySchema>
export type EventWriterResult = z.infer<typeof eventWriterSchema>
export type EventQualityResult = z.infer<typeof eventQualitySchema>
