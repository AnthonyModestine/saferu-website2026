"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
  Sparkles,
  ThumbsDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PostOpportunity } from "@/lib/post-generator/types"
import { opportunityPrimaryLine } from "@/lib/post-generator/opportunity-type-label"
import {
  opportunityAboutText,
  opportunityPostingGuidance,
  opportunityPostingTimeDisplay,
  opportunitySaferuRecommendation,
  opportunitySourceLabel,
} from "@/lib/post-generator/opportunity-card-display"
import { cn } from "@/lib/utils"

type OpportunityCardProps = {
  opportunity: PostOpportunity
  onUse?: (opp: PostOpportunity) => void
  onGenerate?: (opp: PostOpportunity) => void
  onSave?: (opp: PostOpportunity) => void
  onDismiss?: (opp: PostOpportunity) => void
  generating?: boolean
  endorsed?: boolean
  compact?: boolean
}

export function OpportunityCard({
  opportunity: opp,
  onUse,
  onGenerate,
  onSave,
  onDismiss,
  generating,
  endorsed,
  compact,
}: OpportunityCardProps) {
  const isLibrary = opp.opportunitySource === "saferu_curated"
  const hasReadyMessage = Boolean(opp.curatedMessage?.trim() || opp.curated?.message?.trim())
  const showOpen = hasReadyMessage && onUse
  const showGenerate = !hasReadyMessage && onGenerate && !generating
  const graphic = opp.graphicThumbnailUrl || opp.graphicUrl || opp.curated?.graphicUrl
  const primaryLine = opportunityPrimaryLine(opp)
  const aboutText = opportunityAboutText(opp)
  const postingGuidance = opportunityPostingGuidance(opp)
  const postingDisplay = opportunityPostingTimeDisplay(postingGuidance)
  const recommendation = opportunitySaferuRecommendation(opp)
  const sourceName = opportunitySourceLabel(opp)
  const sourceUrl = opp.sourceUrl?.trim()

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f5] bg-white shadow-sm",
        compact ? "p-3" : "p-4"
      )}
    >
      <h3 className={cn("font-bold text-[#0f1c3f]", compact ? "text-sm" : "text-base")}>
        {primaryLine}
      </h3>

      {aboutText && (
        <p className={cn("mt-2 leading-relaxed text-[#475569]", compact ? "text-xs" : "text-sm")}>
          {aboutText}
        </p>
      )}

      {postingDisplay && (
        <div className="mt-3 rounded-lg bg-[#EFF6FF] px-3 py-2.5">
          <p className="flex items-start gap-1.5 text-xs font-semibold text-[#1D4ED8]">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="font-bold">{postingDisplay.headline}</span>
          </p>
          {postingDisplay.rationale && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#334155]">{postingDisplay.rationale}</p>
          )}
        </div>
      )}

      {recommendation && (
        <div className="mt-3 rounded-lg bg-[#F5F3FF] px-3 py-2.5">
          <p className="flex items-start gap-1.5 text-xs font-semibold text-[#6D28D9]">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Why SaferU recommends it</span>
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#334155]">{recommendation}</p>
        </div>
      )}

      {sourceName && (
        <p className="mt-2 text-xs text-[#64748B]">
          <span className="font-semibold text-[#334155]">Source:</span> {sourceName}
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
          {showOpen ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#7C5CFC] hover:bg-[#6D28D9]"
              onClick={() => onUse!(opp)}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {isLibrary ? "Use This Post" : "Open Post"}
            </Button>
          ) : showGenerate ? (
            <Button
              type="button"
              size="sm"
              className="bg-[#7C5CFC] hover:bg-[#6D28D9]"
              onClick={() => onGenerate!(opp)}
            >
              Generate Post
            </Button>
          ) : generating ? (
            <Button type="button" size="sm" className="bg-[#7C5CFC]" disabled>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Opening post…
            </Button>
          ) : null}

          {sourceUrl && (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Source
              </a>
            </Button>
          )}

          {onSave && (
            endorsed ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-[#059669]"
                disabled
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Endorsed
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                title="Endorse this as a strong fit for your agency’s communications"
                onClick={() => onSave(opp)}
              >
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                Endorse
              </Button>
            )
          )}

          {onDismiss && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              title="Decline — not relevant for this agency"
              onClick={() => onDismiss(opp)}
            >
              <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
              Decline
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
