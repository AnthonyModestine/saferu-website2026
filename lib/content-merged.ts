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
import { getAdditions } from "@/lib/cms-additions"
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

  return merged
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
