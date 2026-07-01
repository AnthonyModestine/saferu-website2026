/**
 * In-memory content meta (order + overrides). Loaded from DB/file on the server.
 */

export type ImageOverrides = Record<string, Record<string, Record<string, Record<string, string>>>>
export type MessageOverrides = ImageOverrides

export type CategoryLayoutMode = "flat" | "nested"

export interface ContentMeta {
  subcategoryOrder: Record<string, string[]>
  articleOrder: Record<string, Record<string, string[]>>
  postOrder: Record<string, Record<string, Record<string, string[]>>>
  imageOverrides: ImageOverrides
  messageOverrides: MessageOverrides
  /** Per-category: flat = articles on category page; nested = subcategories required */
  categoryLayout: Record<string, CategoryLayoutMode>
}

const EMPTY_META: ContentMeta = {
  subcategoryOrder: {},
  articleOrder: {},
  postOrder: {},
  imageOverrides: {},
  messageOverrides: {},
  categoryLayout: {},
}

let meta: ContentMeta = { ...EMPTY_META }

function parseMeta(raw: unknown): ContentMeta {
  if (!raw || typeof raw !== "object") return { ...EMPTY_META }
  const data = raw as Partial<ContentMeta>
  return {
    subcategoryOrder: data.subcategoryOrder ?? {},
    articleOrder: data.articleOrder ?? {},
    postOrder: data.postOrder ?? {},
    imageOverrides: data.imageOverrides ?? {},
    messageOverrides: data.messageOverrides ?? {},
    categoryLayout: data.categoryLayout ?? {},
  }
}

export function getContentMeta(): ContentMeta {
  return meta
}

export function setContentMeta(next: ContentMeta): void {
  meta = parseMeta(next)
}
