/**
 * Event participation / exclusion rules for Post Generator.
 * Community events require verified agency hosting or participation.
 */

export type EventCandidateLike = {
  title: string
  summary?: string
  whyItMatters?: string
  category?: string
  sourceLabel?: string
  sourceName?: string
  verifiedFacts?: string[]
  signals?: string[]
}

const EXCLUDED_EVENT_PATTERNS =
  /\b(town hall|council meeting|city council|ribbon.?cutting|concert|festival|fair|library program|recreation (?:event|program)|movie night|fun run|5k|parade|business (?:promo|promotion)|things to do|entertainment)\b/i

const AGENCY_PARTICIPATION_PATTERNS =
  /\b(hosting|hosts|hosted by|co-?host(?:ing|ed)?|participating|participation|officially participating|open house|coffee with a cop|national night out|recruit(?:ment|ing)|agency.?hosted|department.?hosted|our department|fire.?open.?house|police.?night|providing (?:a )?(?:public-?safety|security|ems|medical) service)\b/i

function blob(input: EventCandidateLike): string {
  return [
    input.title,
    input.summary,
    input.whyItMatters,
    input.category,
    input.sourceLabel,
    input.sourceName,
    ...(input.verifiedFacts || []),
    ...(input.signals || []),
  ]
    .filter(Boolean)
    .join(" ")
}

export function looksLikeCommunityEvent(input: EventCandidateLike): boolean {
  const text = blob(input)
  const category = (input.category || "").toLowerCase()
  return (
    input.sourceLabel === "Upcoming Event" ||
    category.includes("community_event") ||
    category.includes("local_event") ||
    category.includes("event_promotion") ||
    EXCLUDED_EVENT_PATTERNS.test(text) ||
    /\b(community night|open house|festival|fair|parade|ribbon.?cutting|fun run|concert|movie night|town hall)\b/i.test(
      text
    )
  )
}

export function hasVerifiedAgencyParticipation(input: EventCandidateLike): boolean {
  const text = blob(input)
  if (AGENCY_PARTICIPATION_PATTERNS.test(text)) return true
  // Source itself is the agency page naming an agency-run program.
  if (
    /\b(police|sheriff|fire|ems|emergency management)\b/i.test(input.sourceName || "") &&
    AGENCY_PARTICIPATION_PATTERNS.test(input.title + " " + (input.summary || ""))
  ) {
    return true
  }
  return false
}

/**
 * True when this looks like a community event the agency is NOT verified to host/participate in.
 * Such items must not be recommended.
 */
export function shouldExcludeUnverifiedEvent(input: EventCandidateLike): boolean {
  if (!looksLikeCommunityEvent(input)) return false
  return !hasVerifiedAgencyParticipation(input)
}

/** Compact rules for discovery / validation prompts. */
export function eventExclusionBrief(): string {
  return `EVENT RULES:
- Recommend community events ONLY when the source verifies the configured agency is hosting, co-hosting, officially participating, providing a public-safety service, or running an agency program/open house/recruitment/outreach.
- Reject town halls, council meetings, ribbon cuttings, concerts, festivals, fairs, library/recreation programs, business promotions, entertainment, and generic "things to do" unless the agency's participation is verified.
- Do not infer participation because an event mentions police, fire, EMS, safety, the city, or a government building.`
}