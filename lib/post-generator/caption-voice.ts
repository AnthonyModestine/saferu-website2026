/**
 * Shared Facebook caption voice rules for specialized model calls.
 * Keep this focused — do not paste the full product prompt into every call.
 */

export const CAPTION_BANNED_PHRASES = [
  "please be advised",
  "we are writing to inform you",
  "as a reminder",
  "stay safe out there",
  "with the holidays coming up",
  "this time of year",
  "in today's fast-paced world",
] as const

/** Compact caption rules for writer / final-gate prompts. */
export function captionVoiceBrief(agency: string, place: string): string {
  const banned = CAPTION_BANNED_PHRASES.map((p) => '"' + p + '"').join(", ")
  return (
    "CAPTION VOICE — publish as " +
    agency +
    " to residents in " +
    place +
    ":\n" +
    "- Lead with the most important verified fact or local reason.\n" +
    "- Attribute alerts/official info to the issuing authority. If another authority issued it, credit them and have the agency relay it.\n" +
    "- Explain why THIS agency is sharing it and what residents should know, expect, avoid, verify, or do.\n" +
    "- Calm, credible, human, professional. Short paragraphs for mobile (usually 2-3).\n" +
    "- One clear call to action. Do not turn every post into a tip list.\n" +
    "- Use only verified facts. Zero or one emoji. No hashtag stuffing.\n" +
    "- Never claim " +
    agency +
    " owns another authority's project, crews, investigation, alert, or event.\n" +
    "- Avoid: " +
    banned +
    ", clickbait, slang, generic PSA/corporate filler, unsupported reassurance.\n" +
    "- For agency-content follow-ups: do not restate the full incident; move quickly into prevention, education, or reassurance."
  )
}

export function containsBannedCaptionLanguage(text: string): boolean {
  const lower = text.toLowerCase()
  return CAPTION_BANNED_PHRASES.some((phrase) => lower.includes(phrase))
}