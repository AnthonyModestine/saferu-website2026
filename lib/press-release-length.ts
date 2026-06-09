/**
 * Press release target length by announcement category.
 * Used in OpenAI prompts for Press Center generation.
 */

export type PressReleaseLengthCategory = "routine" | "incident"

const ROUTINE_KEYWORDS = [
  "road closure",
  "community event",
  "safety campaign",
  "hiring announcement",
  "hiring",
  "grant award",
  "grant",
]

const ROUTINE_MIN = 250
const ROUTINE_MAX = 500
const INCIDENT_MIN = 400
const INCIDENT_MAX = 800

export const PRESS_RELEASE_LENGTH_RULES = `PRESS RELEASE LENGTH (pressRelease body only — exclude dateline and media contact from word count)

Routine announcements: 250–500 words
Examples: road closures, community events, safety campaigns, hiring announcements, grant awards

Incident-related releases: 400–800 words
Examples: structure fires, major crashes, arrests, missing persons, officer-involved incidents

Choose the category based on the incident type and facts provided. Crime, fire, crash, arrest, missing person, and officer-involved topics are incident-related. Road closures, events, campaigns, hiring, and grants are routine. When arrests are included in the facts, treat as incident-related. Aim for the middle of the range when enough facts are provided; use the lower end only when facts are limited. Never pad with invented detail to reach word count.`

function normalizeIncidentType(incidentType: string): string {
  return incidentType.trim().toLowerCase()
}

export function getPressReleaseLengthCategory(
  incidentType: string,
  hasArrests = false
): PressReleaseLengthCategory {
  if (hasArrests) return "incident"
  const key = normalizeIncidentType(incidentType)
  if (!key) return "incident"
  if (ROUTINE_KEYWORDS.some((phrase) => key === phrase || key.includes(phrase))) {
    return "routine"
  }
  return "incident"
}

export function getPressReleaseLengthGuidance(
  incidentType: string,
  hasArrests = false
): string {
  const category = getPressReleaseLengthCategory(incidentType, hasArrests)
  if (category === "routine") {
    return `Target length for pressRelease: ${ROUTINE_MIN}–${ROUTINE_MAX} words (routine announcement).`
  }
  return `Target length for pressRelease: ${INCIDENT_MIN}–${INCIDENT_MAX} words (incident-related release).`
}
