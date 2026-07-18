"use client"

import Link from "next/link"
import { ArrowRight, FileText } from "lucide-react"
import type { Article } from "@/lib/data/content-library"

interface ArticleCardProps {
  article: Article
  href: string
  accent: string
  /** Optional context line shown next to the post count (e.g. subcategory title) */
  contextLabel?: string
}

/**
 * Article/pack listing card — text-focused only.
 * Graphics live on individual posts, not on article cards.
 */
export function ArticleCard({ article, href, accent, contextLabel }: ArticleCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}1A`, color: accent }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="flex-1 text-lg font-bold leading-snug text-[#1A365D] transition-colors group-hover:text-[#1470AF]">
            {article.title}
          </h3>
        </div>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-[#42536e]">
          {article.description}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F5] pt-4 text-sm">
          <span className="text-[#5c6b85]">
            {contextLabel ? `${contextLabel} · ` : ""}
            {article.posts.length} {article.posts.length === 1 ? "post" : "posts"}
          </span>
          <ArrowRight className="h-4 w-4 text-[#1470AF] transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
