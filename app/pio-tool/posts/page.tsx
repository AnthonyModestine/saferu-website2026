"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Megaphone, Bell, PartyPopper, ChevronRight } from "lucide-react"
import { useMemberSession } from "@/lib/use-member-session"
import { isLocalGuestPreviewClient } from "@/lib/local-preview"
import { getScheduledEventPosts } from "@/lib/pio-events-store"
import { cn } from "@/lib/utils"

type SchedulePost = {
  id: string
  postDate: string
  timeLabel: string
  postName: string
  meta: string
  preview: string
  href: string
  tone: "blue" | "violet" | "emerald" | "amber"
}

const TONE_STYLES = {
  blue: {
    tile: "bg-[#DBEAFE] text-[#1D4ED8]",
    chip: "bg-[#EFF6FF] text-[#1D4ED8]",
    bar: "bg-[#3B82F6]",
    Icon: Megaphone,
  },
  violet: {
    tile: "bg-[#EDE9FE] text-[#6D28D9]",
    chip: "bg-[#F5F3FF] text-[#6D28D9]",
    bar: "bg-[#8B5CF6]",
    Icon: Bell,
  },
  emerald: {
    tile: "bg-[#D1FAE5] text-[#047857]",
    chip: "bg-[#ECFDF5] text-[#047857]",
    bar: "bg-[#10B981]",
    Icon: PartyPopper,
  },
  amber: {
    tile: "bg-[#FEF3C7] text-[#B45309]",
    chip: "bg-[#FFFBEB] text-[#B45309]",
    bar: "bg-[#F59E0B]",
    Icon: Bell,
  },
} as const

const DEMO_SCHEDULE_POSTS: SchedulePost[] = [
  {
    id: "sched-1",
    postDate: "2026-05-25",
    timeLabel: "9:00 AM",
    postName: "Coffee with the Chief",
    meta: "Event Day Reminder · Facebook",
    preview: "Swing by Station 1 Lobby this morning.",
    href: "/pio-tool/events?new=1",
    tone: "emerald",
  },
  {
    id: "sched-2",
    postDate: "2026-05-26",
    timeLabel: "11:30 AM",
    postName: "Smoke Alarm Install Day",
    meta: "Day-of Invite · Facebook",
    preview: "Free smoke alarms at the Community Center.",
    href: "/pio-tool/events?new=1",
    tone: "amber",
  },
  {
    id: "sched-3",
    postDate: "2026-09-04",
    timeLabel: "10:00 AM",
    postName: "Back to School Safety Fair",
    meta: "Event Day Reminder · Facebook",
    preview: "Lincoln Elementary — demos and family activities.",
    href: "/pio-tool/events?new=1",
    tone: "blue",
  },
  {
    id: "sched-4",
    postDate: "2026-10-10",
    timeLabel: "9:00 AM",
    postName: "National Night Out",
    meta: "Day-of Invite · Facebook",
    preview: "Tonight at Central Park Pavilion.",
    href: "/pio-tool/events?new=1",
    tone: "violet",
  },
  {
    id: "sched-5",
    postDate: "2026-10-10",
    timeLabel: "4:00 PM",
    postName: "National Night Out",
    meta: "Final Reminder · Facebook",
    preview: "Starts at 6 PM — don’t miss it.",
    href: "/pio-tool/events?new=1",
    tone: "violet",
  },
  {
    id: "sched-6",
    postDate: "2026-11-13",
    timeLabel: "10:00 AM",
    postName: "Station 2 Open House",
    meta: "Event Day Reminder · Facebook",
    preview: "Tour the apparatus and meet your crews.",
    href: "/pio-tool/events?new=1",
    tone: "amber",
  },
]

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7)
}

function monthLabel(key: string): string {
  const d = new Date(`${key}-15T12:00:00`)
  if (Number.isNaN(d.getTime())) return key
  return d.toLocaleString("en-US", { month: "short" })
}

function dayNum(isoDate: string): string {
  return String(new Date(`${isoDate}T12:00:00`).getDate())
}

function timeSortKey(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return 0
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = (m[3] || "").toUpperCase()
  if (ap === "PM" && h < 12) h += 12
  if (ap === "AM" && h === 12) h = 0
  return h * 60 + min
}

function sortPosts(posts: SchedulePost[]): SchedulePost[] {
  return [...posts].sort((a, b) => {
    const byDate = a.postDate.localeCompare(b.postDate)
    if (byDate !== 0) return byDate
    return timeSortKey(a.timeLabel) - timeSortKey(b.timeLabel)
  })
}

