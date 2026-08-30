/** Standardize AI posting-time guidance into a consistent card format. */

export type PostingTimeDisplay = {
  /** e.g. "Post at 12:00 PM on Friday, July 24, 2026" */
  headline: string
  /** Why that timing works — without "Post at/around" boilerplate */
  rationale?: string
}

const DAY_NAMES =
  "monday|tuesday|wednesday|thursday|friday|saturday|sunday"
const MONTH_NAMES =
  "january|february|march|april|may|june|july|august|september|october|november|december"

const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i
const DATE_WITH_DAY_RE = new RegExp(
  `\\b(?:${DAY_NAMES})\\b,?\\s+(?:${MONTH_NAMES})\\s+\\d{1,2},?\\s+\\d{4}`,
  "i"
)
const DATE_RE = new RegExp(`\\b(?:${MONTH_NAMES})\\s+\\d{1,2},?\\s+\\d{4}`, "i")

function normalizeMeridiem(value: string): string {
  return value.replace(/\./g, "").trim().toUpperCase()
}

export function normalizeTimeToken(match: string): string {
  const parsed = match.match(TIME_RE)
  if (!parsed) return match.trim()

  const hour = Number(parsed[1])
  const minute = parsed[2] ? parsed[2].padStart(2, "0") : "00"
  const meridiem = normalizeMeridiem(parsed[3])
  return `${hour}:${minute} ${meridiem}`
}

function extractTime(text: string): string | undefined {
  const match = text.match(TIME_RE)
  return match ? normalizeTimeToken(match[0]) : undefined
}

function extractDate(text: string): string | undefined {
  const withDay = text.match(DATE_WITH_DAY_RE)
  if (withDay) return withDay[0].replace(/,\s*$/, "").trim()

  const plain = text.match(DATE_RE)
  if (plain) return plain[0].replace(/,\s*$/, "").trim()

  if (/\btomorrow\b/i.test(text)) return "Tomorrow"
  if (/\btoday\b/i.test(text)) return "Today"

  return undefined
}

function capitalizeSentence(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ""
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function stripBoilerplate(text: string, time?: string, date?: string): string {
  let rationale = text.trim()

  rationale = rationale
    .replace(/^post\s+(?:at|around)\s+/i, "")
    .replace(/^recommended\s+(?:posting\s+time|time)\s*:?\s*/i, "")
    .trim()

  if (time) {
    const timePattern = time.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    rationale = rationale.replace(new RegExp(timePattern, "i"), "").trim()
  }

  if (date) {
    const datePattern = date.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    rationale = rationale.replace(new RegExp(datePattern, "i"), "").trim()
  }

  rationale = rationale
    .replace(
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}(?:,?\s+at)?/gi,
      ""
    )
    .replace(
      /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}(?:,?\s+at)?/gi,
      ""
    )
    .replace(TIME_RE, "")
    .replace(/\b(?:at|on|by)\b/gi, " ")
    .replace(/\b(?:tomorrow|today|morning|afternoon|evening)\b/gi, " ")
    .replace(/^[,.:;—–-]+\s*/, "")
    .replace(/\s+/g, " ")
    .trim()

  rationale = rationale.replace(/^[—–-]\s*/, "").replace(/^[,.:;]+\s*/, "").trim()

  if (!rationale || rationale.length < 8) return ""
  return capitalizeSentence(rationale.replace(/[.!?]+$/, ""))
}

export function formatPostingTimeDisplay(raw: string): PostingTimeDisplay | null {
  const text = raw.trim()
  if (!text) return null

  const time = extractTime(text)
  const date = extractDate(text)
  const rationale = stripBoilerplate(text, time, date)

  if (!time && !date) {
    return { headline: capitalizeSentence(text.replace(/[.!?]+$/, "")) }
  }

  if (!time && date) {
    return {
      headline: `Post on ${date}`,
      rationale: rationale || undefined,
    }
  }

  const headline = date ? `Post at ${time} on ${date}` : `Post at ${time}`
  return {
    headline,
    rationale: rationale || undefined,
  }
}

/** Normalize briefing output before storing on the opportunity card. */
export function normalizePostingTimeGuidance(raw: string): string {
  const display = formatPostingTimeDisplay(raw)
  if (!display) return ""

  if (!display.rationale) return display.headline
  return `${display.headline}. ${display.rationale}.`
}
