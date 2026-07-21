import { z } from "zod"

const sourceClasses = [
  "official_operational_authority",
  "trusted_operational_intelligence",
  "authoritative_data",
  "official_guidance",
  "established_local_media",
  "saferu_internal",
] as const

const communicationPillars = [
  "urgent_alert",
  "operational_update",
  "timely_prevention",
  "incident_followup",
  "public_safety_education",
  "emergency_preparedness",
  "service_explainer",
  "community_relationship",
  "agency_event",
  "seasonal_safety",
  "community_resource",
  "reassurance_update",
] as const

const jurisdictionStatuses = [
  "inside_jurisdiction",
  "directly_affects_jurisdiction",
  "adjacent_travel_impact",
  "regional_impact",
  "unclear",
] as const

const supportingSourceSchema = z
  .object({
    sourceName: z.string(),
    sourceUrl: z.string(),
    sourceClass: z.enum(sourceClasses),
  })
  .strict()

const recommendationFactSchema = z
  .object({
    factId: z.string(),
    claim: z.string(),
    sourceName: z.string(),
    sourceUrl: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string(),
    expiresAt: z.string(),
  })
  .strict()

export const stage1ResultSchema = z
  .object({
    recommendations: z
      .array(
        z
          .object({
            id: z.string(),
            status: z.enum(["recommend_today", "schedule_this_week", "needs_human_review"]),
            title: z.string(),
            communicationPillar: z.enum(communicationPillars),
            priority: z.enum(["critical", "high", "normal"]),
            category: z.string(),
            communicationGoal: z.string(),
            whyNow: z.string(),
            whyThisAgency: z.string(),
            whyThisCommunity: z.string(),
            residentValue: z.string(),
            relationshipValue: z.string(),
            agencyAngle: z.string(),
            recommendedAction: z.string(),
            recommendedPostTiming: z.string(),
            jurisdictionStatus: z.enum(jurisdictionStatuses),
            issuingAuthority: z.string(),
            primarySourceName: z.string(),
            primarySourceUrl: z.string(),
            sourceClass: z.enum(sourceClasses),
            supportingSources: z.array(supportingSourceSchema),
            verifiedFacts: z.array(recommendationFactSchema).min(1),
            doNotClaim: z.array(z.string()),
            graphicSignals: z.array(z.string()),
            sourceConfidence: z.enum(["high", "medium"]),
            humanReviewReason: z.string(),
          })
          .strict()
      )
      .max(5),
    runSummary: z
      .object({
        urgentInformationFound: z.boolean(),
        proactiveOpportunityIncluded: z.boolean(),
        sourcesChecked: z.array(z.string()),
        sourceFamiliesWithNoResults: z.array(z.string()),
        notes: z.string(),
      })
      .strict(),
  })
  .strict()

export const stage2DraftSchema = z
  .object({
    status: z.enum(["ready", "needs_human_review"]),
    postText: z.string(),
    usedFactIds: z.array(z.string()),
    sourceAttribution: z.string(),
    humanReviewReason: z.string(),
  })
  .strict()

export const stage3DecisionSchema = z
  .object({
    status: z.enum(["approved", "edited", "needs_human_review"]),
    finalPostText: z.string(),
    changed: z.boolean(),
    changeReasons: z.array(z.string()),
    checks: z
      .object({
        factsSupported: z.boolean(),
        statusAndUrgencyPreserved: z.boolean(),
        agencyPerspectiveCorrect: z.boolean(),
        publicActionClear: z.boolean(),
        naturalPioVoice: z.boolean(),
        safeToPublish: z.boolean(),
      })
      .strict(),
    changesMade: z.array(z.string()),
    flags: z.array(z.string()),
    humanReviewReason: z.string(),
  })
  .strict()

const stringArray = { type: "array", items: { type: "string" } } as const

