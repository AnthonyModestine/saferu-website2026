"use client"

import Image from "next/image"
import { Download, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PostOpportunity } from "@/lib/post-generator/types"
import { holidaySlogan } from "@/lib/pio-holiday-graphic"

type HolidayGraphicCardProps = {
  opportunity: PostOpportunity
  onUse?: (opp: PostOpportunity) => void
  loading?: boolean
}

export function HolidayGraphicCard({ opportunity: opp, onUse, loading }: HolidayGraphicCardProps) {
  const graphic = opp.graphicUrl || opp.graphicThumbnailUrl
  const slogan = holidaySlogan(opp)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f5] bg-white shadow-sm">
      <div className="border-b border-[#e2e8f5] px-4 py-3">
        <h3 className="text-sm font-bold text-[#0f1c3f]">{opp.title}</h3>
        <p className="mt-0.5 text-xs text-[#7a8ab0]">{slogan}</p>
      </div>

      <div className="relative aspect-video w-full bg-[#0d1526]">
        {loading || !graphic ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#94A3B8]" />
          </div>
        ) : (
          <Image
            src={graphic}
            alt={opp.graphicAltText || `${opp.title} holiday graphic`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 p-3">
        {onUse && (
          <Button
            type="button"
            size="sm"
            className="bg-[#7C5CFC] hover:bg-[#6D28D9]"
            disabled={!graphic}
            onClick={() => onUse(opp)}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Use This Post
          </Button>
        )}
        {graphic && (
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={graphic} download={`${opp.title.replace(/\s+/g, "-").toLowerCase()}.png`}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </a>
          </Button>
        )}
      </div>
    </article>
  )
}
