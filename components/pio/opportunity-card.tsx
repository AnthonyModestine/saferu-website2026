"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  Clock,
  ExternalLink,
  ImageIcon,
  Sparkles,
  ThumbsDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PostOpportunity } from "@/lib/post-generator/types"
import { cn } from "@/lib/utils"

function alertTypeLabel(opp: PostOpportunity): string {
  const raw =
    opp.category?.trim() ||
    opp.sourceLabel?.replace(/SaferU Curated Content/i, "Safety Reminder") ||
    "Community Update"
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function recommendationLabel(opp: PostOpportunity): string {
  if (opp.opportunitySource === "saferu_curated" || opp.priority === "optional") {
    return "Optional Safety Post"
  }
  if (opp.priority === "plan_ahead") return "Plan Ahead"
  if (opp.priority === "urgent") return "Urgent"
  return "Recommend Today"
}

type OpportunityCardProps = {
  opportunity: PostOpportunity
  onUse?: (opp: PostOpportunity) => void
  onGenerate?: (opp: PostOpportunity) => void
  onSave?: (opp: PostOpportunity) => void
  onDismiss?: (opp: PostOpportunity) => void
  compact?: boolean
}

export function OpportunityCard({
  opportunity: opp,
  onUse,
  onGenerate,
  onSave,
  onDismiss,
  compact,
}: OpportunityCardProps) {
  const hasCurated = Boolean(opp.curatedMessage || opp.curated)
  const graphic = opp.graphicThumbnailUrl || opp.graphicUrl || opp.curated?.graphicUrl
  const overview = (opp.surfacedReason || opp.summary || opp.whyItMatters || "").trim()
  const whenToPost = (opp.recommendedPostTiming || "").trim()
  const sourceName =
    opp.sourceName?.trim() ||
    (opp.opportunitySource === "saferu_curated" ? "SaferU" : opp.sourceLabel)

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f5] bg-white shadow-sm",
        compact ? "p-3" : "p-4"
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#B45309]">
        {recommendationLabel(opp)} — {alertTypeLabel(opp)}
      </p>

      <h3 className={cn("mt-1.5 font-bold text-[#0f1c3f]", compact ? "text-sm" : "text-base")}>
        {opp.title}
      </h3>

      {whenToPost && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-[#2563EB]">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{whenToPost}</span>
        </p>
      )}

      {overview && (
        <p className="mt-2 text-sm leading-relaxed text-[#475569] line-clamp-3">{overview}</p>
      )}

      {sourceName && (
        <p className="mt-2 text-xs text-[#64748B]">
          <span className="font-semibold text-[#334155]">Issued by:</span> {sourceName}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-[#e8eef8] bg-[#F8FAFC]">
        <div className="relative aspect-video w-full bg-[#0d1526]">
          {graphic ? (
            <Image
              src={graphic}
              alt={opp.graphicAltText || opp.curated?.title || opp.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 560px"
              unoptimized={graphic.startsWith("data:") || graphic.startsWith("http")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#E2E8F0]">
              <ImageIcon className="h-10 w-10 text-[#94A3B8]" />
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hasCurated && onUse ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#7C5CFC] hover:bg-[#6D28D9]"
              onClick={() => onUse(opp)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Use This Post
            </Button>
          ) : onGenerate ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#7C5CFC] hover:bg-[#6D28D9]"
              onClick={() => onGenerate(opp)}
            >
              Generate Post
            </Button>
          ) : null}

          {opp.sourceUrl && (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Source
              </a>
            </Button>
          )}

          {onSave && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              title="Mark as useful so we learn what to recommend"
              onClick={() => onSave(opp)}
            >
              <Bookmark className="mr-1.5 h-3.5 w-3.5" />
              Useful
            </Button>
          )}

          {onDismiss && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              title="Hide this and don’t recommend it again"
              onClick={() => onDismiss(opp)}
            >
              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
              Not useful
            </Button>
          )}
        </div>
      )}
    </article>
  )
}

export function OpportunityPreviewLink({
  opp,
  href,
}: {
  opp: Pick<PostOpportunity, "title" | "whyItMatters">
  href: string
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15 transition hover:bg-white/15"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#FDE68A]" />
        <p className="truncate text-sm font-semibold">{opp.title}</p>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#C7D2FE]">
        {opp.whyItMatters}
      </p>
    </Link>
  )
}
