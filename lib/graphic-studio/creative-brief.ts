/**
 * Structured creative brief for Graphic Studio.
 *
 * Phase 2 compileCreativeBriefFromInputs() is primarily DETERMINISTIC template assembly.
 * Phase 3 prefers AI creative_strategy from the research model (genuine concept selection).
 */

import { styleGuidanceFor, topicCreativeHints } from "@/lib/graphic-studio/style-guidance"
import { safetyDepictionPromptLines } from "@/lib/graphic-studio/safety-depiction"
import { creativeDirectionEnabled, styleGuidanceEnabled } from "@/lib/ai-config/phase2"
import type { CreativeStrategy } from "@/lib/ai-intelligence/creative-strategy"

export type CreativeBrief = {
  communicationObjective: string
  audience: string
  coreSafetyMessage: string
  intendedPublicAction: string
  emotionalTone: string
  primaryVisualConcept: string
  visualMetaphor?: string
  artisticDirection: string
  layoutArchetype: string
  composition: string
  focalPoint: string
  subjectPlacement: string
  colorDirection: string
  lightingDirection: string
  typographyDirection: string
  negativeSpace: string
  textPlacement: string
  brandPlacement: string
  safetyDepictionRequirements: string[]
  mustNotAppear: string[]
  platformNotes: string
}

export function compileCreativeBriefFromInputs(opts: {
  topic?: string
  audience?: string
  style: string
  approvedHeadline: string
  approvedMessage: string
  visualConcept: string
  importantVisualDetails?: string[]
  visualNotes?: string
}): CreativeBrief {
  const styleGuide = styleGuidanceEnabled() ? styleGuidanceFor(opts.style) : ""
  const topicHints = topicCreativeHints(opts.topic || opts.approvedHeadline, opts.style)
  const details = opts.importantVisualDetails || []
  const depiction = safetyDepictionPromptLines(opts.topic || opts.approvedHeadline)

  return {
    communicationObjective: `Teach residents: ${opts.approvedHeadline}`,
    audience: opts.audience || "General Community",
    coreSafetyMessage: opts.approvedMessage,
    intendedPublicAction: "Follow the specific safe action stated in the approved message.",
    emotionalTone:
      /urgent|warning|severe|danger/i.test(opts.approvedHeadline + opts.approvedMessage)
        ? "Serious, calm, urgent clarity — no fearmongering"
        : "Credible, clear, approachable official tone",
    primaryVisualConcept: opts.visualConcept,
    artisticDirection: [styleGuide, topicHints, opts.visualNotes || ""].filter(Boolean).join(" "),
    layoutArchetype:
      opts.style === "Clean Infographic"
        ? "Informational zones with strong hierarchy"
        : opts.style === "Bold Public Safety"
          ? "High-contrast informational poster"
          : "Intentional editorial layout — vary from centered stock templates when stronger",
    composition: "Phone-first 16:9; clear hierarchy; continuous scene (no empty logo boxes)",
    focalPoint: "The teaching visual that makes the hazard or safe action obvious at a glance",
    subjectPlacement: "Keep essential subjects clear of text and bottom-right brand zone",
    colorDirection: "Restrained public-sector palette with strong text contrast",
    lightingDirection:
      opts.style === "Realistic"
        ? "Natural documentary light"
        : opts.style === "Serious / Urgent"
          ? "Controlled contrast; avoid glossy HDR"
          : "Support mood without artificial glow spam",
    typographyDirection:
      "Clean professional type; headline clearly larger than body; no novelty/handwritten fonts",
    negativeSpace: "Protect readable margins; do not crowd edges",
    textPlacement: "Headline and message in intentional hierarchy; avoid busy faces/details",
    brandPlacement: "Agency logo bottom-right when provided; never invent a badge",
    safetyDepictionRequirements: [
      "Visual must support the approved guidance",
      "Never depict unsafe behavior as recommended",
      ...details.slice(0, 6),
      ...depiction.slice(0, 8),
    ],
    mustNotAppear: [
      "Gore or graphic injury",
      "Fearmongering / clickbait drama",
      "Fake department badge/seal",
      "Extra tips, stats, slogans, hashtags, or URLs not in approved text",
      "Generic unrelated emergency-vehicle filler unless it teaches the lesson",
    ],
    platformNotes: "2048×1152 social graphic; mobile readability is mandatory",
  }
}

