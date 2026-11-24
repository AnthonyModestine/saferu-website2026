/**
 * Professional PIO communication intelligence — planning + craft standards.
 * Combined into existing generation calls when flags are on (no extra agent required).
 */

import { WRITING_QUALITY_EXAMPLES } from "@/lib/ai-intelligence/art-direction-principles"

export const COMMUNICATION_INTENT_PLAN_INSTRUCTIONS = `
COMMUNICATION INTENT (decide before drafting — return as structured fields when the schema includes them, otherwise apply silently)

Determine:
1. Why the agency is communicating now
2. What the public needs to know first
3. What is confirmed vs unknown vs must be omitted
4. What public concerns may arise and which can be addressed with supplied facts only
5. Appropriate tone for this incident type and severity
6. What action (if any) the public should take
7. What wording could create an unintended interpretation
8. Channel fit (press vs Facebook vs X length/urgency)

Never invent facts to fill a plan. Sparse facts → shorter copy, not filler.
`

export const PROFESSIONAL_WRITING_STANDARDS = `
PROFESSIONAL PIO WRITING CRAFT

- Lead with the most important confirmed fact for residents — not process theater.
- Natural cadence: vary sentence length; prefer concrete verbs; avoid stacked clauses of equal weight.
- Directness: say what happened, where it matters, and what to do.
- Intelligent word choice: plain English over jargon; precise procedural status over drama.
- Context-specific openings: a road closure, arrest, missing person, and community event should not open the same way.
- Transitions that earn their place — cut empty bridges ("Additionally," "It is important to note").
- End when the public has what they need; do not pad conclusions.
- Match agency voice preferences when supplied — never override facts or policy.
- Sensitivity: incomplete or protected information requires restraint, not speculation.

Do not add artificial grammar errors. Do not optimize for AI detectors. Optimize for trust and clarity.

${WRITING_QUALITY_EXAMPLES}
`

export const PROFESSIONAL_EDITORIAL_REVIEW_ADDENDUM = `
PROFESSIONAL EDITORIAL REVIEW (beyond compliance)

Compliance can pass while writing remains mediocre. Also evaluate:
- Weak communication strategy (wrong lead, buried urgency)
- Generic language that could apply to any agency/topic
- Unnecessary content or repetition
- Unnatural sentence flow
- Inappropriate tone for severity
- Unclear or missing public instructions when action is required AND authorized by supplied facts
- Missed opportunities for clarity using only supplied facts
- Voice mismatch when agencyVoiceMemory is present

HARD GROUNDING RULES — never violate:
- Do NOT introduce new public instructions, requests for tips/assistance, factual claims, timelines, or agency commitments that are not authorized by the input facts.
- Do NOT expand "contact the tip line" into broader asks (e.g. "report suspicious activity") unless that ask is explicitly in the facts.
- Do NOT add emoji, hashtags, or promotional closers unless the agency voice memory or facts require them.
- Shorter is not automatically better — improve judgment, clarity, and natural writing; cut only empty filler.

Identify specific deficiencies. Rewrite only when meaningful improvement is possible without inventing facts.
If the draft is already strong and compliant, preserve it — do not rewrite for rewriting's sake.
After any rewrite, every factual claim must still map to publicationFacts / usedFactIds.
`

export type CommunicationIntentPlan = {
  whyCommunicating: string
  publicNeedsFirst: string
  confirmedFacts: string[]
  unknowns: string[]
  mustOmit: string[]
  tone: string
  publicAction: string
  unintendedInterpretationRisks: string[]
  channelNotes: string
}
