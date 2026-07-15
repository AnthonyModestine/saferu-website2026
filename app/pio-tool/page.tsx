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
  AlertTriangle,
  Send,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"
import { useAgency } from "@/lib/agency-context"
import { startHostedCheckoutSession } from "@/app/actions/stripe"
import { pressCenterSignInUrl, pressCenterSignUpUrl } from "@/lib/press-center-routes"
import {
  daysUntil,
  formatEventDateShort,
  getScheduledEventPosts,
  getUpcomingPioEvents,
  type PioEvent,
} from "@/lib/pio-events-store"
import { parseServiceZips } from "@/lib/local-ideas-ai"
import { generatePostOpportunities, flattenOpportunities } from "@/lib/post-generator/engine"
import { OpportunityPreviewLink } from "@/components/pio/opportunity-card"

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
    preview: "Free smoke alarms this Saturday at the Community Center — stop by Station crews for install help.",
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

function addDaysIso(days: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return localIsoDate(d)
}

export default function PIODashboardPage() {
  const router = useRouter()
  const { settings } = useAgency()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const [genStatus, setGenStatus] = useState<GenerationStatus | null>(null)
  const [packLoading, setPackLoading] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [upcomingEvents, setUpcomingEvents] = useState<PioEvent[]>([])
  const [postTab, setPostTab] = useState<"today" | "week" | "upcoming">("today")
  // localStorage / Date are client-only — keep SSR + first paint identical
  const [hasMounted, setHasMounted] = useState(false)
  const [greeting, setGreeting] = useState("Welcome!")

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
    setUpcomingEvents(getUpcomingPioEvents().slice(0, 5))
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    setGreeting(greetingForNow(member?.name))
  }, [hasMounted, member?.name])

  const scheduledPosts = useMemo(() => {
    if (!hasMounted) return []
    const today = todayIso()
    const weekEnd = endOfWeekIso()
    if (postTab === "today") {
      return getScheduledEventPosts({ from: today, to: today })
    }
    if (postTab === "week") {
      return getScheduledEventPosts({ from: today, to: weekEnd }).slice(0, 4)
    }
    // Upcoming = next posts after this week (max 6)
    const afterWeek = new Date(weekEnd + "T12:00:00")
    afterWeek.setDate(afterWeek.getDate() + 1)
    return getScheduledEventPosts({ from: localIsoDate(afterWeek) }).slice(0, 6)
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
    { id: "generations-5", label: "5 generations", price: "$10" },
    { id: "generations-12", label: "12 generations", price: "$20", popular: true },
    { id: "generations-35", label: "35 generations", price: "$50" },
  ]

  const createHref = (href: string) => {
    if (loading) return href
    if (!member) return pressCenterSignInUrl()
    if (!isSubscribed) return "/pio-tool/subscribe"
    return href
  }

  const ideaPreview = useMemo(() => {
    const zips = parseServiceZips(settings.serviceZips)
    const state = settings.state?.trim() || (member ? "" : "TX")
    const serviceZips = zips.length ? zips : member ? [] : ["76877"]
    if (!state || serviceZips.length === 0) return []
    const result = generatePostOpportunities({
      agencyName: settings.agencyName,
      city: settings.city || (member ? "" : "San Saba"),
      state,
      serviceZips,
    })
    return flattenOpportunities(result).slice(0, 3)
  }, [settings.agencyName, settings.city, settings.state, settings.serviceZips, member])

  const ideasLocationLabel = useMemo(() => {
    const zips = parseServiceZips(settings.serviceZips)
    if (settings.state?.trim() && zips.length > 0) {
      return `${settings.city ? `${settings.city}, ` : ""}${settings.state} · ZIP ${zips.slice(0, 2).join(", ")}`
    }
    if (!member) return "San Saba, TX · ZIP 76877"
    return null
  }, [settings.city, settings.state, settings.serviceZips, member])

  return (
    <div className="mx-auto max-w-[1120px] space-y-7 pb-8">
      {!loading && !isSubscribed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#cfc3ff] bg-gradient-to-r from-[#f3eeff] to-[#eaf2ff] px-4 py-3">
          <p className="text-sm font-medium text-[#3d2d7a]">
            This is a live preview of Press Center — including Upcoming Events and Posts to Share.
            Subscribe to unlock creating and publishing for your department.
          </p>
          <Button
            size="sm"
            disabled={checkoutLoading}
            onClick={handleSubscribe}
            className="bg-[#7c5cfc] text-white hover:bg-[#6a4df0]"
          >
            {checkoutLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : member ? (
              "Subscribe — $30/mo"
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

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0f1c3f] sm:text-[2.05rem]">
            {greeting}
          </h1>
          <p className="mt-1.5 text-[15px] text-[#667795]">
            Let&apos;s keep our community informed and safe.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {member ? (
            <div className="hidden items-center gap-2 rounded-full border border-[#dde5f5] bg-white py-1 pl-1 pr-3 shadow-sm sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7c5cfc] to-[#4f8cff] text-[11px] font-bold text-white">
                {initials}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-[#0f1c3f]">{displayName}</p>
                <p className="text-[10px] text-[#7a8ab0]">PIO Admin</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="border-[#d5def0] bg-white">
                <Link href={pressCenterSignInUrl()}>Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                <Link href={pressCenterSignUpUrl()}>Create account</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {isOutOfGenerations && (
        <div className="rounded-2xl border border-[#f2d48a] bg-[#fff8e8] p-4">
          <p className="mb-3 font-semibold text-[#0f1c3f]">You&apos;ve used all your generations this month</p>
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
                <span className="text-sm font-semibold text-[#7c5cfc]">{pack.price}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New — always visible */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#0f1c3f]">Create New</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CreateCard
            href={createHref("/pio-tool/new")}
            title="Press Release"
            description="Incidents, announcements, and community updates."
            icon={FileText}
            iconBg="bg-[#3B82F6]"
            cardBg="bg-[#EFF6FF]"
            arrowColor="text-[#3B82F6]"
          />
          <CreateCard
            href={createHref("/pio-tool/community-post")}
            title="Video Request"
            description="Ask the public for surveillance or dashcam footage."
            icon={Video}
            iconBg="bg-[#7C5CFC]"
            cardBg="bg-[#F3EEFF]"
            arrowColor="text-[#7C5CFC]"
          />
          <CreateCard
            href={createHref("/pio-tool/events?new=1")}
            title="Community Event"
            description="Promote events you host or support."
            icon={CalendarDays}
            iconBg="bg-[#10B981]"
            cardBg="bg-[#ECFDF5]"
            arrowColor="text-[#10B981]"
          />
          <CreateCard
            href={createHref("/pio-tool/ideas")}
            title="AI Post Generator"
            description="What to communicate today — with SaferU graphics."
            icon={Sparkles}
            iconBg="bg-[#F59E0B]"
            cardBg="bg-[#FFFBEB]"
            arrowColor="text-[#D97706]"
          />
        </div>
      </section>

      {/* Local Ideas strip — same layout rhythm, adds energy */}
      <section className="overflow-hidden rounded-2xl border border-[#e2e8f5] bg-gradient-to-r from-[#0B1B3A] via-[#1e3a8a] to-[#4c1d95] p-5 text-white shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#93C5FD]">
              Today for your area
            </p>
            <h2 className="mt-1 text-lg font-bold">AI Post Generator</h2>
            <p className="mt-1 text-sm text-[#BFDBFE]">
              {ideasLocationLabel ||
                "Add state + ZIP in Settings so recommendations match the communities you serve."}
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-white text-[#0f1c3f] hover:bg-[#E0E7FF]"
          >
            <Link href={createHref("/pio-tool/ideas")}>
              Open generator
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {ideaPreview.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {ideaPreview.map((opp) => (
              <OpportunityPreviewLink
                key={opp.id}
                opp={opp}
                href={createHref("/pio-tool/ideas")}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#BFDBFE]">
            Set your service ZIPs once — then see what your agency should communicate today,
            with SaferU messages and graphics when available.
          </p>
        )}
      </section>

      {/* Upcoming Events + Posts to Share — always visible */}
      <div className="grid gap-5 lg:grid-cols-2">
        <UpcomingEventsPanel events={upcomingEvents} forceDemo={!member} />
        <PostsToSharePanel
          tab={postTab}
          onTabChange={setPostTab}
          posts={scheduledPosts}
          forceDemo={!member}
        />
      </div>
    </div>
  )
}

function CreateCard({
  href,
  title,
  description,
  icon: Icon,
  iconBg,
  cardBg,
  arrowColor,
}: {
  href: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  cardBg: string
  arrowColor: string
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-[148px] flex-col rounded-2xl ${cardBg} p-5 shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} text-white shadow-md`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-bold text-[#0f1c3f]">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[#5b6b8c]">{description}</p>
      <ChevronRight
        className={`mt-3 h-5 w-5 ${arrowColor} transition group-hover:translate-x-0.5`}
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
    <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#3B82F6]" />
          <h2 className="text-lg font-bold text-[#0f1c3f]">Upcoming Events</h2>
        </div>
        <Link href="/pio-tool/events" className="text-sm font-semibold text-[#3B82F6] hover:underline">
          View all events →
        </Link>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={row.href}
              className="flex items-center gap-3 rounded-xl border border-[#e8eef8] bg-white p-3 transition hover:border-[#86efac] hover:bg-[#f8fffb]"
            >
              <div className="flex h-[58px] w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F3F4F6] text-[#0f1c3f]">
                <span className="text-[10px] font-bold tracking-wide text-[#6b7280]">{row.month}</span>
                <span className="text-xl font-bold leading-none">{row.day}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#0f1c3f]">{row.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6b7c9c]">
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
              <div className="shrink-0 text-right">
                <span className="block rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                  {row.daysAwayLabel}
                </span>
              </div>
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
  tab: "today" | "week" | "upcoming"
  onTabChange: (t: "today" | "week" | "upcoming") => void
  posts: ReturnType<typeof getScheduledEventPosts>
  forceDemo?: boolean
}) {
  const tabs: Array<{ id: typeof tab; label: string }> = [
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "upcoming", label: "Upcoming" },
  ]

  const toneIcon = {
    green: { wrap: "bg-[#D1FAE5] text-[#059669]", Icon: Megaphone },
    orange: { wrap: "bg-[#FFEDD5] text-[#EA580C]", Icon: AlertTriangle },
    blue: { wrap: "bg-[#DBEAFE] text-[#2563EB]", Icon: Send },
  }

  // Guest / empty: always show 3 demo posts (police + fire mix)
  const demoPosts = DEMO_POSTS.slice(0, 3)
  const showDemo = forceDemo || posts.length === 0

  return (
    <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#7C5CFC]" />
            <h2 className="text-lg font-bold text-[#0f1c3f]">Posts to Share</h2>
          </div>
          <p className="mt-1 text-sm text-[#7a8ab0]">Ready to review and share</p>
        </div>
        <Link
          href="/pio-tool/posts"
          className="shrink-0 text-sm font-semibold text-[#3B82F6] hover:underline"
        >
          View full schedule →
        </Link>
      </div>

      <div className="mb-4 mt-4 flex gap-1 rounded-full bg-[#F3F4F6] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`flex-1 rounded-full px-3 py-2 text-xs font-bold transition ${
              tab === t.id
                ? "bg-[#7C5CFC] text-white shadow-sm"
                : "text-[#6b7c9c] hover:text-[#0f1c3f]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showDemo ? (
        <ul className="space-y-3">
          {demoPosts.map((post) => {
            const tone = toneIcon[post.tone]
            const Icon = tone.Icon
            return (
              <li
                key={post.id}
                className="rounded-xl border border-[#e8eef8] bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.wrap}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#9aa8c3]">
                      {post.time}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#405172]">{post.preview}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          post.tone === "orange"
                            ? "bg-[#FFEDD5] text-[#C2410C]"
                            : post.tone === "blue"
                              ? "bg-[#DBEAFE] text-[#1D4ED8]"
                              : "bg-[#D1FAE5] text-[#047857]"
                        }`}
                      >
                        {post.tag}
                      </span>
                      <Link
                        href="/pio-tool/events"
                        className="ml-auto inline-flex items-center rounded-lg border border-[#d4ccff] bg-[#f8f5ff] px-3 py-1.5 text-xs font-semibold text-[#6b4dff] transition hover:bg-[#efeaff]"
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
      ) : (
        <ul className="space-y-3">
          {posts.map((post, i) => {
            const toneKey = /alert|weather|urgent/i.test(post.tag || post.message)
              ? "orange"
              : i % 2 === 0
                ? "green"
                : "blue"
            const tone = toneIcon[toneKey]
            const Icon = tone.Icon
            const href = post.key
              ? `/pio-tool/events/${post.eventId}/generate?key=${post.key}`
              : `/pio-tool/events/${post.eventId}`
            return (
              <li
                key={post.id}
                className="rounded-xl border border-[#e8eef8] bg-white p-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.wrap}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#9aa8c3]">
                      {post.postDate} · {post.timingLabel}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#405172]">{post.message}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[11px] font-bold text-[#047857]">
                        {post.tag || post.eventTitle}
                      </span>
                      <Link
                        href={href}
                        className="ml-auto inline-flex items-center rounded-lg border border-[#d4ccff] bg-[#f8f5ff] px-3 py-1.5 text-xs font-semibold text-[#6b4dff] transition hover:bg-[#efeaff]"
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