/** Convert AI research creative_strategy into the brief shape used by prompt builders. */
export function briefFromAiCreativeStrategy(
  strategy: CreativeStrategy,
  opts: { audience?: string; approvedMessage: string }
): CreativeBrief {
  return {
    communicationObjective: strategy.whatResidentsMustUnderstand,
    audience: opts.audience || "General Community",
    coreSafetyMessage: opts.approvedMessage,
    intendedPublicAction: strategy.whyItMatters,
    emotionalTone: strategy.emotionalResponse,
    primaryVisualConcept: strategy.primaryVisualConcept,
    visualMetaphor: strategy.visualStorytellingTechnique,
    artisticDirection: strategy.artisticDirection,
    layoutArchetype: strategy.selectedConceptName,
    composition: strategy.compositionIntent,
    focalPoint: strategy.dominantVisualElement,
    subjectPlacement: strategy.foregroundVsBackground,
    colorDirection: "Support the selected concept; prioritize contrast for mobile readability",
    lightingDirection: "Support mood without artificial glow spam unless the concept requires it",
    typographyDirection: strategy.typographyAsDesign,
    negativeSpace: "Protect readable margins; do not crowd edges",
    textPlacement: strategy.textAndBrandIntegration,
    brandPlacement: "Agency logo bottom-right when provided; never invent a badge",
    safetyDepictionRequirements: strategy.factualVisualDetailsRequired,
    mustNotAppear: [
      ...strategy.imageryThatCommunicatesWrongMessage,
      ...strategy.genericApproachesToAvoid,
      "Gore or graphic injury",
      "Fake department badge/seal",
    ],
    platformNotes: "2048×1152 social graphic; mobile readability is mandatory",
  }
}

export function resolveCreativeBrief(opts: {
  topic?: string
  audience?: string
  style: string
  approvedHeadline: string
  approvedMessage: string
  visualConcept: string
  importantVisualDetails?: string[]
  visualNotes?: string
  aiStrategy?: CreativeStrategy | null
}): CreativeBrief {
  if (opts.aiStrategy) {
    return briefFromAiCreativeStrategy(opts.aiStrategy, {
      audience: opts.audience,
      approvedMessage: opts.approvedMessage,
    })
  }
  return compileCreativeBriefFromInputs(opts)
}

export function creativeBriefToPromptBlock(brief: CreativeBrief): string {
  if (!creativeDirectionEnabled() && !styleGuidanceEnabled()) return ""

  const lines = [
    "CREATIVE BRIEF (follow priority: accuracy > exact approved text > branding > requested style > design execution > flair)",
    `Objective: ${brief.communicationObjective}`,
    `Audience: ${brief.audience}`,
    `Tone: ${brief.emotionalTone}`,
    `Visual concept: ${brief.primaryVisualConcept}`,
    `Artistic direction: ${brief.artisticDirection}`,
    `Layout archetype: ${brief.layoutArchetype}`,
    `Composition: ${brief.composition}`,
    `Focal point: ${brief.focalPoint}`,
    `Color/lighting: ${brief.colorDirection}; ${brief.lightingDirection}`,
    `Typography: ${brief.typographyDirection}`,
    `Text placement: ${brief.textPlacement}`,
    `Brand placement: ${brief.brandPlacement}`,
    `Negative space: ${brief.negativeSpace}`,
    `Platform: ${brief.platformNotes}`,
    "Safety depiction requirements:",
    ...brief.safetyDepictionRequirements.map((s) => `- ${s}`),
    "Must not appear:",
    ...brief.mustNotAppear.map((s) => `- ${s}`),
    "Make deliberate creative choices. Do not fill the canvas with generic template decoration.",
    "Avoid repetitive AI design defaults (identical centered layouts, excessive glow, unnecessary gradients, oversaturated stock looks) unless they serve this brief.",
  ]
  return lines.join("\n")
}

export function shouldAttachCreativeBrief(): boolean {
  return creativeDirectionEnabled() || styleGuidanceEnabled()
}

/** Phase 2 deterministic compiler vs Phase 3 AI strategist — for docs/tests. */
export function isDeterministicCreativeBrief(brief: CreativeBrief): boolean {
  return (
    brief.composition === "Phone-first 16:9; clear hierarchy; continuous scene (no empty logo boxes)" &&
    brief.platformNotes === "2048×1152 social graphic; mobile readability is mandatory"
  )
}
