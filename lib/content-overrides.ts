/**
 * Image overrides per post: categoryId -> subcategoryId -> articleId -> postId -> imageUrl
 * Allows admin to set/change graphics for template posts without editing code.
 * In production, persist to a database; here we use in-memory (resets on restart).
 */

export type ImageOverrides = Record<string, Record<string, Record<string, Record<string, string>>>>

let overrides: ImageOverrides = {}

export function getImageOverrides(): ImageOverrides {
  return { ...overrides }
}

export function getPostImageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): string | undefined {
  return overrides[categoryId]?.[subcategoryId]?.[articleId]?.[postId]
}

export function setPostImageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string,
  imageUrl: string
): void {
  if (!overrides[categoryId]) overrides[categoryId] = {}
  if (!overrides[categoryId][subcategoryId]) overrides[categoryId][subcategoryId] = {}
  if (!overrides[categoryId][subcategoryId][articleId]) overrides[categoryId][subcategoryId][articleId] = {}
  overrides[categoryId][subcategoryId][articleId][postId] = imageUrl
}

export function clearPostImageOverride(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
): void {
  if (overrides[categoryId]?.[subcategoryId]?.[articleId]) {
    delete overrides[categoryId][subcategoryId][articleId][postId]
  }
}
