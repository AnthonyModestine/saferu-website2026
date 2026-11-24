/**
 * Keep only constraints that matter for safety accuracy or were customer-requested.
 * Decorative layout hints and extra on-image text instructions are excluded.
 */

const EXTRA_GENERATED_TEXT_RE =
  /\b(speech bubble|phone screen|screen (?:text|message|alert)|displayed text|'scam' alert|"scam" alert|scam alert displayed|urgent request for payment)\b/i

const DECORATIVE_ONLY_RE =
  /\b(friendly[, ]*family|family-oriented style|modern style|clean style|hand holding gift cards|holding gift cards|colorful)\b/i

const ESSENTIAL_SAFETY_RE =
  /\b(airbag|rear-facing|harness|car seat|detector|never|do not|don't|incorrect|unsafe|mislead|odorless|invisible|back seat|front seat|gift card.*(?:never|not)|official payment|accuracy|accurately)\b/i

/**
 * Filter research/frozen visual details down to essential safety accuracy items.
 * Customer visual notes are always retained when provided.
 */
export function filterEssentialSafetyConstraints(
  details: string[] | undefined,
  opts?: { customerVisualNotes?: string; max?: number }
): string[] {
  const max = opts?.max ?? 3
  const notes = (opts?.customerVisualNotes || "").trim()
  const out: string[] = []

  if (notes) out.push(notes)

  for (const raw of details || []) {
    const d = raw.trim()
    if (!d) continue
    if (EXTRA_GENERATED_TEXT_RE.test(d)) continue
    if (DECORATIVE_ONLY_RE.test(d) && !ESSENTIAL_SAFETY_RE.test(d)) continue
    if (!ESSENTIAL_SAFETY_RE.test(d)) continue
    if (out.some((x) => x.toLowerCase() === d.toLowerCase())) continue
    out.push(d)
    if (out.length >= max) break
  }

  return out
}
