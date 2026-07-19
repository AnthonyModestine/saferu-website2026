import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  FileText,
  Video,
  CalendarDays,
  Shield,
  Plus,
  LayoutDashboard,
  Bookmark,
  Calendar,
} from "lucide-react"

/**
 * Homepage hero — dark statement section per SAFERU-UI-UX.md §11.
 * Right side: a published community post (the outcome) surrounded by the
 * four Press Center tools that produced it.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0B1B3A]">
      {/* Depth: soft glows + faint grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[#1470AF]/25 blur-[140px]" />
        <div className="absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-[#7C5CFC]/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[500px] rounded-full bg-[#F2B233]/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Left: message */}
          <div>
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]">
              Public Safety Communication{" "}
              <span className="text-[#F2B233]">Made Easier</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#b8c7e0] sm:text-xl">
              Not every agency has a Public Information Officer. SaferU gives every department the
              tools to communicate like one.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-[#F2B233] px-9 py-7 text-lg font-bold text-[#1A365D] shadow-[0_8px_30px_rgba(242,178,51,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffc44d]"
              >
                <Link href="/pio-tool">Explore Press Center</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-white/25 bg-white/5 px-9 py-7 text-lg font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 hover:text-white"
              >
                <Link href="/templates">Browse Free Safety Content</Link>
              </Button>
            </div>
          </div>

          {/* Right: faithful miniature of the real Press Center dashboard */}
          <div className="relative mx-auto hidden w-full max-w-2xl sm:block" aria-hidden="true">
            {/* Layered glow behind the card */}
            <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-[#2563EB]/30 via-[#7C5CFC]/15 to-[#F2B233]/15 blur-3xl" />
            <div className="absolute -inset-2 rounded-[1.75rem] bg-gradient-to-br from-white/15 via-transparent to-white/5 blur-md" />

            <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/25">
              <div className="flex">
                {/* Sidebar — mirrors the real Press Center sidebar */}
                <div className="hidden w-[158px] shrink-0 flex-col bg-[#0B1B3A] p-2.5 md:flex">
                  {/* Logo */}
                  <div className="flex items-center gap-1.5 px-1 pb-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#2563EB]">
                      <Shield className="h-3 w-3 text-white" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[6px] font-semibold tracking-[0.14em] text-[#93A4C7]">
                        SAFERU
                      </span>
                      <span className="block text-[8px] font-bold tracking-wide text-white">
                        PRESS CENTER
                      </span>
                    </span>
                  </div>

                  {/* Create New */}
                  <span className="flex items-center justify-center gap-1 rounded-lg bg-[#2563EB] px-2 py-1.5 text-[8px] font-semibold text-white shadow-md shadow-[#2563EB]/30">
                    <Plus className="h-2.5 w-2.5" />
                    Create New
                  </span>

                  {/* Dashboard (active) */}
                  <span className="mt-2 flex items-start gap-1.5 rounded-lg bg-white/15 px-1.5 py-1.5 ring-1 ring-white/25">
                    <LayoutDashboard className="mt-px h-3 w-3 shrink-0 text-white" />
                    <span className="leading-tight">
                      <span className="block text-[8px] font-semibold text-white">Dashboard</span>
                      <span className="block text-[6px] leading-snug text-[#94A3B8]">
                        What to communicate today
                      </span>
                    </span>
                  </span>

                  {/* Create section */}
                  <p className="mt-2.5 px-1.5 text-[6px] font-bold uppercase tracking-[0.16em] text-[#7B8BB0]">
                    Create
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {[
                      { label: "Press Release", icon: FileText, accent: "text-[#3B82F6]" },
                      { label: "Video Request", icon: Video, accent: "text-[#7C5CFC]" },
                      { label: "Community Events", icon: CalendarDays, accent: "text-[#10B981]" },
                      { label: "AI Post Generator", icon: Sparkles, accent: "text-[#F59E0B]" },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1"
                      >
                        <item.icon className={`h-3 w-3 shrink-0 ${item.accent}`} />
                        <span className="text-[8px] font-semibold text-[#E8EEF9]">
                          {item.label}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* AI Assistant section */}
                  <p className="mt-2.5 px-1.5 text-[6px] font-bold uppercase tracking-[0.16em] text-[#7B8BB0]">
                    AI Assistant
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {[
                      { label: "Saved Content", icon: Bookmark },
                      { label: "Templates", icon: CalendarDays },
                      { label: "Events", icon: Calendar },
                    ].map((item) => (
                      <span
                        key={item.label}
                        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1"
                      >
                        <item.icon className="h-3 w-3 shrink-0 text-[#93A4C7]" />
                        <span className="text-[8px] font-semibold text-[#E8EEF9]">
                          {item.label}
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Footer: agency + user */}
                  <div className="mt-auto space-y-1 border-t border-white/10 pt-1.5">
                    <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-1.5 py-1">
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-[#1e90ff]/25">
                        <Shield className="h-2 w-2 text-[#7ec8ff]" />
                      </span>
                      <span className="truncate text-[6px] font-medium text-[#d7e0f7]">
                        Demo Township Police Dept.
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 px-1.5 py-0.5">
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C5CFC] text-[5px] font-bold text-white">
                        CT
                      </span>
                      <span className="leading-tight">
                        <span className="block text-[7px] font-semibold text-white">Chief T.</span>
                        <span className="block text-[5px] text-[#9fb0d9]">PIO Admin</span>
                      </span>
                    </span>
                  </div>
                </div>

                {/* Workspace */}
                <div className="flex-1 bg-[#EEF2F8] p-4">
                  {/* Daily briefing hero */}
                  <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#0B1B3A] via-[#12275c] to-[#3b1d80] p-3">
                    <p className="text-[6px] font-bold uppercase tracking-[0.25em] text-[#93C5FD]">
                      Daily Briefing
                    </p>
                    <p className="mt-0.5 text-[12px] font-black text-white">Good morning, Chief!</p>
                    <p className="text-[8px] font-medium text-[#BFDBFE]">
                      3 posts ready and 2 events coming up — here&rsquo;s your day.
                    </p>

                    {/* Briefing stats */}
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <span className="rounded-lg border border-white/10 bg-white/[0.08] px-1.5 py-1 text-[7px] font-semibold leading-snug text-[#BFDBFE]">
                        <span className="text-[10px] font-black text-white">3</span> posts ready
                        today
                      </span>
                      <span className="rounded-lg border border-white/10 bg-white/[0.08] px-1.5 py-1 text-[7px] font-semibold leading-snug text-[#BFDBFE]">
                        <span className="text-[10px] font-black text-white">2</span> events in 2
                        weeks
                      </span>
                      <span className="rounded-lg border border-[#F2B233]/40 bg-[#F2B233]/10 px-1.5 py-1 text-[7px] font-semibold leading-snug text-[#ffe3a8]">
                        <span className="text-[10px] font-black text-[#F2B233]">3</span> AI
                        recommendations
                      </span>
                    </div>

                    {/* Today for your area */}
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-[0.15em] text-[#93C5FD]">
                        <Sparkles className="h-2.5 w-2.5 text-[#F2B233]" />
                        Today for your area
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[7px] font-bold text-[#0F1C3F]">
                        See 3 recommendations →
                      </span>
                    </div>
                  </div>

                  {/* Quick create tiles */}
                  <div className="mt-2.5">
                    <p className="text-[6px] font-bold uppercase tracking-[0.2em] text-[#667795]">
                      Quick create
                    </p>
                    <div className="mt-1 grid grid-cols-4 gap-1.5">
                      {[
                        { label: "Press Release", icon: FileText, tone: "bg-[#3B82F6]" },
                        { label: "Video Request", icon: Video, tone: "bg-[#7C5CFC]" },
                        { label: "Community Event", icon: CalendarDays, tone: "bg-[#10B981]" },
                        { label: "AI Post Generator", icon: Sparkles, tone: "bg-[#F59E0B]" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F5] bg-white p-1.5 shadow-sm"
                        >
                          <span
                            className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md ${item.tone} p-1`}
                          >
                            <item.icon className="h-2.5 w-2.5 text-white" />
                          </span>
                          <p className="text-[7px] font-bold leading-tight text-[#0F1C3F]">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Events + Posts */}
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#E2E8F5] bg-white p-2.5 shadow-sm">
                      <p className="text-[9px] font-black text-[#0F1C3F]">Upcoming Events</p>
                      {[
                        { date: "MAY 25", title: "Coffee with the Chief", chip: "12 days away" },
                        { date: "MAY 26", title: "Smoke Alarm Install Day", chip: "13 days away" },
                        { date: "OCT 10", title: "National Night Out", chip: "89 days away" },
                      ].map((event) => (
                        <div
                          key={event.title}
                          className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-[#F7F9FC] p-1.5"
                        >
                          <span className="rounded-md bg-[#1A365D] px-1.5 py-1 text-center text-[6px] font-black leading-tight text-[#F2B233]">
                            {event.date}
                          </span>
                          <p className="flex-1 text-[8px] font-bold leading-tight text-[#0F1C3F]">
                            {event.title}
                          </p>
                          <span className="rounded-full bg-[#4A9D6B]/10 px-1.5 py-0.5 text-[6px] font-bold text-[#3d8259]">
                            {event.chip}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[#E2E8F5] bg-white p-2.5 shadow-sm">
                      <p className="text-[9px] font-black text-[#0F1C3F]">Posts to Share</p>
                      {[
                        {
                          time: "9:00 AM",
                          text: "Join us tonight at Central Park Pavilion for National Night Out!",
                        },
                        {
                          time: "11:30 AM",
                          text: "Free smoke alarms May 26 at the Community Center.",
                        },
                        {
                          time: "2:00 PM",
                          text: "Coffee with the Chief is this week — swing by Station 1.",
                        },
                      ].map((post) => (
                        <div key={post.time} className="mt-1.5 rounded-lg bg-[#F7F9FC] p-1.5">
                          <p className="text-[6px] font-bold text-[#2563EB]">{post.time}</p>
                          <p className="text-[8px] font-semibold leading-tight text-[#0F1C3F]">
                            {post.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" aria-hidden="true" />
    </section>
  )
}
