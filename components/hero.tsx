import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, FileText, Video, CalendarDays } from "lucide-react"

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
            {/* Glow behind the frame */}
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[#2563EB]/25 via-transparent to-[#7C5CFC]/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-[#E2E8F5] bg-[#F7F9FC] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                <span className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-[10px] font-medium text-[#5c6b85] ring-1 ring-[#E2E8F5]">
                  saferu.com/press-center
                </span>
              </div>

              <div className="flex">
                {/* Sidebar */}
                <div className="hidden w-[150px] shrink-0 flex-col bg-[#0B1B3A] p-3 md:flex">
                  <p className="text-[8px] font-bold tracking-widest text-[#8fa3c2]">SAFERU</p>
                  <p className="text-[10px] font-black tracking-wide text-white">PRESS CENTER</p>
                  <span className="mt-3 rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-center text-[9px] font-bold text-white">
                    + Create New
                  </span>
                  <div className="mt-3 space-y-1">
                    <span className="block rounded-md bg-white/10 px-2 py-1.5 text-[9px] font-bold text-white">
                      Dashboard
                    </span>
                    {[
                      "Press Release",
                      "Video Request",
                      "Community Events",
                      "AI Post Generator",
                      "Saved Content",
                      "Templates",
                      "Events",
                    ].map((item) => (
                      <span
                        key={item}
                        className={`block px-2 py-1.5 text-[9px] font-medium ${
                          item === "AI Post Generator" ? "text-[#c4b5fd]" : "text-white/50"
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workspace */}
                <div className="flex-1 bg-[#EEF2F8] p-4">
                  <p className="text-sm font-black text-[#0F1C3F]">Good morning, Chief!</p>
                  <p className="text-[9px] font-medium text-[#5c6b85]">
                    Let&rsquo;s keep our community informed and safe.
                  </p>

                  {/* Create New cards */}
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { label: "Press Release", icon: FileText, tone: "bg-[#2563EB]" },
                      { label: "Video Request", icon: Video, tone: "bg-[#7C5CFC]" },
                      { label: "Community Event", icon: CalendarDays, tone: "bg-[#4A9D6B]" },
                      { label: "AI Post Generator", icon: Sparkles, tone: "bg-[#F2B233]" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[#E2E8F5] bg-white p-2 shadow-sm"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg ${item.tone}`}
                        >
                          <item.icon
                            className={`h-3.5 w-3.5 ${
                              item.tone === "bg-[#F2B233]" ? "text-[#1A365D]" : "text-white"
                            }`}
                          />
                        </span>
                        <p className="mt-1.5 text-[8px] font-bold leading-tight text-[#0F1C3F]">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* AI Post Generator banner */}
                  <div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#0F1C3F] to-[#5a3fd4] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[7px] font-bold uppercase tracking-[0.25em] text-[#c4b5fd]">
                          Today for your area
                        </p>
                        <p className="text-[11px] font-black text-white">AI Post Generator</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-bold text-[#0F1C3F]">
                        Open generator →
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <span className="rounded-lg bg-white/10 px-2 py-1.5 text-[8px] font-semibold leading-snug text-white">
                        <Sparkles className="mr-1 inline h-2.5 w-2.5 text-[#F2B233]" />
                        Never Leave Children or Pets in a Hot Vehicle
                      </span>
                      <span className="rounded-lg bg-white/10 px-2 py-1.5 text-[8px] font-semibold leading-snug text-white">
                        <Sparkles className="mr-1 inline h-2.5 w-2.5 text-[#F2B233]" />9 PM Routine
                        — Lock Up Tonight
                      </span>
                    </div>
                  </div>

                  {/* Events + Posts */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
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
                          text: "Free smoke alarms this Saturday at the Community Center.",
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
