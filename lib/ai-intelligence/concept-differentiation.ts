/**
 * Detect whether two visual concepts are meaningfully different communication approaches
 * (not just reworded props / camera angles).
 */

export function conceptsMeaningfullyDiffer(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na === nb) return false

  const tokens = (s: string) => new Set(s.split(" ").filter((w) => w.length > 3))
  const ta = tokens(na)
  const tb = tokens(nb)
  let overlap = 0
  for (const t of ta) if (tb.has(t)) overlap++
  const union = new Set([...ta, ...tb]).size
  const jaccard = overlap / Math.max(1, union)

  // Shared motif check: phone+gift+red-x style holidays should not count as different.
  const motifs = ["phone", "gift", "card", "scam", "airbag", "seat", "detector"]
  const sharedMotifs = motifs.filter((m) => na.includes(m) && nb.includes(m))
  if (sharedMotifs.length >= 2 && jaccard >= 0.35) return false

  // Require low overlap to claim a meaningful creative difference.
  return jaccard < 0.4
}
