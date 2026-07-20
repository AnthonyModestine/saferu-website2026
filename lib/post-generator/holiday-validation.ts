/**
 * Named-holiday validation for Post Generator.
 * Vague holiday language is never enough to recommend a post.
 */

export type HolidayEntryLike = {
  id: string
  label: string
  month?: number
  day?: number
  signals?: string[]
  category?: string
}

export const VAGUE_HOLIDAY_PATTERNS = [
  /with the holidays coming up/i,
  /during this holiday season/i,
  /as we approach the holiday/i,
  /this time of year/i,
  /holiday season/i,
  /winter holidays(?!\s+(eve|day))/i,
  /the holidays are (coming|approaching)/i,
] as const

/** Major named holidays allowed for recommendations (not novelty/awareness days). */
export const NAMED_HOLIDAY_IDS = new Set([
  "new-years",
  "memorial-day",
  "july-fourth",
  "labor-day",
  "halloween",
  "thanksgiving",
  "christmas",
  "hanukkah",
  "kwanzaa",
  "easter",
])

export function containsVagueHolidayLanguage(text: string): boolean {
  return VAGUE_HOLIDAY_PATTERNS.some((re) => re.test(text))
}

export function holidayDateIso(
  entry: HolidayEntryLike,
  year: number
): string | null {
  if (!entry.month || !entry.day) return null
  return (
    year +
    "-" +
    String(entry.month).padStart(2, "0") +
    "-" +
    String(entry.day).padStart(2, "0")
  )
}

export function daysUntilHoliday(
  entry: HolidayEntryLike,
  todayIso: string
): number | null {
  const year = Number(todayIso.slice(0, 4))
  const iso = holidayDateIso(entry, year)
  if (!iso) return null
  const today = new Date(todayIso + "T12:00:00").getTime()
  const target = new Date(iso + "T12:00:00").getTime()
  if (Number.isNaN(today) || Number.isNaN(target)) return null
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

/**
 * A holiday may be recommended only when it is a named holiday with a specific
 * date inside the posting window (default: day-of through 7 days ahead).
 */
export function isValidHolidayRecommendation(
  entry: HolidayEntryLike,
  todayIso: string,
  windowDays = 7
): { ok: true; eventDate: string; daysUntil: number } | { ok: false; reason: string } {
  if (entry.category && entry.category !== "holiday_safety") {
    return { ok: false, reason: "not_holiday_category" }
  }
  if (!NAMED_HOLIDAY_IDS.has(entry.id) && !/^(independence|memorial|labor|halloween|thanksgiving|christmas|new.?year|hanukkah|kwanzaa|easter)/i.test(entry.id + " " + entry.label)) {
    return { ok: false, reason: "not_named_major_holiday" }
  }
  if (containsVagueHolidayLanguage(entry.label)) {
    return { ok: false, reason: "vague_holiday_label" }
  }
  const days = daysUntilHoliday(entry, todayIso)
  if (days == null) return { ok: false, reason: "missing_date" }
  if (days < -1 || days > windowDays) {
    return { ok: false, reason: "outside_window" }
  }
  const year = Number(todayIso.slice(0, 4))
  const eventDate = holidayDateIso(entry, year)!
  return { ok: true, eventDate, daysUntil: days }
}

export function holidayValidationBrief(): string {
  return `HOLIDAY RULES:
- Only recommend a real, named holiday with a specific date inside the posting window.
- Never use vague language like "with the holidays coming up", "during this holiday season", "as we approach the holiday", or "this time of year".
- Connect safety guidance specifically to that named holiday.
- Do not recommend obscure observances, novelty days, or unrelated awareness days to fill the dashboard.`
}