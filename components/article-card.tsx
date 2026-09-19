"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Article } from "@/lib/data/content-library"

interface ArticleCardProps {
  article: Article
  href: string
  accent: string
  /** Optional context line (e.g. subcategory) — kept subtle under the title */
  contextLabel?: string
}

/**
 * Article listing card — title + post count only (descriptions live on the article page).
 */
export function ArticleCard({ article, href, accent, contextLabel }: ArticleCardProps) {
  const postCount = article.posts.length

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className="h-10 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold leading-snug text-[#1A365D] transition-colors group-hover:text-[#1470AF]">
          {article.title}
        </h3>
        {contextLabel ? (
          <p className="mt-0.5 text-xs font-medium text-[#8a99b0]">{contextLabel}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-bold tabular-nums"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {postCount} {postCount === 1 ? "post" : "posts"}
        </span>
        <ArrowRight className="h-4 w-4 text-[#8a99b0] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1470AF]" />
      </div>
    </Link>
  )
}
