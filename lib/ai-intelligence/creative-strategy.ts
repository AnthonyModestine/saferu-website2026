/**
 * AI creative strategy types — produced by the research model as creative strategist.
 * Distinct from Phase 2 deterministic compileCreativeBriefFromInputs().
 */

import { z } from "zod"
import { formatConciseCreativeDirection } from "@/lib/ai-intelligence/conceptual-strategy-instructions"
import { validateCreativeStrategyForImage } from "@/lib/ai-intelligence/creative-strategy-guard"

export const conceptApproachSchema = z.object({
  name: z.string(),
  description: z.string(),
  whyItCouldWork: z.string(),
  risk: z.string(),
  /** Can the image model reliably execute this without safety-filter or accuracy failure? */
  executionFeasibility: z.enum(["high", "medium", "low"]).optional(),
  feasibilityNotes: z.string().optional(),
})

export const creativeStrategySchema = z.object({
  whatResidentsMustUnderstand: z.string(),
  whyItMatters: z.string(),
  visualChallenge: z.string(),
  scrollStopIdea: z.string(),
  emotionalResponse: z.string(),
  conceptOptions: z.array(conceptApproachSchema).min(2).max(4),
  selectedConceptName: z.string(),
  selectionRationale: z.string(),
  primaryVisualConcept: z.string(),
  dominantVisualElement: z.string(),
  foregroundVsBackground: z.string(),
  visualStorytellingTechnique: z.string(),
  artisticDirection: z.string(),
  compositionIntent: z.string(),
  typographyAsDesign: z.string(),
  genericApproachesToAvoid: z.array(z.string()).default([]),
  imageryThatCommunicatesWrongMessage: z.array(z.string()).default([]),
  factualVisualDetailsRequired: z.array(z.string()).default([]),
  textAndBrandIntegration: z.string(),
})

export type CreativeStrategy = z.infer<typeof creativeStrategySchema>
export type ConceptApproach = z.infer<typeof conceptApproachSchema>

export const CREATIVE_STRATEGY_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "whatResidentsMustUnderstand",
    "whyItMatters",
    "visualChallenge",
    "scrollStopIdea",
    "emotionalResponse",
    "conceptOptions",
    "selectedConceptName",
    "selectionRationale",
    "primaryVisualConcept",
    "dominantVisualElement",
    "foregroundVsBackground",
    "visualStorytellingTechnique",
    "artisticDirection",
    "compositionIntent",
    "typographyAsDesign",
    "genericApproachesToAvoid",
    "imageryThatCommunicatesWrongMessage",
    "factualVisualDetailsRequired",
    "textAndBrandIntegration",
  ],
  properties: {
    whatResidentsMustUnderstand: { type: "string" },
    whyItMatters: { type: "string" },
    visualChallenge: { type: "string" },
    scrollStopIdea: { type: "string" },
    emotionalResponse: { type: "string" },
    conceptOptions: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "description",
          "whyItCouldWork",
          "risk",
          "executionFeasibility",
          "feasibilityNotes",
        ],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          whyItCouldWork: { type: "string" },
          risk: { type: "string" },
          executionFeasibility: { type: "string", enum: ["high", "medium", "low"] },
          feasibilityNotes: { type: "string" },
        },
      },
    },
    selectedConceptName: { type: "string" },
    selectionRationale: { type: "string" },
    primaryVisualConcept: { type: "string" },
    dominantVisualElement: { type: "string" },
    foregroundVsBackground: { type: "string" },
    visualStorytellingTechnique: { type: "string" },
    artisticDirection: { type: "string" },
    compositionIntent: { type: "string" },
    typographyAsDesign: { type: "string" },
    genericApproachesToAvoid: { type: "array", items: { type: "string" } },
    imageryThatCommunicatesWrongMessage: { type: "array", items: { type: "string" } },
    factualVisualDetailsRequired: { type: "array", items: { type: "string" } },
    textAndBrandIntegration: { type: "string" },
  },
} as const

/**
 * Concise image-model block — selected concept + essential accuracy only.
 * Rejected concepts and long selection essays are never forwarded.
 * Returns empty string when strategy fails validation (caller should fall back to visual idea).
 */
export function creativeStrategyToImageBlock(strategy: CreativeStrategy): string {
  const validated = validateCreativeStrategyForImage(strategy)
  if (!validated.ok) return ""

  return formatConciseCreativeDirection({
    objective: strategy.whatResidentsMustUnderstand,
    selectedConceptName: strategy.selectedConceptName,
    primaryVisualConcept: validated.visualDirection,
    selectionRationale: strategy.selectionRationale,
    mustNotMislead: strategy.imageryThatCommunicatesWrongMessage,
    factualMusts: strategy.factualVisualDetailsRequired,
  })
}
