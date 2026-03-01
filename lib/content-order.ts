/**
 * Order overrides for subcategories, articles, and posts.
 * Stored in-memory; in production persist to a database.
 */

/** categoryId -> ordered list of subcategory ids */
let subcategoryOrder: Record<string, string[]> = {}
/** categoryId -> subcategoryId -> ordered list of article ids */
let articleOrder: Record<string, Record<string, string[]>> = {}
/** categoryId -> subcategoryId -> articleId -> ordered list of post ids */
let postOrder: Record<string, Record<string, Record<string, string[]>>> = {}

export function getSubcategoryOrder(categoryId: string): string[] {
  return subcategoryOrder[categoryId] ?? []
}

export function setSubcategoryOrder(categoryId: string, orderedIds: string[]): void {
  subcategoryOrder[categoryId] = [...orderedIds]
}

export function getArticleOrder(categoryId: string, subcategoryId: string): string[] {
  return articleOrder[categoryId]?.[subcategoryId] ?? []
}

export function setArticleOrder(
  categoryId: string,
  subcategoryId: string,
  orderedIds: string[]
): void {
  if (!articleOrder[categoryId]) articleOrder[categoryId] = {}
  articleOrder[categoryId][subcategoryId] = [...orderedIds]
}

export function getPostOrder(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): string[] {
  return postOrder[categoryId]?.[subcategoryId]?.[articleId] ?? []
}

export function setPostOrder(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  orderedIds: string[]
): void {
  if (!postOrder[categoryId]) postOrder[categoryId] = {}
  if (!postOrder[categoryId][subcategoryId]) postOrder[categoryId][subcategoryId] = {}
  postOrder[categoryId][subcategoryId][articleId] = [...orderedIds]
}

/** Sort array by ordered list of ids; items not in list appear at end in original order */
export function sortByOrder<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  if (orderedIds.length === 0) return items
  const byId = new Map(items.map((i) => [i.id, i]))
  const result: T[] = []
  const seen = new Set<string>()
  for (const id of orderedIds) {
    const item = byId.get(id)
    if (item) {
      result.push(item)
      seen.add(id)
    }
  }
  for (const item of items) {
    if (!seen.has(item.id)) result.push(item)
  }
  return result
}
