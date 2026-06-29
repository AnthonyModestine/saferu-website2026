/**
 * Order overrides for subcategories, articles, and posts.
 * Backed by content-meta-persist (Postgres in production).
 */

import { getContentMeta } from "@/lib/content-meta-store"

export function getSubcategoryOrder(categoryId: string): string[] {
  return getContentMeta().subcategoryOrder[categoryId] ?? []
}

export function setSubcategoryOrder(categoryId: string, orderedIds: string[]): void {
  getContentMeta().subcategoryOrder[categoryId] = [...orderedIds]
}

export function getArticleOrder(categoryId: string, subcategoryId: string): string[] {
  return getContentMeta().articleOrder[categoryId]?.[subcategoryId] ?? []
}

export function setArticleOrder(
  categoryId: string,
  subcategoryId: string,
  orderedIds: string[]
): void {
  const meta = getContentMeta()
  if (!meta.articleOrder[categoryId]) meta.articleOrder[categoryId] = {}
  meta.articleOrder[categoryId][subcategoryId] = [...orderedIds]
}

export function getPostOrder(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): string[] {
  return getContentMeta().postOrder[categoryId]?.[subcategoryId]?.[articleId] ?? []
}

export function setPostOrder(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  orderedIds: string[]
): void {
  const meta = getContentMeta()
  if (!meta.postOrder[categoryId]) meta.postOrder[categoryId] = {}
  if (!meta.postOrder[categoryId][subcategoryId]) meta.postOrder[categoryId][subcategoryId] = {}
  meta.postOrder[categoryId][subcategoryId][articleId] = [...orderedIds]
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
