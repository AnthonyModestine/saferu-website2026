/**
 * CMS additions: subcategories, articles, and posts added via admin.
 * Merged with base content-library at runtime.
 * Persistence is in lib/cms-additions-persist.ts (server-only); load there so this module stays client-safe.
 */

import type { Subcategory, Article, SocialPost } from "@/lib/data/content-library"
import { contentLibrary } from "@/lib/data/content-library"

export interface CmsSubcategory {
  categoryId: string
  id: string
  title: string
  description: string
  icon: string
}

export interface CmsArticle {
  categoryId: string
  subcategoryId: string
  id: string
  title: string
  description: string
}

export interface CmsPost {
  categoryId: string
  subcategoryId: string
  articleId: string
  id: string
  title: string
  image?: string
  message?: string
  captions: { facebook: string; instagram: string; twitter: string }
}

export interface CmsDeletedPost {
  categoryId: string
  subcategoryId: string
  articleId: string
  postId: string
}

export interface CmsDeletedArticle {
  categoryId: string
  subcategoryId: string
  articleId: string
}

export interface CmsSubcategoryOverride {
  categoryId: string
  subcategoryId: string
  title?: string
  description?: string
  icon?: string
}

export interface CmsDeletedSubcategory {
  categoryId: string
  subcategoryId: string
}

export interface CmsAdditions {
  subcategories: CmsSubcategory[]
  articles: CmsArticle[]
  posts: CmsPost[]
  deletedPosts?: CmsDeletedPost[]
  deletedArticles?: CmsDeletedArticle[]
  subcategoryOverrides?: CmsSubcategoryOverride[]
  deletedSubcategories?: CmsDeletedSubcategory[]
}

let additions: CmsAdditions = {
  subcategories: [],
  articles: [],
  posts: [],
  deletedPosts: [],
  deletedArticles: [],
  subcategoryOverrides: [],
  deletedSubcategories: [],
}

export function getAdditions(): CmsAdditions {
  return {
    subcategories: [...additions.subcategories],
    articles: [...additions.articles],
    posts: [...additions.posts],
    deletedPosts: [...(additions.deletedPosts || [])],
    deletedArticles: [...(additions.deletedArticles || [])],
    subcategoryOverrides: [...(additions.subcategoryOverrides || [])],
    deletedSubcategories: [...(additions.deletedSubcategories || [])],
  }
}

function articleKey(categoryId: string, subcategoryId: string, id: string): string {
  return `${categoryId}::${subcategoryId}::${id}`
}

function dedupeArticles(articles: CmsArticle[]): CmsArticle[] {
  const byKey = new Map<string, CmsArticle>()
  for (const art of articles) {
    byKey.set(articleKey(art.categoryId, art.subcategoryId, art.id), art)
  }
  return Array.from(byKey.values())
}

export function setAdditions(data: CmsAdditions): void {
  additions = {
    subcategories: data.subcategories || [],
    articles: dedupeArticles(data.articles || []),
    posts: data.posts || [],
    deletedPosts: data.deletedPosts || [],
    deletedArticles: data.deletedArticles || [],
    subcategoryOverrides: data.subcategoryOverrides || [],
    deletedSubcategories: data.deletedSubcategories || [],
  }
}

export function addSubcategory(sub: CmsSubcategory): void {
  additions.subcategories.push(sub)
}

export function isCmsSubcategory(categoryId: string, subcategoryId: string): boolean {
  return additions.subcategories.some(
    (s) => s.categoryId === categoryId && s.id === subcategoryId
  )
}

export function updateSubcategory(
  categoryId: string,
  subcategoryId: string,
  patch: { title?: string; description?: string; icon?: string }
): boolean {
  const cms = additions.subcategories.find(
    (s) => s.categoryId === categoryId && s.id === subcategoryId
  )
  if (cms) {
    if (patch.title !== undefined) cms.title = patch.title.trim()
    if (patch.description !== undefined) cms.description = patch.description.trim()
    if (patch.icon !== undefined) cms.icon = patch.icon.trim()
    return true
  }

  const baseExists = contentLibrary
    .find((c) => c.id === categoryId)
    ?.subcategories.some((s) => s.id === subcategoryId)
  if (!baseExists) return false

  if (!additions.subcategoryOverrides) additions.subcategoryOverrides = []
  let override = additions.subcategoryOverrides.find(
    (o) => o.categoryId === categoryId && o.subcategoryId === subcategoryId
  )
  if (!override) {
    override = { categoryId, subcategoryId }
    additions.subcategoryOverrides.push(override)
  }
  if (patch.title !== undefined) override.title = patch.title.trim()
  if (patch.description !== undefined) override.description = patch.description.trim()
  if (patch.icon !== undefined) override.icon = patch.icon.trim()
  return true
}

