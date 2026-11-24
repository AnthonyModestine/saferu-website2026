/**
 * Experimental concise image prompt compiler (Phase 6).
 * Opt-in via SAFERU_AI_PROMPT_MODE=concise — does NOT replace production prompts.
 *
 * Maximum creative freedom for artistic execution.
 * Strict control for copy, safety, branding, and readability.
 */

import type { CreativeStrategy } from "@/lib/ai-intelligence/creative-strategy"

export const CONCISE_PROMPT_VERSION = "concise-image-v1"

export type ConciseImagePromptInput = {
  communicationObjective?: string
  approvedHeadline: string
  approvedMessage: string
  style: string
  hasLogoReference: boolean
  visualConcept?: string
  essentialVisualDetails?: string[]
  visualNotes?: string
  creativeStrategy?: CreativeStrategy | null
  /** When true, ask for artwork only — text/logo composited separately (hybrid). */
  textFreeArtwork?: boolean
}

function logoLine(hasLogo: boolean): string {
  return hasLogo
    ? "Place the attached official agency logo bottom-right (~14–18% width). Do not redraw or invent a seal."
    : "Do not invent a department badge, seal, patch, or logo."
}

/**
 * Build a short prompt that keeps essentials and leaves artistic judgment to the model.
 */
export function compileConciseImagePrompt(input: ConciseImagePromptInput): string {
  const strategy = input.creativeStrategy
  const objective =
    input.communicationObjective ||
    strategy?.whatResidentsMustUnderstand ||
    "Help residents understand and act on the approved safety message."

  const concept = strategy
    ? `${strategy.selectedConceptName}: ${strategy.primaryVisualConcept}`
    : input.visualConcept || "A clear teaching visual for the safety message."

  const artHint = strategy
    ? [
        strategy.artisticDirection,
        strategy.compositionIntent,
        strategy.emotionalResponse,
      ]
        .filter(Boolean)
        .join(" ")
    : `Style: ${input.style}.`

  const details = (input.essentialVisualDetails || [])
    .slice(0, 5)
    .map((d) => `- ${d}`)
    .join("\n")

  if (input.textFreeArtwork) {
    return `Create a 2048×1152 (16:9) public-safety educational artwork — NO text, letters, numbers, logos, or watermarks in the image.

OBJECTIVE: ${objective}
CONCEPT: ${concept}
ART DIRECTION: ${artHint}
${input.visualNotes ? `NOTES: ${input.visualNotes}` : ""}
${details ? `ESSENTIAL DETAILS:\n${details}` : ""}

SAFETY: Never show unsafe behavior as recommended. Invisible hazards must stay invisible (no fake gas/smoke clouds for carbon monoxide). No gore or fearmongering. Educational “prohibited” marks (red X / no symbol) are allowed when teaching what not to do.

Leave clean negative space on one side for typography to be composited later. Exercise professional artistic judgment.`
  }

  return `Create a professional 2048×1152 (16:9) public-safety educational social graphic.

OBJECTIVE: ${objective}
CONCEPT: ${concept}

EXACT TEXT (render verbatim — do not rewrite, add tips, stats, slogans, hashtags, or URLs):
HEADLINE: ${input.approvedHeadline}
MESSAGE: ${input.approvedMessage}

ART DIRECTION: ${artHint}
Use professional artistic judgment for lighting, camera, hierarchy, and negative space. Do not invent a second concept.

SAFETY: Never show unsafe behavior as recommended. Invisible hazards stay invisible (no fake CO gas/smoke). No gore or fearmongering. Showing a prohibited action with a clear red X / “no” mark is correct education.

BRANDING: ${logoLine(input.hasLogoReference)}

READABILITY: Phone-first; strong contrast; headline larger than body; no clipped text; keep type off faces and busy detail.

${input.visualNotes ? `NOTES: ${input.visualNotes}\n` : ""}${details ? `ESSENTIAL DETAILS:\n${details}\n` : ""}One finished graphic.`
}

/** True when experimental concise mode is selected (never the production default). */
export function conciseImagePromptModeEnabled(): boolean {
  return process.env.SAFERU_AI_PROMPT_MODE?.trim().toLowerCase() === "concise"
}
