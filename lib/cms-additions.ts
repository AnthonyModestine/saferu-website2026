/**
 * CMS additions: subcategories, articles, and posts added via admin.
 * Merged with base content-library at runtime.
 * Persistence is in lib/cms-additions-persist.ts (server-only); load there so this module stays client-safe.
 */

import type { Subcategory, Article, SocialPost } from "@/lib/data/content-library"

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

export interface CmsAdditions {
  subcategories: CmsSubcategory[]
  articles: CmsArticle[]
  posts: CmsPost[]
  deletedPosts?: CmsDeletedPost[]
  deletedArticles?: CmsDeletedArticle[]
}

let additions: CmsAdditions = {
  subcategories: [],
  articles: [],
  posts: [],
  deletedPosts: [],
  deletedArticles: [],
}

export function getAdditions(): CmsAdditions {
  return {
    subcategories: [...additions.subcategories],
    articles: [...additions.articles],
    posts: [...additions.posts],
    deletedPosts: [...(additions.deletedPosts || [])],
    deletedArticles: [...(additions.deletedArticles || [])],
  }
}

export function setAdditions(data: CmsAdditions): void {
  additions = {
    subcategories: data.subcategories || [],
    articles: data.articles || [],
    posts: data.posts || [],
    deletedPosts: data.deletedPosts || [],
    deletedArticles: data.deletedArticles || [],
  }
}

export function addSubcategory(sub: CmsSubcategory): void {
  additions.subcategories.push(sub)
}

export function addArticle(art: CmsArticle): void {
  additions.articles.push(art)
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