export function removeSubcategory(categoryId: string, subcategoryId: string): void {
  const cmsIndex = additions.subcategories.findIndex(
    (s) => s.categoryId === categoryId && s.id === subcategoryId
  )
  if (cmsIndex >= 0) {
    additions.subcategories.splice(cmsIndex, 1)
    additions.articles = additions.articles.filter(
      (a) => !(a.categoryId === categoryId && a.subcategoryId === subcategoryId)
    )
    additions.posts = additions.posts.filter(
      (p) => !(p.categoryId === categoryId && p.subcategoryId === subcategoryId)
    )
    return
  }

  const baseSub = contentLibrary
    .find((c) => c.id === categoryId)
    ?.subcategories.find((s) => s.id === subcategoryId)

  if (!baseSub) return

  if (!additions.deletedSubcategories) additions.deletedSubcategories = []
  const already = additions.deletedSubcategories.some(
    (d) => d.categoryId === categoryId && d.subcategoryId === subcategoryId
  )
  if (!already) {
    additions.deletedSubcategories.push({ categoryId, subcategoryId })
  }

  for (const art of baseSub.articles) {
    removeArticle(categoryId, subcategoryId, art.id)
  }

  const cmsArticles = additions.articles.filter(
    (a) => a.categoryId === categoryId && a.subcategoryId === subcategoryId
  )
  for (const art of cmsArticles) {
    removeArticle(categoryId, subcategoryId, art.id)
  }
}

/** Returns false if an article with this id already exists (no duplicate created). */
export function addArticle(art: CmsArticle): boolean {
  const key = articleKey(art.categoryId, art.subcategoryId, art.id)
  const exists = additions.articles.some(
    (a) => articleKey(a.categoryId, a.subcategoryId, a.id) === key
  )
  if (exists) return false
  additions.articles.push(art)
  return true
}

export function isCmsArticle(categoryId: string, subcategoryId: string, articleId: string): boolean {
  return additions.articles.some(
    (a) => a.categoryId === categoryId && a.subcategoryId === subcategoryId && a.id === articleId
  )
}

export function removeArticle(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): void {
  const cmsIndex = additions.articles.findIndex(
    (a) =>
      a.categoryId === categoryId && a.subcategoryId === subcategoryId && a.id === articleId
  )
  if (cmsIndex >= 0) {
    additions.articles.splice(cmsIndex, 1)
    additions.posts = additions.posts.filter(
      (p) =>
        !(
          p.categoryId === categoryId &&
          p.subcategoryId === subcategoryId &&
          p.articleId === articleId
        )
    )
    return
  }

  if (!additions.deletedArticles) additions.deletedArticles = []
  const already = additions.deletedArticles.some(
    (d) =>
      d.categoryId === categoryId &&
      d.subcategoryId === subcategoryId &&
      d.articleId === articleId
  )
  if (!already) {
    additions.deletedArticles.push({ categoryId, subcategoryId, articleId })
  }
  additions.posts = additions.posts.filter(
    (p) =>
      !(
        p.categoryId === categoryId &&
        p.subcategoryId === subcategoryId &&
        p.articleId === articleId
      )
  )
}

export function addPost(post: CmsPost): void {
  additions.posts.push(post)
}

export function removePost(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): void {
  const cmsIndex = additions.posts.findIndex(
    (p) =>
      p.categoryId === categoryId &&
      p.subcategoryId === subcategoryId &&
      p.articleId === articleId &&
      p.id === postId
  )
  if (cmsIndex >= 0) {
    additions.posts.splice(cmsIndex, 1)
    return
  }

  if (!additions.deletedPosts) additions.deletedPosts = []
  const already = additions.deletedPosts.some(
    (d) =>
      d.categoryId === categoryId &&
      d.subcategoryId === subcategoryId &&
      d.articleId === articleId &&
      d.postId === postId
  )
  if (!already) {
    additions.deletedPosts.push({ categoryId, subcategoryId, articleId, postId })
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

export function generateId(prefix: string, title: string): string {
  const slug = slugify(title).slice(0, 30)
  return `${prefix}-${slug}-${Date.now().toString(36)}`
}
