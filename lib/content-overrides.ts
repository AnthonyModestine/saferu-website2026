/**
 * Image and message overrides per post.
 * Allows admin to change graphics and copy for template posts without editing code.
 */

import { getContentMeta } from "@/lib/content-meta-store"

export type { ImageOverrides, MessageOverrides } from "@/lib/content-meta-store"

export function getImageOverrides(): ImageOverrides {
  return { ...getContentMeta().imageOverrides }
}

export function getMessageOverrides(): MessageOverrides {
  return { ...getContentMeta().messageOverrides }
}

export function getPostImageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): string | undefined {
  return getContentMeta().imageOverrides[categoryId]?.[subcategoryId]?.[articleId]?.[postId]
}

export function getPostMessageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): string | undefined {
  return getContentMeta().messageOverrides[categoryId]?.[subcategoryId]?.[articleId]?.[postId]
}

export function setPostImageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string,
  imageUrl: string
): void {
  const meta = getContentMeta()
  if (!meta.imageOverrides[categoryId]) meta.imageOverrides[categoryId] = {}
  if (!meta.imageOverrides[categoryId][subcategoryId]) meta.imageOverrides[categoryId][subcategoryId] = {}
  if (!meta.imageOverrides[categoryId][subcategoryId][articleId]) {
    meta.imageOverrides[categoryId][subcategoryId][articleId] = {}
  }
  meta.imageOverrides[categoryId][subcategoryId][articleId][postId] = imageUrl
}

export function clearPostImageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): void {
  const bucket = getContentMeta().imageOverrides[categoryId]?.[subcategoryId]?.[articleId]
  if (bucket) delete bucket[postId]
}

export function setPostMessageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string,
  message: string
): void {
  const meta = getContentMeta()
  if (!meta.messageOverrides[categoryId]) meta.messageOverrides[categoryId] = {}
  if (!meta.messageOverrides[categoryId][subcategoryId]) meta.messageOverrides[categoryId][subcategoryId] = {}
  if (!meta.messageOverrides[categoryId][subcategoryId][articleId]) {
    meta.messageOverrides[categoryId][subcategoryId][articleId] = {}
  }
  meta.messageOverrides[categoryId][subcategoryId][articleId][postId] = message
}

export function clearPostMessageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): void {
  const bucket = getContentMeta().messageOverrides[categoryId]?.[subcategoryId]?.[articleId]
  if (bucket) delete bucket[postId]
}
