/** Client-side helper for article publish / draft visibility API. */

export async function setArticleVisibility(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  published: boolean
): Promise<void> {
  const res = await fetch("/api/content/visibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoryId, subcategoryId, articleId, published }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `Failed to ${published ? "publish" : "move to drafts"}`)
  }
}
