/**
 * Press release target length for crimes, fires, accidents, and other public-safety incidents.
 * Used in OpenAI prompts for Press Center generation.
 */

const INCIDENT_MIN = 400
const INCIDENT_MAX = 800

export const PRESS_RELEASE_LENGTH_RULES = `PRESS RELEASE LENGTH (pressRelease body only — exclude dateline and media contact from word count)

Crime, fire, accident, and public-safety incident releases: 400–800 words
Examples: burglaries, robberies, assaults, structure fires, vehicle fires, arson, major traffic crashes, hit-and-runs, arrests, missing persons, officer-involved incidents, and similar emergency incidents.

Aim for the middle of the range when enough facts are provided; use the lower end only when facts are limited. Never pad with invented detail to reach word count.`

export function getPressReleaseLengthGuidance(): string {
  return `Target length for pressRelease: ${INCIDENT_MIN}–${INCIDENT_MAX} words (crime, fire, accident, or public-safety incident release).`
}
