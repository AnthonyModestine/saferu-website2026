/**
 * Article visibility: published (live) vs unpublished (draft/off).
 * Unpublished articles are hidden from the public site but visible in admin.
 * Persistence is in lib/content-visibility-persist.ts (server-only); load there so this module stays client-safe.
 */

const SEP = "::"

function key(categoryId: string, subcategoryId: string, articleId: string): string {
  return `${categoryId}${SEP}${subcategoryId}${SEP}${articleId}`
}

/** Set of article keys that are unpublished (draft). All others are published. */
const unpublishedKeys = new Set<string>()

/** Used by content-visibility-persist to load state from file. Do not call from client code. */
export function setUnpublishedKeys(keys: string[]): void {
  unpublishedKeys.clear()
  keys.forEach((k) => unpublishedKeys.add(k))
}

export function isArticlePublished(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): boolean {
  return !unpublishedKeys.has(key(categoryId, subcategoryId, articleId))
}

export function setArticlePublished(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  published: boolean
): void {
  const k = key(categoryId, subcategoryId, articleId)
  if (published) {
    unpublishedKeys.delete(k)
  } else {
    unpublishedKeys.add(k)
  }
}

/** All unpublished article keys for admin "Unpublished" list */
export function getUnpublishedArticleKeys(): string[] {
  return Array.from(unpublishedKeys)
}

export function getUnpublishedArticleTriples(): {
  categoryId: string
  subcategoryId: string
  articleId: string
}[] {
  return getUnpublishedArticleKeys()
    .map((k) => {
      const first = k.indexOf(SEP)
      if (first === -1) return null
      const second = k.indexOf(SEP, first + SEP.length)
      if (second === -1) return null
      return {
        categoryId: k.slice(0, first),
        subcategoryId: k.slice(first + SEP.length, second),
        articleId: k.slice(second + SEP.length),
      }
    })
    .filter((t): t is { categoryId: string; subcategoryId: string; articleId: string } => t !== null)
}
