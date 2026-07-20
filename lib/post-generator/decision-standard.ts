/**
 * Core PIO decision standard and final editorial reject criteria.
 * Inject only into scoring/gate prompts — not every discovery call.
 */

export function decisionStandardBrief(): string {
  return `CORE DECISION STANDARD — approve only when EVERY answer is specific (not vague/generic/speculative/manufactured):
1. Why now?
2. Why this agency?
3. Why this community?
4. Why should residents care?
5. What can residents do, expect, avoid, verify, prepare for, or understand?
6. What verified source supports the recommendation?

A local news article alone is not enough. A public-safety topic alone is not enough for every agency.
Returning zero recommendations is valid. Never create weak filler to fill dashboard slots.`
}

export function finalEditorialRejectBrief(): string {
  return `FINAL PIO EDITORIAL GATE — reject:
- Weak local news, generic civic updates, town halls unrelated to the agency
- Events without verified agency participation
- Generic seasonal filler, vague holiday content, content with no specific date/trigger
- Information outside the agency's mission, stale/resolved information, duplicates
- Unsupported assumptions, advice with no local/timely reason, space-filling content
- Recommendations that merely restate an article or cannot explain why THIS agency should post`
}