"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Video,
  CalendarDays,
  Loader2,
  Megaphone,
  MapPin,
  Clock,
  Send,
  ChevronRight,
  Sparkles,
  ImageIcon,
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"
import { useAgency } from "@/lib/agency-context"
import { BRIEFING_CACHE_EVENT } from "@/lib/post-generator/opportunity-store"
import {
  countCachedBriefingOpportunities,
  loadCachedBriefingPreview,
  prefetchPostOpportunities,
} from "@/lib/post-generator/prefetch-briefing"
import { startHostedCheckoutSession } from "@/app/actions/stripe"
import { pressCenterSignInUrl, pressCenterSignUpUrl } from "@/lib/press-center-routes"
import {
  GRAPHIC_STUDIO_PATH,
  PRESS_CENTER_FEATURES,
} from "@/lib/press-center-features"
import {
  daysUntil,
  formatEventDateShort,
  getScheduledEventPosts,
  getUpcomingPioEvents,
  type PioEvent,
} from "@/lib/pio-events-store"

const MONTHLY_PRODUCT = "pio-tool-monthly"

interface GenerationStatus {
  remaining: number
}

const DEMO_EVENTS = [
  {
    id: "demo-1",
    title: "Coffee with the Chief",
    location: "Station 1 Lobby",
    timeRange: "9:00 AM – 10:30 AM",
    month: "MAY",
    day: "25",
    daysAway: 12,
    daysAwayLabel: "12 days away",
  },
  {
    id: "demo-2",
    title: "Smoke Alarm Install Day",
    location: "Community Center Parking Lot",
    timeRange: "9:00 AM – 1:00 PM",
    month: "MAY",
    day: "26",
    daysAway: 13,
    daysAwayLabel: "13 days away",
  },
  {
    id: "demo-3",
    title: "Back to School Safety Fair",
    location: "Lincoln Elementary Gym",
    timeRange: "10:00 AM – 1:00 PM",
    month: "SEP",
    day: "04",
    daysAway: 53,
    daysAwayLabel: "53 days away",
  },
  {
    id: "demo-4",
    title: "National Night Out",
    location: "Central Park Pavilion",
    timeRange: "6:00 PM – 9:00 PM",
    month: "OCT",
    day: "10",
    daysAway: 89,
    daysAwayLabel: "89 days away",
  },
  {
    id: "demo-5",
    title: "Open House — Fire Station 2",
    location: "Station 2 Bay Doors",
    timeRange: "11:00 AM – 3:00 PM",
    month: "NOV",
    day: "13",
    daysAway: 123,
    daysAwayLabel: "123 days away",
  },
]

const DEMO_POSTS = [
  {
    id: "dp1",
    time: "9:00 AM",
    preview: "Join us tonight at Central Park Pavilion for National Night Out — food, demos, and family fun!",
    tag: "National Night Out",
    tone: "blue" as const,
  },
  {
    id: "dp2",
    time: "11:30 AM",
    preview: "Free smoke alarms May 26 at the Community Center — stop by Station crews for install help.",
    tag: "Smoke Alarm Day",
    tone: "orange" as const,
  },
  {
    id: "dp3",
    time: "2:00 PM",
    preview: "Coffee with the Chief is this week — swing by Station 1 Lobby and ask your questions.",
    tag: "Community",
    tone: "green" as const,
  },
]

/** Guest preview: area recommendations that match the demo events and posts below. */
const DEMO_AREA_IDEAS = [
  {
    id: "demo-idea-nno",
    title: "National Night Out",
    whyItMatters: "Your event is coming up — share tonight’s reminder so families know where to go.",
  },
  {
    id: "demo-idea-smoke",
    title: "Smoke Alarm Install Day",
    whyItMatters: "Promote the May 26 free installs at the Community Center before residents plan their weekend.",
  },
  {
    id: "demo-idea-coffee",
    title: "Coffee with the Chief",
    whyItMatters: "Invite residents to Station 1 this week — a simple community post builds trust.",
  },
] as const

function greetingForNow(name: string | null | undefined): string {
  const hour = new Date().getHours()
  const first = (name || "").trim().split(/\s+/)[0]
  const who = first || "there"
  if (hour < 12) return `Good morning, ${who}!`
  if (hour < 17) return `Good afternoon, ${who}!`
  return `Good evening, ${who}!`
}

