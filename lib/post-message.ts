import type { SocialPost } from "@/lib/data/content-library"

/** Best available caption text for a ready-to-share post card. */
export function getPostMessage(post: Pick<SocialPost, "message" | "captions">): string {
  if (post.message?.trim()) return post.message.trim()
  const c = post.captions
  if (!c) return ""
  return (
    c.facebook?.trim() ||
    c.instagram?.trim() ||
    c.twitter?.trim() ||
    ""
  )
}
