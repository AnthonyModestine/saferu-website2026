/**
 * Preventative follow-up rules from agency-created SaferU content.
 * Agency content is a valid timely trigger without an external article.
 */

export const TREND_LANGUAGE_PATTERNS = [
  /\brecent incidents\b/i,
  /\ban increase\b/i,
  /\ba pattern\b/i,
  /\bmultiple reports\b/i,
  /\buptick\b/i,
  /\bwave of\b/i,
  /\brising (?:number|rate|trend)\b/i,
] as const

export const SAFE_SINGLE_INCIDENT_PHRASES = [
  "following a recent incident",
  "following a recent report",
  "recent department information provides an opportunity to remind residents",
  "we are sharing this reminder after a recent report",
  "this is a timely opportunity to review",
] as const

/** Incident / topic → suggested SaferU signal families. */
export const PREVENTION_SIGNAL_MAP: Array<{ match: RegExp; signals: string[] }> = [
  { match: /\b(vehicle break-?in|car (?:break|enter)|entered (?:a )?vehicle|auto burglar)/i, signals: ["vehicle_security", "9pm_routine", "vehicle_theft"] },
  { match: /\b(package theft|porch pirate|delivery theft)/i, signals: ["package_theft"] },
  { match: /\b(garage burglar|garage (?:door|entry))/i, signals: ["burglary", "garage_security"] },
  { match: /\b(residential burglar|home burglar|house burglar)/i, signals: ["burglary", "home_security"] },
  { match: /\b(house fire|residential fire|structure fire|cooking fire)/i, signals: ["smoke_alarm", "escape_plan", "cooking_safety", "fire_safety"] },
  { match: /\b(phone scam|impersonation scam|fraud)/i, signals: ["scams", "fraud"] },
  { match: /\b(identity theft)/i, signals: ["identity_theft", "scams"] },
  { match: /\b(catalytic.?converter)/i, signals: ["vehicle_security", "catalytic_converter"] },
  { match: /\b(pedestrian (?:crash|struck)|crosswalk)/i, signals: ["pedestrian_safety"] },
  { match: /\b(bicycle|bike) (?:crash|collision)/i, signals: ["bicycle_safety", "helmet_safety"] },
  { match: /\b(water rescue|drowning)/i, signals: ["water_safety"] },
  { match: /\b(heat.?related|heat (?:stroke|exhaustion|emergency))/i, signals: ["extreme_heat", "heat_illness"] },
  { match: /\b(cold exposure|hypothermia)/i, signals: ["cold_exposure", "winter_weather"] },
  { match: /\b(carbon monoxide|\bCO\b)/i, signals: ["carbon_monoxide"] },
  { match: /\b(missing (?:child|person|adult)|amber)/i, signals: ["missing_person"] },
  { match: /\b(impaired|drunk|distracted) driv/i, signals: ["impaired_driving", "distracted_driving", "seatbelts"] },
]

export function suggestsManufacturedTrend(text: string): boolean {
  return TREND_LANGUAGE_PATTERNS.some((re) => re.test(text))
}

export function sourceSupportsPluralTrend(sourceText: string): boolean {
  return /\b(increase|pattern|multiple|several|series of|ongoing issue|uptick|rise in)\b/i.test(
    sourceText
  )
}

export function suggestPreventionSignals(sourceText: string): string[] {
  for (const { match, signals } of PREVENTION_SIGNAL_MAP) {
    if (match.test(sourceText)) return signals
  }
  return []
}

export function preventativeFollowupBrief(): string {
  return `PREVENTATIVE FOLLOW-UP RULES:
- Agency-created SaferU content (press release, video request, incident message) is a valid timely trigger. Do not require an external article.
- Convert the incident into prevention/education — do not merely repeat the incident.
- At most one strongest preventative recommendation per source item.
- Do not expose private victim info, protected details, medical details, unnecessary addresses, or sensitive investigative facts.
- Do not manufacture a pattern. Use singular language ("following a recent report") unless the source explicitly supports plural/trend language ("increase", "pattern", "multiple reports").
- Match SaferU curated graphics by real signals when possible; never invent content IDs or image URLs.`
}