/** Local calendar YYYY-MM-DD (avoid UTC shift from toISOString). */
function localIsoDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function todayIso(): string {
  return localIsoDate()
}

function endOfWeekIso(): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  d.setDate(d.getDate() + daysUntilSunday)
  return localIsoDate(d)
}

function endOfMonthIso(): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setMonth(d.getMonth() + 1, 0)
  return localIsoDate(d)
}

export default function PIODashboardPage() {
  const router = useRouter()
  const { settings, locationReady } = useAgency()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const [genStatus, setGenStatus] = useState<GenerationStatus | null>(null)
  const [packLoading, setPackLoading] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState<PioEvent[]>([])
  const [postTab, setPostTab] = useState<"today" | "week" | "month">("today")
  // localStorage / Date are client-only — keep SSR + first paint identical
  const [hasMounted, setHasMounted] = useState(false)
  const [greeting, setGreeting] = useState("Welcome!")
  const [dateLabel, setDateLabel] = useState("")

  useEffect(() => {
    if (!isSubscribed) return
    fetch("/api/pio/generations")
      .then((r) => r.json())
      .then((data) => {
        if (data.remaining !== undefined) setGenStatus(data)
      })
      .catch(() => {})
  }, [isSubscribed])

  useEffect(() => {
    setHasMounted(true)
    setUpcomingEvents(getUpcomingPioEvents().slice(0, 4))
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    if (!member) {
      setGreeting("Welcome to Press Center")
    } else {
      setGreeting(greetingForNow(member.name))
    }
    setDateLabel(
      new Date()
        .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
        .toUpperCase()
    )
  }, [hasMounted, member])

  const scheduledPosts = useMemo(() => {
    if (!hasMounted) return []
    const today = todayIso()
    if (postTab === "today") {
      return getScheduledEventPosts({ from: today, to: today })
    }
    if (postTab === "week") {
      return getScheduledEventPosts({ from: today, to: endOfWeekIso() }).slice(0, 6)
    }
    return getScheduledEventPosts({ from: today, to: endOfMonthIso() }).slice(0, 8)
  }, [postTab, upcomingEvents, hasMounted])

  const isOutOfGenerations = isSubscribed && genStatus !== null && genStatus.remaining === 0
  const loading = sessionLoading || subLoading
  const initials = member
    ? (member.name || member.email || "?")
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?"
  const displayName = member?.name?.trim() || member?.email || "Guest"

  async function handleSubscribe() {
    if (sessionLoading || subLoading) return
    if (!member) {
      router.push(pressCenterSignUpUrl())
      return
    }
    setCheckoutLoading(true)
    try {
      const url = await startHostedCheckoutSession(MONTHLY_PRODUCT)
      if (url) window.location.href = url
      else setCheckoutLoading(false)
    } catch {
      setCheckoutLoading(false)
    }
  }

  async function handlePackPurchase(productId: string) {
    setPackLoading(productId)
    try {
      const url = await startHostedCheckoutSession(productId)
      if (url) window.location.href = url
    } catch {
      setPackLoading(null)
    }
  }

  const packs = [
    { id: "generations-5", label: "25,000 tokens", price: "$10" },
    { id: "generations-12", label: "50,000 tokens", price: "$20", popular: true },
    { id: "generations-35", label: "125,000 tokens", price: "$50" },
  ]

  const createHref = (href: string) => {
    if (loading) return href
    if (!member) return pressCenterSignInUrl()
    if (!isSubscribed) return "/pio-tool/subscribe"
    return href
  }

  const [briefingCount, setBriefingCount] = useState(0)

  useEffect(() => {
    const refresh = () => setBriefingCount(countCachedBriefingOpportunities())
    refresh()
    window.addEventListener(BRIEFING_CACHE_EVENT, refresh)
    return () => window.removeEventListener(BRIEFING_CACHE_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (!PRESS_CENTER_FEATURES.postGeneratorVisible) return
    if (!member || !isSubscribed || !locationReady) return
    void prefetchPostOpportunities({ settings, isPaid: true }).then((count) => {
      if (count > 0) setBriefingCount(count)
    })
  }, [
    member,
    isSubscribed,
    locationReady,
    settings.agencyName,
    settings.agencyType,
    settings.agencyTypeOther,
    settings.serviceAreaType,
    settings.city,
    settings.county,
    settings.state,
  ])

  const ideaPreview = useMemo(() => {
    if (!PRESS_CENTER_FEATURES.postGeneratorVisible) return []
    if (!member) return [...DEMO_AREA_IDEAS]
    if (!locationReady) return []
    const cached = loadCachedBriefingPreview(5)
    if (cached.length > 0) return cached
    return Array.from({ length: Math.min(briefingCount, 5) }, (_, i) => ({
      id: `cached-${i}`,
      title: "Loading recommendations…",
    }))
  }, [member, locationReady, briefingCount])

  const briefingStats = useMemo(() => {
    if (!member) {
      return {
        postsToday: DEMO_POSTS.length,
        eventsSoon: 2,
        ideas: PRESS_CENTER_FEATURES.postGeneratorVisible ? DEMO_AREA_IDEAS.length : 0,
      }
    }
    const postsToday = hasMounted
      ? getScheduledEventPosts({ from: todayIso(), to: todayIso() }).length
      : 0
    const eventsSoon = upcomingEvents.filter((e) => daysUntil(e.eventDate) <= 14).length
    return { postsToday, eventsSoon, ideas: ideaPreview.length }
  }, [member, hasMounted, upcomingEvents, ideaPreview])

  const briefingSummary = useMemo(() => {
    if (!PRESS_CENTER_FEATURES.postGeneratorVisible) {
      return member
        ? "What do you need to share with your community today?"
        : "Preview your agency communications workspace."
    }
    if (!member) {
      return "A sample agency day — events and posts that stay in sync."
    }
    const parts: string[] = []
    if (briefingStats.postsToday > 0)
      parts.push(
        `${briefingStats.postsToday} ${briefingStats.postsToday === 1 ? "post" : "posts"} ready to share`
      )
    if (briefingStats.eventsSoon > 0)
      parts.push(
        `${briefingStats.eventsSoon} ${briefingStats.eventsSoon === 1 ? "event" : "events"} coming up`
      )
    if (briefingStats.ideas > 0)
      parts.push(
        `${briefingStats.ideas} ${briefingStats.ideas === 1 ? "recommendation" : "recommendations"} for your area`
      )
    if (parts.length === 0) return "You're all caught up — let's keep our community informed and safe."
    return `Here's your day: ${parts.join(", ")}.`
  }, [briefingStats, member])

  const ideasLocationLabel = useMemo(() => {
    if (!member) return "Montgomery County, PA"
    const state = settings.state?.trim()
    if (!state) return null
    if (settings.serviceAreaType === "state") return state
    if (settings.serviceAreaType === "county") {
      const county = settings.county?.trim()
      if (county) return `${county}, ${state}`
      return null
    }
    const city = settings.city?.trim()
    const county = settings.county?.trim()
    if (city) return county ? `${city}, ${county}, ${state}` : `${city}, ${state}`
    return null
  }, [settings.city, settings.county, settings.state, settings.serviceAreaType, member])

  return (
    <div className="mx-auto max-w-[1120px] space-y-5 pb-8">
      {!loading && !isSubscribed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c7d7f5] bg-[#F0F5FF] px-4 py-3">
          <p className="text-sm font-medium text-[#0f1c3f]">
            This is a live preview of Press Center — including Upcoming Events and Posts to Share.
            Subscribe to unlock creating and publishing for your department.
          </p>
          <Button
            size="sm"
            disabled={checkoutLoading}
            onClick={handleSubscribe}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          >
            {checkoutLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : member ? (
              "Subscribe — $99/mo"
            ) : (
              "Create account & subscribe"
            )}
          </Button>
        </div>
      )}

      {member?.email === "local.dev@saferu.com" && (
        <div className="rounded-xl border border-dashed border-[#86efac] bg-[#ecfdf5] px-4 py-2 text-xs font-medium text-[#047857]">
          Localhost preview: signed in as Anthony M. (subscribed) — real deploy users still see the unlock banner until they pay.
        </div>
      )}

      {/* Daily briefing hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1B3A] via-[#12275c] to-[#3b1d80] p-5 text-white shadow-lg sm:p-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-24 -top-32 h-[340px] w-[340px] rounded-full bg-[#7C5CFC]/25 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        </div>

        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {dateLabel && (
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#93C5FD]">
                  {member
                    ? PRESS_CENTER_FEATURES.postGeneratorVisible
                      ? `${dateLabel} · DAILY BRIEFING`
                      : `${dateLabel} · PRESS CENTER`
                    : `${dateLabel} · LIVE PREVIEW`}
                </p>
              )}
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
                {greeting}
              </h1>
              <p className="mt-1 text-sm text-[#BFDBFE]">
                {briefingSummary}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {member ? (
                <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-3 sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#4f8cff] text-[11px] font-bold text-white">
                    {initials}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white">{displayName}</p>
                    <p className="text-[10px] text-[#a9bbdd]">PIO Admin</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                    <Link href={pressCenterSignInUrl()}>Sign in</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-[#F2B233] text-[#0f1c3f] hover:bg-[#ffc44d]">
                    <Link href={pressCenterSignUpUrl()}>Create account</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Briefing stats — hide while Post Generator is off */}
          {PRESS_CENTER_FEATURES.postGeneratorVisible ? (
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <a href="#posts-to-share" className="group flex items-baseline gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 transition-colors hover:bg-white/[0.12]">
                <span className="text-2xl font-bold">{briefingStats.postsToday}</span>
                <span className="text-sm font-semibold text-[#BFDBFE]">
                  {briefingStats.postsToday === 1 ? "post ready to share today" : "posts ready to share today"}
                </span>
              </a>
              <a href="#upcoming-events" className="group flex items-baseline gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 transition-colors hover:bg-white/[0.12]">
                <span className="text-2xl font-bold">{briefingStats.eventsSoon}</span>
                <span className="text-sm font-semibold text-[#BFDBFE]">
                  {briefingStats.eventsSoon === 1 ? "event in the next 2 weeks" : "events in the next 2 weeks"}
                </span>
              </a>
              <div className="flex items-baseline gap-2.5 rounded-xl border border-[#F2B233]/40 bg-[#F2B233]/10 px-4 py-3 sm:col-span-2">
                <span className="text-2xl font-bold text-[#F2B233]">{briefingStats.ideas}</span>
                <span className="text-sm font-semibold text-[#ffe3a8]">
                  {briefingStats.ideas === 1 ? "AI recommendation for your area" : "AI recommendations for your area"}
                </span>
              </div>
            </div>
          ) : null}

          {/* Quick create — inside the opening briefing card */}
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                {PRESS_CENTER_FEATURES.postGeneratorVisible ? (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0 text-[#F2B233]" />
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#93C5FD]">
                      Today for your area
                    </p>
                    {ideasLocationLabel ? (
                      <span className="truncate text-sm text-[#8fa5c7]">· {ideasLocationLabel}</span>
                    ) : (
                      <span className="truncate text-sm text-[#8fa5c7]">
                        · Set your service area in Settings
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 shrink-0 text-[#F2B233]" />
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#93C5FD]">
                      Quick start
                    </p>
                    <span className="truncate text-sm text-[#8fa5c7]">
                      · Press release, video request, events, or a safety graphic
                    </span>
                  </>
                )}
              </div>
              {PRESS_CENTER_FEATURES.postGeneratorVisible ? (
                member ? (
                  <Button asChild size="sm" className="bg-white text-[#0f1c3f] hover:bg-[#E0E7FF]">
                    <Link href={createHref("/pio-tool/ideas")}>
                      {briefingStats.ideas > 0
                        ? `See ${briefingStats.ideas} ${briefingStats.ideas === 1 ? "recommendation" : "recommendations"}`
                        : "Open generator"}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" className="bg-white text-[#0f1c3f] hover:bg-[#E0E7FF]">
                    <Link href={pressCenterSignInUrl()}>Sign in to view</Link>
                  </Button>
                )
              ) : null}
            </div>

            {member ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PRESS_CENTER_FEATURES.graphicStudioVisible && (
                  <QuickCreateTile
                    href={createHref(`${GRAPHIC_STUDIO_PATH}/safety-tip`)}
                    title="Safety Graphic"
                    icon={ImageIcon}
                    iconBg="bg-[#F59E0B]"
                    variant="hero"
                  />
                )}
                <QuickCreateTile
                  href={createHref("/pio-tool/new")}
                  title="Press Release"
                  icon={FileText}
                  iconBg="bg-[#3B82F6]"
                  variant="hero"
                />
                <QuickCreateTile
                  href={createHref("/pio-tool/community-post")}
                  title="Video Request"
                  icon={Video}
                  iconBg="bg-[#7C5CFC]"
                  variant="hero"
                />
                <QuickCreateTile
                  href={createHref("/pio-tool/events?new=1")}
                  title="Community Event"
                  icon={CalendarDays}
                  iconBg="bg-[#10B981]"
                  variant="hero"
                />
                {PRESS_CENTER_FEATURES.postGeneratorVisible && (
                  <QuickCreateTile
                    href={createHref("/pio-tool/ideas")}
                    title="AI Post Generator"
                    icon={Sparkles}
                    iconBg="bg-[#F59E0B]"
                    variant="hero"
                  />
                )}
              </div>
            ) : !PRESS_CENTER_FEATURES.postGeneratorVisible ? (
              <div className="mt-3">
                <Button asChild size="sm" className="bg-white text-[#0f1c3f] hover:bg-[#E0E7FF]">
                  <Link href={pressCenterSignInUrl()}>Sign in to create</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isOutOfGenerations && (
        <div className="rounded-2xl border border-[#f2d48a] bg-[#fff8e8] p-4">
          <p className="mb-3 font-semibold text-[#0f1c3f]">You&apos;ve used all your AI tokens this month</p>
          <div className="divide-y overflow-hidden rounded-xl border border-[#f2d48a] bg-white">
            {packs.map((pack) => (
              <button
                key={pack.id}
                type="button"
                disabled={packLoading !== null}
                onClick={() => handlePackPurchase(pack.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#f8f5ff] disabled:opacity-60"
              >
                <span className="text-sm font-medium">{pack.label}</span>
                <span className="text-sm font-semibold text-[#2563EB]">{pack.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events (left) + Posts to Share (right) */}
      <div className="flex w-full flex-col gap-4 md:flex-row md:items-stretch">
        <div id="upcoming-events" className="min-w-0 flex-1 scroll-mt-24">
          <UpcomingEventsPanel events={upcomingEvents} forceDemo={!member} />
        </div>
        <div id="posts-to-share" className="min-w-0 flex-1 scroll-mt-24">
          <PostsToSharePanel
            tab={postTab}
            onTabChange={setPostTab}
            posts={scheduledPosts}
            forceDemo={!member}
          />
        </div>
      </div>
    </div>
  )
}

function PanelHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#0f1c3f]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#7a8ab0]">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function QuickCreateTile({
  href,
  title,
  icon: Icon,
  iconBg,
  variant = "default",
}: {
  href: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  variant?: "default" | "hero"
}) {
  const isHero = variant === "hero"
  return (
    <Link
      href={href}
      className={
        isHero
          ? "group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3 transition hover:bg-white/15"
          : "group flex items-center gap-3 rounded-xl border border-[#e2e8f5] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      }
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg} text-white`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <span
        className={
          isHero
            ? "flex-1 text-sm font-semibold text-white"
            : "flex-1 text-sm font-semibold text-[#0f1c3f]"
        }
      >
        {title}
      </span>
      <ChevronRight
        className={
          isHero
            ? "h-4 w-4 text-[#93A4C7] transition group-hover:translate-x-0.5"
            : "h-4 w-4 text-[#9aa8c3] transition group-hover:translate-x-0.5"
        }
      />
    </Link>
  )
}

function UpcomingEventsPanel({
  events,
  forceDemo = false,
}: {
  events: PioEvent[]
  forceDemo?: boolean
}) {
  const useDemo = forceDemo || events.length === 0
  const rows = useDemo
    ? [...DEMO_EVENTS]
        .sort((a, b) => a.daysAway - b.daysAway)
        .slice(0, 4)
        .map((event) => ({
          id: event.id,
          month: event.month,
          day: event.day,
          title: event.title,
          location: event.location,
          timeRange: event.timeRange,
          daysAwayLabel: event.daysAwayLabel,
          href: "/pio-tool/events?new=1",
        }))
    : events
        .map((event) => {
          const { month, day } = formatEventDateShort(event.eventDate)
          const away = daysUntil(event.eventDate)
          return {
            id: event.id,
            month,
            day,
            title: event.title,
            location: event.location,
            timeRange: event.startTime
              ? event.endTime
                ? `${event.startTime} – ${event.endTime}`
                : event.startTime
              : "Time TBD",
            daysAwayLabel: away === 0 ? "Today" : `${away} days away`,
            href: `/pio-tool/events/${event.id}`,
            daysAway: away,
          }
        })
        .sort((a, b) => a.daysAway - b.daysAway)

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
      <PanelHeader
        icon={CalendarDays}
        title="Upcoming Events"
        subtitle="Next community events on your calendar"
        action={
          <Link
            href="/pio-tool/events"
            className="shrink-0 text-sm font-semibold text-[#2563EB] hover:underline"
          >
            View all →
          </Link>
        }
      />

      <ul className="flex flex-1 flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={row.href}
              className="flex items-center gap-3 rounded-xl border border-[#e8eef8] bg-[#F8FAFC] p-3 transition hover:border-[#bfdbfe] hover:bg-[#EFF6FF]"
            >
              <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-[#0f1c3f] ring-1 ring-[#e2e8f5]">
                <span className="text-[10px] font-bold tracking-wide text-[#64748b]">{row.month}</span>
                <span className="text-xl font-bold leading-none">{row.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#0f1c3f]">{row.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748b]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {row.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {row.timeRange}
                  </span>
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8]">
                {row.daysAwayLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PostsToSharePanel({
  tab,
  onTabChange,
  posts,
  forceDemo = false,
}: {
  tab: "today" | "week" | "month"
  onTabChange: (t: "today" | "week" | "month") => void
  posts: ReturnType<typeof getScheduledEventPosts>
  forceDemo?: boolean
}) {
  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ]

  const demoPosts = DEMO_POSTS.slice(0, 3)
  const showDemo = forceDemo || posts.length === 0

  return (
    <section className="flex h-full flex-col rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
      <PanelHeader
        icon={Send}
        title="Posts to Share"
        subtitle="What to post today, this week, and this month"
      />

      <div className="mb-4 flex gap-1 rounded-xl bg-[#F1F5F9] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition ${
              tab === t.id
                ? "bg-[#0B1B3A] text-white shadow-sm"
                : "text-[#64748b] hover:text-[#0f1c3f]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showDemo ? (
        <ul className="flex flex-1 flex-col gap-2.5">
          {demoPosts.map((post) => (
            <li key={post.id}>
              <div className="flex items-start gap-3 rounded-xl border border-[#e8eef8] bg-[#F8FAFC] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] ring-1 ring-[#e2e8f5]">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                    {post.time}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[#405172]">{post.preview}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8]">
                      {post.tag}
                    </span>
                    <Link
                      href="/pio-tool/events"
                      className="ml-auto inline-flex items-center rounded-lg border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-[#EFF6FF]"
                    >
                      View Message
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-1 flex-col gap-2.5">
          {posts.map((post) => {
            const href = post.key
              ? `/pio-tool/events/${post.eventId}/generate?key=${post.key}`
              : `/pio-tool/events/${post.eventId}`
            return (
              <li key={post.id}>
                <div className="flex items-start gap-3 rounded-xl border border-[#e8eef8] bg-[#F8FAFC] p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] ring-1 ring-[#e2e8f5]">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748b]">
                      {post.postDate} · {post.timingLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#405172]">{post.message}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#1D4ED8]">
                        {post.tag || post.eventTitle}
                      </span>
                      <Link
                        href={href}
                        className="ml-auto inline-flex items-center rounded-lg border border-[#bfdbfe] bg-white px-3 py-1.5 text-xs font-semibold text-[#2563EB] transition hover:bg-[#EFF6FF]"
                      >
                        View Message
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
