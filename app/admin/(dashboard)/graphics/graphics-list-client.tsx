"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ThumbsDown, ThumbsUp, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PostMediaLightbox } from "@/components/post-media-lightbox"
import type { AdminGraphicSummary } from "@/lib/graphic-studio-store"

const REASON_LABELS: Record<string, string> = {
  logo_issue: "Logo problem",
  text_hard_to_read: "Text hard to read",
  wrong_visual: "Wrong visual / scene",
  inaccurate: "Inaccurate or unsafe",
  looks_unprofessional: "Looks unprofessional",
  other: "Other",
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function AdminGraphicsListClient({ graphics }: { graphics: AdminGraphicSummary[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "none">("all")
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return graphics.filter((g) => {
      if (filter === "positive" && g.feedback?.rating !== "positive") return false
      if (filter === "negative" && g.feedback?.rating !== "negative") return false
      if (filter === "none" && g.feedback) return false
      if (!q) return true
      const hay = `${g.headline} ${g.topic} ${g.userEmail} ${g.agencyName} ${g.caption}`.toLowerCase()
      return hay.includes(q)
    })
  }, [graphics, query, filter])

  if (graphics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-gray-900">No Graphics Studio images yet</p>
        <p className="mt-1 text-sm text-gray-500">
          When agencies generate safety graphics, copies will appear here for review.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email, agency, headline…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["positive", "Thumbs up"],
              ["negative", "Thumbs down"],
              ["none", "No feedback"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === value
                  ? "bg-[#1a365d] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {graphics.length} graphics
      </p>

      <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((g) => (
          <li
            key={g.graphicId}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <button
              type="button"
              className="relative aspect-video w-full cursor-zoom-in bg-[#0B1B3A]"
              onClick={() => setLightbox({ src: g.imageUrl, alt: g.headline || "Graphic" })}
              aria-label={`Preview ${g.headline || "graphic"}`}
            >
              <Image
                src={g.imageUrl}
                alt={g.headline || "Agency graphic"}
                fill
                className="object-contain"
                unoptimized
              />
            </button>
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  {g.status}
                </span>
                {g.feedback?.rating === "positive" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                    <ThumbsUp className="h-3 w-3" /> Up
                  </span>
                )}
                {g.feedback?.rating === "negative" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800">
                    <ThumbsDown className="h-3 w-3" /> Down
                  </span>
                )}
              </div>
              <h2 className="line-clamp-2 text-base font-bold text-gray-900">
                {g.headline || "Untitled graphic"}
              </h2>
              <p className="text-xs text-gray-500">
                {g.userEmail}
                {g.agencyName && g.agencyName !== g.userEmail ? ` · ${g.agencyName}` : ""}
              </p>
              <p className="text-xs text-gray-400">
                Created {formatWhen(g.generatedAt)}
                {g.savedAt ? ` · Saved ${formatWhen(g.savedAt)}` : ""}
              </p>
              {g.topic ? (
                <p className="line-clamp-2 text-xs text-gray-600">Topic: {g.topic}</p>
              ) : null}
              {g.feedback?.rating === "negative" && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-900">
                  <p className="font-semibold">
                    {REASON_LABELS[g.feedback.reason || ""] || g.feedback.reason || "Needs improvement"}
                  </p>
                  {g.feedback.comment ? (
                    <p className="mt-1 leading-relaxed">{g.feedback.comment}</p>
                  ) : null}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {lightbox && (
        <PostMediaLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          open={Boolean(lightbox)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
