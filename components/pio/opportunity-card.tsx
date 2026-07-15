"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  Check,
  Copy,
  Download,
  ExternalLink,
  ImageIcon,
  Sparkles,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PostOpportunity } from "@/lib/post-generator/types"
import { cn } from "@/lib/utils"

const PRIORITY_STYLES: Record<
  PostOpportunity["priority"],
  { label: string; className: string }
> = {
  urgent: { label: "Urgent", className: "bg-[#FEE2E2] text-[#B91C1C]" },
  recommended_today: {
    label: "Recommended Today",
    className: "bg-[#FEF3C7] text-[#B45309]",
  },
  plan_ahead: { label: "Plan Ahead", className: "bg-[#DBEAFE] text-[#1D4ED8]" },
  optional: { label: "From SaferU", className: "bg-[#EDE9FE] text-[#6D28D9]" },
}

const SOURCE_CHIP: Record<string, string> = {
  "SaferU Curated Content": "bg-[#EDE9FE] text-[#6D28D9]",
  "Weather Alert": "bg-[#DBEAFE] text-[#1D4ED8]",
  "Seasonal Recommendation": "bg-[#D1FAE5] text-[#047857]",
  "Current Local Opportunity": "bg-[#FFEDD5] text-[#C2410C]",
  "Upcoming Event": "bg-[#FCE7F3] text-[#BE185D]",
}

type OpportunityCardProps = {
  opportunity: PostOpportunity
  onUse?: (opp: PostOpportunity) => void
  onGenerate?: (opp: PostOpportunity) => void
  onSave?: (opp: PostOpportunity) => void
  onDismiss?: (opp: PostOpportunity) => void
  onCopy?: (opp: PostOpportunity) => void
  copied?: boolean
  compact?: boolean
}

export function OpportunityCard({
  opportunity: opp,
  onUse,
  onGenerate,
  onSave,
  onDismiss,
  onCopy,
  copied,
  compact,
}: OpportunityCardProps) {
  const priority = PRIORITY_STYLES[opp.priority]
  const hasCurated = Boolean(opp.curatedMessage || opp.curated)
  const message = opp.curatedMessage || opp.curated?.message
  const graphic = opp.graphicThumbnailUrl || opp.graphicUrl || opp.curated?.graphicUrl

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f5] bg-white shadow-sm",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            priority.className
          )}
        >
          {priority.label}
        </span>
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            SOURCE_CHIP[opp.sourceLabel] ?? "bg-[#F1F5F9] text-[#475569]"
          )}
        >
          {opp.sourceLabel}
        </span>
      </div>

      <h3 className={cn("mt-2 font-bold text-[#0f1c3f]", compact ? "text-sm" : "text-base")}>
        {opp.title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{opp.whyItMatters}</p>
      <p className="mt-2 text-[11px] font-medium text-[#2563EB]">
        {opp.recommendedPostTiming}
      </p>
      <p className="mt-2 rounded-xl bg-[#F8FAFC] p-3 text-xs leading-relaxed text-[#405172]">
        <span className="font-semibold text-[#0f1c3f]">Recommended: </span>
        {opp.recommendedAction}
      </p>

      {(graphic || message) && (
        <div className="mt-3 flex gap-3 rounded-xl bg-[#F8FAFC] p-3">
          {graphic ? (
            <div className="relative aspect-video h-16 shrink-0 overflow-hidden rounded-lg bg-[#0d1526]">
              <Image
                src={graphic}
                alt={opp.graphicAltText || opp.curated?.title || opp.title}
                fill
                className="object-cover"
                sizes="114px"
                unoptimized={graphic.startsWith("data:") || graphic.startsWith("http")}
              />
            </div>
          ) : (
            <div className="flex aspect-video h-16 shrink-0 items-center justify-center rounded-lg bg-[#E2E8F0]">
              <ImageIcon className="h-6 w-6 text-[#94A3B8]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            {opp.curated?.title && (
              <p className="text-xs font-semibold text-[#0f1c3f]">{opp.curated.title}</p>
            )}
            {opp.curated?.category && (
              <p className="text-[10px] text-[#94A3B8]">{opp.curated.category}</p>
            )}
            {message && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#405172]">
                {message}
              </p>
            )}
            {graphic && opp.graphicSourceName && (
              <p className="mt-1 text-[10px] font-medium text-[#64748B]">
                Image:{" "}
                {opp.graphicSourceUrl ? (
                  <a
                    href={opp.graphicSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:underline"
                  >
                    {opp.graphicSourceName}
                  </a>
                ) : (
                  opp.graphicSourceName
                )}
              </p>
            )}
          </div>
        </div>
      )}

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

          {message && onCopy && (
            <Button type="button" size="sm" variant="outline" onClick={() => onCopy(opp)}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          )}

          {graphic && (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={graphic} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Graphic
              </a>
            </Button>
          )}

          {onSave && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onSave(opp)}>
              <Bookmark className="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
          )}

          {onDismiss && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onDismiss(opp)}>
              <X className="mr-1.5 h-3.5 w-3.5" />
              Dismiss
            </Button>
          )}

          {opp.sourceUrl && (
            <Button type="button" size="sm" variant="ghost" asChild>
              <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Source
              </a>
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
  opp: PostOpportunity
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
