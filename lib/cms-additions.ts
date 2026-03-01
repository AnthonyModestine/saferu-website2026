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

export interface CmsAdditions {
  subcategories: CmsSubcategory[]
  articles: CmsArticle[]
  posts: CmsPost[]
}

let additions: CmsAdditions = {
  subcategories: [],
  articles: [],
  posts: [],
}

export function getAdditions(): CmsAdditions {
  return {
    subcategories: [...additions.subcategories],
    articles: [...additions.articles],
    posts: [...additions.posts],
  }
}

export function setAdditions(data: CmsAdditions): void {
  additions = {
    subcategories: data.subcategories || [],
    articles: data.articles || [],
    posts: data.posts || [],
  }
}

export function addSubcategory(sub: CmsSubcategory): void {
  additions.subcategories.push(sub)
}

export function addArticle(art: CmsArticle): void {
  additions.articles.push(art)
}

export function addPost(post: CmsPost): void {
  additions.posts.push(post)
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
