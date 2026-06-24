/**
 * Merges base content library with CMS additions. Use these getters everywhere.
 */

import {
  contentLibrary,
  type Category,
  type Subcategory,
  type Article,
  type SocialPost,
} from "@/lib/data/content-library"

export { contentLibrary } from "@/lib/data/content-library"
import { getAdditions, type CmsAdditions } from "@/lib/cms-additions"
import {
  getSubcategoryOrder,
  getArticleOrder,
  getPostOrder,
  sortByOrder,
} from "@/lib/content-order"
import { isArticlePublished } from "@/lib/content-visibility"

function deepCloneCategory(cat: Category): Category {
  return JSON.parse(JSON.stringify(cat))
}

function isArticleDeleted(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  add: CmsAdditions
): boolean {
  return (add.deletedArticles ?? []).some(
    (d) =>
      d.categoryId === categoryId &&
      d.subcategoryId === subcategoryId &&
      d.articleId === articleId
  )
}

function applyDeletedArticles(categoryId: string, merged: Category, add: CmsAdditions): void {
  for (const sub of merged.subcategories) {
    sub.articles = sub.articles.filter(
      (art) => !isArticleDeleted(categoryId, sub.id, art.id, add)
    )
  }
}

function applyDeletedSubcategories(categoryId: string, merged: Category, add: CmsAdditions): void {
  const deleted = add.deletedSubcategories ?? []
  if (deleted.length === 0) return
  merged.subcategories = merged.subcategories.filter(
    (sub) =>
      !deleted.some((d) => d.categoryId === categoryId && d.subcategoryId === sub.id)
  )
}

function applySubcategoryOverrides(categoryId: string, merged: Category, add: CmsAdditions): void {
  const overrides = add.subcategoryOverrides ?? []
  if (overrides.length === 0) return
  for (const sub of merged.subcategories) {
    const patch = overrides.find(
      (o) => o.categoryId === categoryId && o.subcategoryId === sub.id
    )
    if (!patch) continue
    if (patch.title !== undefined) sub.title = patch.title
    if (patch.description !== undefined) sub.description = patch.description
    if (patch.icon !== undefined) sub.icon = patch.icon
  }
}

function applyDeletedPosts(categoryId: string, merged: Category, add: CmsAdditions): void {
  const deleted = add.deletedPosts ?? []
  if (deleted.length === 0) return
  for (const sub of merged.subcategories) {
    for (const art of sub.articles) {
      art.posts = art.posts.filter(
        (p) =>
          !deleted.some(
            (d) =>
              d.categoryId === categoryId &&
              d.subcategoryId === sub.id &&
              d.articleId === art.id &&
              d.postId === p.id
          )
      )
    }
  }
}

export type GetCategoryOptions = { includeUnpublished?: boolean }

export function getCategoryById(
  categoryId: string,
  options?: GetCategoryOptions
): Category | undefined {
  const base = contentLibrary.find((c) => c.id === categoryId)
  if (!base) return undefined
  const merged = deepCloneCategory(base)
  const add = getAdditions()

  // 1) For each existing subcategory, merge in added articles and added posts
  for (const sub of merged.subcategories) {
    // Add added posts to existing articles
    for (const art of sub.articles) {
      const addedPosts = add.posts.filter(
        (p) =>
          p.categoryId === categoryId &&
          p.subcategoryId === sub.id &&
          p.articleId === art.id
      )
      for (const p of addedPosts) {
        art.posts.push({
          id: p.id,
          title: p.title,
          image: p.image,
          message: p.message,
          captions: p.captions,
        })
      }
    }
    // Add new articles to this subcategory
    const addedArticles = add.articles.filter(
      (a) => a.categoryId === categoryId && a.subcategoryId === sub.id
    )
    for (const a of addedArticles) {
      if (sub.articles.some((art) => art.id === a.id)) continue
      const addedPosts = add.posts.filter(
        (p) =>
          p.categoryId === categoryId &&
          p.subcategoryId === sub.id &&
          p.articleId === a.id
      )
      sub.articles.push({
        id: a.id,
        title: a.title,
        description: a.description,
        posts: addedPosts.map((p) => ({
          id: p.id,
          title: p.title,
          image: p.image,
          message: p.message,
          captions: p.captions,
        })),
      })
    }
  }

  // 2) Add new subcategories (from additions)
  const addedSubs = add.subcategories.filter((s) => s.categoryId === categoryId)
  for (const s of addedSubs) {
    const addedArticles = add.articles.filter(
      (a) => a.categoryId === categoryId && a.subcategoryId === s.id
    )
    const articles: Article[] = addedArticles.map((a) => {
      const addedPosts = add.posts.filter(
        (p) =>
          p.categoryId === categoryId &&
          p.subcategoryId === s.id &&
          p.articleId === a.id
      )
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        posts: addedPosts.map((p) => ({
          id: p.id,
          title: p.title,
          image: p.image,
          message: p.message,
          captions: p.captions,
        })) as SocialPost[],
      }
    })
    merged.subcategories.push({
      id: s.id,
      title: s.title,
      description: s.description,
      icon: s.icon,
      articles,
    })
  }

  applyDeletedSubcategories(categoryId, merged, add)
  applyDeletedArticles(categoryId, merged, add)
  applyDeletedPosts(categoryId, merged, add)
  applySubcategoryOverrides(categoryId, merged, add)

  // Apply order overrides
  const subOrder = getSubcategoryOrder(categoryId)
  if (subOrder.length > 0) {
    merged.subcategories = sortByOrder(merged.subcategories, subOrder)
  }
  for (const sub of merged.subcategories) {
    const artOrder = getArticleOrder(categoryId, sub.id)
    if (artOrder.length > 0) {
      sub.articles = sortByOrder(sub.articles, artOrder)
    }
    for (const art of sub.articles) {
      const pOrder = getPostOrder(categoryId, sub.id, art.id)
      if (pOrder.length > 0) {
        art.posts = sortByOrder(art.posts, pOrder)
      }
    }
  }

  // Hide unpublished articles from public (admin passes includeUnpublished: true)
  if (!options?.includeUnpublished) {
    for (const sub of merged.subcategories) {
      sub.articles = sub.articles.filter((art) =>
        isArticlePublished(categoryId, sub.id, art.id)
      )
    }
  }

  for (const sub of merged.subcategories) {
    const seen = new Set<string>()
    sub.articles = sub.articles.filter((art) => {
      if (seen.has(art.id)) return false
      seen.add(art.id)
      return true
    })
  }

  return merged
}

export function baseArticleExists(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): boolean {
  const base = contentLibrary.find((c) => c.id === categoryId)
  const sub = base?.subcategories.find((s) => s.id === subcategoryId)
  return sub?.articles.some((a) => a.id === articleId) ?? false
}

export function getSubcategoryById(
  categoryId: string,
  subcategoryId: string,
  options?: GetCategoryOptions
): Subcategory | undefined {
  const category = getCategoryById(categoryId, options)
  return category?.subcategories.find((s) => s.id === subcategoryId)
}

export function getArticleById(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  options?: GetCategoryOptions
): Article | undefined {
  const subcategory = getSubcategoryById(categoryId, subcategoryId, options)
  return subcategory?.articles.find((a) => a.id === articleId)
}

export function getAllCategories(options?: GetCategoryOptions): Category[] {
  return contentLibrary.map((c) => getCategoryById(c.id, options)!)
}

export const getSubcategory = getSubcategoryById
export const getArticle = getArticleById