export const STAGE_1_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_stage_1_recommendations",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["recommendations", "runSummary"],
      properties: {
        recommendations: {
          type: "array",
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "status",
              "title",
              "communicationPillar",
              "priority",
              "category",
              "communicationGoal",
              "whyNow",
              "whyThisAgency",
              "whyThisCommunity",
              "residentValue",
              "relationshipValue",
              "agencyAngle",
              "recommendedAction",
              "recommendedPostTiming",
              "jurisdictionStatus",
              "issuingAuthority",
              "primarySourceName",
              "primarySourceUrl",
              "sourceClass",
              "supportingSources",
              "verifiedFacts",
              "doNotClaim",
              "graphicSignals",
              "sourceConfidence",
              "humanReviewReason",
            ],
            properties: {
              id: { type: "string" },
              status: {
                type: "string",
                enum: ["recommend_today", "schedule_this_week", "needs_human_review"],
              },
              title: { type: "string" },
              communicationPillar: { type: "string", enum: communicationPillars },
              priority: { type: "string", enum: ["critical", "high", "normal"] },
              category: { type: "string" },
              communicationGoal: { type: "string" },
              whyNow: { type: "string" },
              whyThisAgency: { type: "string" },
              whyThisCommunity: { type: "string" },
              residentValue: { type: "string" },
              relationshipValue: { type: "string" },
              agencyAngle: { type: "string" },
              recommendedAction: { type: "string" },
              recommendedPostTiming: { type: "string" },
              jurisdictionStatus: { type: "string", enum: jurisdictionStatuses },
              issuingAuthority: { type: "string" },
              primarySourceName: { type: "string" },
              primarySourceUrl: { type: "string" },
              sourceClass: { type: "string", enum: sourceClasses },
              supportingSources: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["sourceName", "sourceUrl", "sourceClass"],
                  properties: {
                    sourceName: { type: "string" },
                    sourceUrl: { type: "string" },
                    sourceClass: { type: "string", enum: sourceClasses },
                  },
                },
              },
              verifiedFacts: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "factId",
                    "claim",
                    "sourceName",
                    "sourceUrl",
                    "publishedAt",
                    "updatedAt",
                    "expiresAt",
                  ],
                  properties: {
                    factId: { type: "string" },
                    claim: { type: "string" },
                    sourceName: { type: "string" },
                    sourceUrl: { type: "string" },
                    publishedAt: { type: "string" },
                    updatedAt: { type: "string" },
                    expiresAt: { type: "string" },
                  },
                },
              },
              doNotClaim: stringArray,
              graphicSignals: stringArray,
              sourceConfidence: { type: "string", enum: ["high", "medium"] },
              humanReviewReason: { type: "string" },
            },
          },
        },
        runSummary: {
          type: "object",
          additionalProperties: false,
          required: [
            "urgentInformationFound",
            "proactiveOpportunityIncluded",
            "sourcesChecked",
            "sourceFamiliesWithNoResults",
            "notes",
          ],
          properties: {
            urgentInformationFound: { type: "boolean" },
            proactiveOpportunityIncluded: { type: "boolean" },
            sourcesChecked: stringArray,
            sourceFamiliesWithNoResults: stringArray,
            notes: { type: "string" },
          },
        },
      },
    },
  },
}

export const STAGE_2_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_stage_2_post",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "postText", "usedFactIds", "sourceAttribution", "humanReviewReason"],
      properties: {
        status: { type: "string", enum: ["ready", "needs_human_review"] },
        postText: { type: "string" },
        usedFactIds: stringArray,
        sourceAttribution: { type: "string" },
        humanReviewReason: { type: "string" },
      },
    },
  },
}

export const STAGE_3_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_stage_3_quality_gate",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "status",
        "finalPostText",
        "changed",
        "changeReasons",
        "checks",
        "changesMade",
        "flags",
        "humanReviewReason",
      ],
      properties: {
        status: {
          type: "string",
          enum: ["approved", "edited", "needs_human_review"],
        },
        finalPostText: { type: "string" },
        changed: { type: "boolean" },
        changeReasons: stringArray,
        checks: {
          type: "object",
          additionalProperties: false,
          required: [
            "factsSupported",
            "statusAndUrgencyPreserved",
            "agencyPerspectiveCorrect",
            "publicActionClear",
            "naturalPioVoice",
            "safeToPublish",
          ],
          properties: {
            factsSupported: { type: "boolean" },
            statusAndUrgencyPreserved: { type: "boolean" },
            agencyPerspectiveCorrect: { type: "boolean" },
            publicActionClear: { type: "boolean" },
            naturalPioVoice: { type: "boolean" },
            safeToPublish: { type: "boolean" },
          },
        },
        changesMade: stringArray,
        flags: stringArray,
        humanReviewReason: { type: "string" },
      },
    },
  },
}
