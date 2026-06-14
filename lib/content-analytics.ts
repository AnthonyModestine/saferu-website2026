/**
 * Curated content usage analytics — views, copies, downloads.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import type { DateRange } from "@/lib/pio-analytics"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "content-analytics.json")

export type ContentEventType = "page_view" | "copy" | "download"

export interface ContentEvent {
  id: string
  eventType: ContentEventType
  categoryId?: string
  subcategoryId?: string
  articleId?: string
  articleTitle?: string
  postId?: string
  postTitle?: string
  path?: string
  memberEmail?: string
  ip?: string
  createdAt: number
}

export interface ContentAnalyticsDashboard {
  topArticles: { title: string; path: string; views: number; copies: number; downloads: number }[]
  topCategories: { category: string; views: number; copies: number; downloads: number }[]
  unusedArticles: { title: string; path: string; category: string }[]
  totals: { views: number; copies: number; downloads: number }
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

async function readStore(): Promise<ContentEvent[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const data = JSON.parse(raw) as ContentEvent[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function writeStore(events: ContentEvent[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(events, null, 2), "utf-8")
}

/** Parse article path like /crime-prevention/home/burglary-prevention */
export function parseContentPath(pathname: string): {
  categoryId?: string
  subcategoryId?: string
  articleId?: string
} {
  const segments = pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean)
  if (segments.length < 2) return {}
  if (segments[0] === "whats-new" && segments[1]) {
    return { categoryId: "whats-new", articleId: segments[1] }
  }
  if (segments.length >= 3) {
    return {
      categoryId: segments[0],
      subcategoryId: segments[1],
      articleId: segments[2],
    }
  }
  return { categoryId: segments[0], subcategoryId: segments[1] }
}

export async function recordContentEvent(params: {
  eventType: ContentEventType
  path?: string
  categoryId?: string
  subcategoryId?: string
  articleId?: string
  articleTitle?: string
  postId?: string
  postTitle?: string
  memberEmail?: string
  ip?: string
}): Promise<void> {
  const id = newId()
  const createdAt = Date.now()
  const parsed = params.path ? parseContentPath(params.path) : {}

  const categoryId = params.categoryId ?? parsed.categoryId
  const subcategoryId = params.subcategoryId ?? parsed.subcategoryId
  const articleId = params.articleId ?? parsed.articleId

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await db`
      INSERT INTO content_events (
        id, event_type, category_id, subcategory_id, article_id, article_title,
        post_id, post_title, path, member_email, ip, created_at
      ) VALUES (
        ${id},
        ${params.eventType},
        ${categoryId ?? null},
        ${subcategoryId ?? null},
        ${articleId ?? null},
        ${params.articleTitle ?? null},
        ${params.postId ?? null},
        ${params.postTitle ?? null},
        ${params.path ?? null},
        ${params.memberEmail?.toLowerCase() ?? null},
        ${params.ip ?? null},
        ${createdAt}
      )
    `
    return
  }

  const events = await readStore()
  events.push({
    id,
    eventType: params.eventType,
    categoryId,
    subcategoryId,
    articleId,
    articleTitle: params.articleTitle,
    postId: params.postId,
    postTitle: params.postTitle,
    path: params.path,
    memberEmail: params.memberEmail?.toLowerCase(),
    ip: params.ip,
    createdAt,
  })
  await writeStore(events)
}

async function loadEventsInRange(range: DateRange): Promise<ContentEvent[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT * FROM content_events
      WHERE created_at >= ${range.startMs} AND created_at <= ${range.endMs}
    `
    return rows.map((r) => ({
      id: String(r.id),
      eventType: String(r.event_type) as ContentEventType,
      categoryId: r.category_id ? String(r.category_id) : undefined,
      subcategoryId: r.subcategory_id ? String(r.subcategory_id) : undefined,
      articleId: r.article_id ? String(r.article_id) : undefined,
      articleTitle: r.article_title ? String(r.article_title) : undefined,
      postId: r.post_id ? String(r.post_id) : undefined,
      postTitle: r.post_title ? String(r.post_title) : undefined,
      path: r.path ? String(r.path) : undefined,
      memberEmail: r.member_email ? String(r.member_email) : undefined,
      ip: r.ip ? String(r.ip) : undefined,
      createdAt: Number(r.created_at),
    }))
  }

  const events = await readStore()
  return events.filter((e) => e.createdAt >= range.startMs && e.createdAt <= range.endMs)
}

export async function getContentAnalytics(
  range: DateRange,
  allArticlePaths: { path: string; title: string; category: string }[]
): Promise<ContentAnalyticsDashboard> {
  const events = await loadEventsInRange(range)

  const articleStats = new Map<
    string,
    { title: string; path: string; views: number; copies: number; downloads: number }
  >()
  const categoryStats = new Map<
    string,
    { views: number; copies: number; downloads: number }
  >()

  let totalViews = 0
  let totalCopies = 0
  let totalDownloads = 0

  for (const e of events) {
    const pathKey = e.path || [e.categoryId, e.subcategoryId, e.articleId].filter(Boolean).join("/")
    if (!pathKey) continue

    const title = e.articleTitle || e.articleId || pathKey
    const cur = articleStats.get(pathKey) ?? {
      title,
      path: e.path || `/${pathKey}`,
      views: 0,
      copies: 0,
      downloads: 0,
    }
    if (e.eventType === "page_view") {
      cur.views += 1
      totalViews += 1
    } else if (e.eventType === "copy") {
      cur.copies += 1
      totalCopies += 1
    } else if (e.eventType === "download") {
      cur.downloads += 1
      totalDownloads += 1
    }
    articleStats.set(pathKey, cur)

    const cat = e.categoryId || "unknown"
    const catCur = categoryStats.get(cat) ?? { views: 0, copies: 0, downloads: 0 }
    if (e.eventType === "page_view") catCur.views += 1
    else if (e.eventType === "copy") catCur.copies += 1
    else if (e.eventType === "download") catCur.downloads += 1
    categoryStats.set(cat, catCur)
  }

  const viewedPaths = new Set(
    events.filter((e) => e.eventType === "page_view").map((e) => e.path).filter(Boolean)
  )

  const unusedArticles = allArticlePaths
    .filter((a) => !viewedPaths.has(a.path))
    .slice(0, 25)

  return {
    topArticles: Array.from(articleStats.values())
      .sort((a, b) => b.views + b.copies + b.downloads - (a.views + a.copies + a.downloads))
      .slice(0, 15),
    topCategories: Array.from(categoryStats.entries())
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10),
    unusedArticles,
    totals: { views: totalViews, copies: totalCopies, downloads: totalDownloads },
  }
}
