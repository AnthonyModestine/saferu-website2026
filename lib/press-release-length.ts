/**
 * Press release target length for crimes, fires, accidents, and other public-safety incidents.
 * Used in OpenAI prompts for Press Center generation.
 */

export const INCIDENT_MIN = 400
export const INCIDENT_MAX = 800

export const PRESS_RELEASE_LENGTH_RULES = `PRESS RELEASE LENGTH (body only — exclude dateline and media contact from word count)

Preferred range when sufficient facts are provided: 400–800 words for crime, fire, accident, and public-safety incident releases.

If facts are sparse, write a shorter release that covers only what is provided. Waive the minimum word count when facts are limited — factual sufficiency and plain language matter more than hitting a length target.

Never pad with invented detail to reach word count. Put the most important information first and remove unnecessary text.`

export function getPressReleaseLengthGuidance(min = 400, max = 800): string {
  return `Preferred length when enough facts are provided: ${min}–${max} words. If facts are sparse, write shorter and waive the minimum — do not invent detail to reach word count.`
}
