/**
 * Creative strategist brief — campaign thinking, not layout variation.
 * Keep short: strategist decides the communication approach;
 * the image model receives a concise direction and artistic freedom.
 */

export const CONCEPTUAL_STRATEGY_INSTRUCTIONS = `
Think like an experienced creative director developing a public awareness campaign.

Develop two or three fundamentally different creative approaches to communicating this public safety message. Consider what will capture attention, create immediate understanding, and make the message memorable.

Explore different ways of communicating the idea — not merely different layouts, colors, camera angles, or arrangements of the same objects. Same props with a different crop is not a different approach.

When useful, draw from different communication strategies (do not force every type every time):
conceptual advertising · editorial photography · educational illustration · visual comparison · minimalist communication · information design · human-centered storytelling.

Select the approach that best balances:
communication effectiveness · originality · audience appropriateness · factual accuracy · execution feasibility.

A simple, direct concept is preferable to a clever concept that makes the safety message harder to understand.

Preserve the approved safety information. Never introduce unsupported facts or misleading visual representations (including inventing a visible form for an invisible hazard).

Do not attempt to circumvent provider safety restrictions. Prefer concepts the image model can reliably execute.

Return a concise creative direction: a compelling objective for the image model, with room for professional artistic judgment — not a long checklist of micromanaged requirements.
`

/**
 * Compact direction for the image model after strategist selection.
 * Forwards the selected concept only — not rejected options or long rationale essays.
 * Fold a short execution cue from rationale when it contains a visual instruction.
 */
export function formatConciseCreativeDirection(opts: {
  objective: string
  selectedConceptName: string
  primaryVisualConcept: string
  selectionRationale: string
  emotionalResponse?: string
  mustNotMislead?: string[]
  factualMusts?: string[]
}): string {
  const cue = foldExecutionCue(opts.selectionRationale)
  const conceptLine = cue
    ? `CONCEPT (${opts.selectedConceptName}): ${opts.primaryVisualConcept} — ${cue}`
    : `CONCEPT (${opts.selectedConceptName}): ${opts.primaryVisualConcept}`

  const mustNot = (opts.mustNotMislead || []).slice(0, 2).map((x) => `- ${x}`).join("\n")
  const factual = (opts.factualMusts || []).slice(0, 3).map((x) => `- ${x}`).join("\n")

  return [
    opts.objective ? `OBJECTIVE: ${opts.objective}` : "",
    conceptLine,
    factual ? `FACTUAL MUSTS:\n${factual}` : "",
    mustNot ? `DO NOT MISLEAD:\n${mustNot}` : "",
    "Exercise professional artistic judgment. Do not invent a second concept or rewrite approved text.",
  ]
    .filter(Boolean)
    .join("\n")
}

function foldExecutionCue(rationale: string | undefined): string {
  if (!rationale?.trim()) return ""
  const first = rationale.trim().split(/(?<=[.!?])\s+/)[0] || ""
  // Soft selection praise ("most direct…") is not an execution instruction.
  if (
    !/\b(avoid showing|avoid depicting|do not show|don't show|never show|must not show|must show|without (?:showing|depicting|inventing|visible)|keep text|accurately depict|correctly (?:show|depict|place))\b/i.test(
      first
    )
  ) {
    return ""
  }
  return first.length > 120 ? first.slice(0, 117) + "…" : first
}