function oneLine(text: string, max = 72): string {
  const cleaned = text.replace(/\s+/g, " ").trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1).trimEnd()}…`
}

function toneFor(channel: string, index: number): SchedulePost["tone"] {
  if (/facebook/i.test(channel)) return index % 2 === 0 ? "blue" : "violet"
  if (/x\b|twitter/i.test(channel)) return "amber"
  const cycle: SchedulePost["tone"][] = ["blue", "violet", "emerald", "amber"]
  return cycle[index % cycle.length]!
}

export default function PostsSchedulePage() {
  const { member, isLoading } = useMemberSession()
  const [mounted, setMounted] = useState(false)
  const [realPosts, setRealPosts] = useState<SchedulePost[]>([])
  const [activeMonth, setActiveMonth] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const rows = getScheduledEventPosts().map((post, index) => {
      const postName =
        post.eventTitle?.trim() ||
        post.postTitle?.trim() ||
        post.tag?.trim() ||
        post.timingLabel?.trim() ||
        "Scheduled post"
      const metaParts = [post.timingLabel, post.channel].filter(Boolean)
      return {
        id: post.id,
        postDate: post.postDate,
        timeLabel: post.postTime || "",
        postName,
        meta: metaParts.join(" · ") || post.channel,
        preview: oneLine(post.message || post.timingLabel || "Open to review this post"),
        href: post.key
          ? `/pio-tool/events/${post.eventId}/generate?key=${post.key}`
          : `/pio-tool/events/${post.eventId}`,
        tone: toneFor(post.channel, index),
      }
    })
    setRealPosts(rows)
  }, [])

  const guest = isLocalGuestPreviewClient() || (!isLoading && !member)
  const useDemo = !mounted || guest || realPosts.length === 0
  const posts = useMemo(
    () => sortPosts(useDemo ? DEMO_SCHEDULE_POSTS : realPosts),
    [useDemo, realPosts]
  )

  const months = useMemo(() => {
    const keys: string[] = []
    for (const post of posts) {
      const key = monthKey(post.postDate)
      if (!keys.includes(key)) keys.push(key)
    }
    return keys
  }, [posts])

  useEffect(() => {
    if (months.length === 0) {
      setActiveMonth(null)
      return
    }
    setActiveMonth((prev) => (prev && months.includes(prev) ? prev : months[0]!))
  }, [months])

  const monthPosts = useMemo(
    () => posts.filter((p) => monthKey(p.postDate) === activeMonth),
    [posts, activeMonth]
  )
  const upNext = monthPosts[0]
  const rest = monthPosts.slice(1)

  return (
    <div className="mx-auto max-w-[720px] space-y-6 pb-10">
      <div>
        <Link
          href="/pio-tool"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#0f1c3f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1c3f]">Post schedule</h1>
        <p className="mt-1 text-sm text-[#7a8ab0]">What’s going out next</p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#c7d2fe] bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] px-6 py-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-[#6366F1]" />
          <p className="mt-3 text-base font-semibold text-[#0f1c3f]">Nothing scheduled yet</p>
          <Link
            href="/pio-tool/events?new=1"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#4F46E5] hover:underline"
          >
            Create an event
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {months.map((key) => {
              const count = posts.filter((p) => monthKey(p.postDate) === key).length
              const active = key === activeMonth
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveMonth(key)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-[#0f1c3f] text-white shadow-sm"
                      : "bg-white text-[#64748b] ring-1 ring-[#e2e8f5] hover:bg-[#F8FAFC]"
                  )}
                >
                  {monthLabel(key)}
                  <span className={cn("ml-1.5 tabular-nums", active ? "text-white/70" : "text-[#94A3B8]")}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {upNext && (
            <Link
              href={upNext.href}
              className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1B3A] to-[#1e3a8a] p-6 text-white shadow-lg shadow-[#1e3a8a]/25 transition hover:scale-[1.01]"
            >
              <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 left-10 h-24 w-24 rounded-full bg-[#7C5CFC]/30" />
              <p className="relative text-xs font-bold uppercase tracking-[0.16em] text-[#93C5FD]">
                Up next
              </p>
              <p className="relative mt-3 text-2xl font-bold tracking-tight">{upNext.postName}</p>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-[#BFDBFE]">
                {upNext.preview}
              </p>
              <div className="relative mt-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  {dayNum(upNext.postDate)} {monthLabel(monthKey(upNext.postDate))}
                  {upNext.timeLabel ? ` · ${upNext.timeLabel}` : ""}
                </span>
                <span className="rounded-full bg-[#7C5CFC]/35 px-3 py-1 text-xs font-semibold">
                  {upNext.meta}
                </span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {rest.map((post) => {
                const tone = TONE_STYLES[post.tone]
                const Icon = tone.Icon
                return (
                  <li key={post.id}>
                    <Link
                      href={post.href}
                      className="flex h-full gap-3 overflow-hidden rounded-2xl border border-[#e2e8f5] bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div
                        className={cn(
                          "flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl",
                          tone.tile
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase">
                          {monthLabel(monthKey(post.postDate))}
                        </span>
                        <span className="text-xl font-bold leading-none">{dayNum(post.postDate)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-[#0f1c3f]">{post.postName}</p>
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />
                        </div>
                        <p className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold", tone.chip)}>
                          {post.meta}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#64748b]">
                          {post.preview}
                        </p>
                        {post.timeLabel ? (
                          <p className="mt-2 text-[11px] font-medium text-[#94A3B8]">{post.timeLabel}</p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
