/**
 * Per-category layout: flat (articles directly on category page) or nested (subcategories).
 * Stored in content meta; configurable in admin.
 */

import { contentLibrary } from "@/lib/data/content-library"
import { getContentMeta } from "@/lib/content-meta-store"
import type { CategoryLayoutMode } from "@/lib/content-meta-store"

/** Categories that default to flat when no admin override is saved */
const DEFAULT_FLAT_CATEGORY_IDS = new Set(["whats-new", "weather-preparedness"])

/** What's New is always flat */
const LOCKED_FLAT_CATEGORY_IDS = new Set(["whats-new"])

export function canConfigureCategoryLayout(categoryId: string): boolean {
  return !LOCKED_FLAT_CATEGORY_IDS.has(categoryId)
}

export function getCategoryLayout(categoryId: string): CategoryLayoutMode {
  const stored = getContentMeta().categoryLayout[categoryId]
  if (stored) return stored
  if (DEFAULT_FLAT_CATEGORY_IDS.has(categoryId)) return "flat"
  return "nested"
}

export function isFlatCategory(categoryId: string): boolean {
  return getCategoryLayout(categoryId) === "flat"
}

export function setCategoryLayout(categoryId: string, layout: CategoryLayoutMode): void {
  if (LOCKED_FLAT_CATEGORY_IDS.has(categoryId)) return
  getContentMeta().categoryLayout[categoryId] = layout
}

/** Bucket subcategory id for new articles in flat categories */
export function getDefaultSubcategoryId(categoryId: string): string {
  if (categoryId === "whats-new") return "latest"

  const base = contentLibrary.find((c) => c.id === categoryId)
  if (base?.subcategories.some((s) => s.id === "articles")) return "articles"

  const first = base?.subcategories[0]?.id
  if (first) return first

  return "articles"
}

/** Public URL for a category landing page */
export function getCategoryPublicPath(categoryId: string): string {
  return categoryId === "whats-new" ? "/whats-new" : `/${categoryId}`
}

/** Public URL for an article */
export function getArticlePublicPath(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): string {
  if (categoryId === "whats-new") {
    return `/whats-new/${articleId}`
  }
  if (isFlatCategory(categoryId)) {
    return `/${categoryId}/${articleId}`
  }
  return `/${categoryId}/${subcategoryId}/${articleId}`
}
