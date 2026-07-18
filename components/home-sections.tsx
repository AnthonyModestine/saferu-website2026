import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Lightbulb,
  PenLine,
  Images,
  ShieldCheck,
  Star,
  Flame,
  Quote,
  Sparkles,
  CalendarClock,
  BookmarkCheck,
  FileText,
  Video,
  CalendarDays,
  Facebook,
  BadgeCheck,
  Lock,
  Copy,
  Download,
  Bell,
  ArrowRight,
} from "lucide-react"

/**
 * Homepage sections 2–10 per SAFERU-UI-UX.md §11.
 * Section 1 (hero) lives in components/hero.tsx.
 * Visual direction: PulsePoint-style color blocking and immediacy with SaferU identity.
 */

const AGENCY_TYPES = [
  "Police",
  "Sheriff's Office",
  "State Police",
  "Fire",
  "EMS",
  "Emergency Management",
  "City / County Government",
]

/** Section 2 — trusted by the people handling communications. */
export function TrustedBy() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-balance text-2xl font-bold text-[#1A365D] sm:text-3xl">
          For the people who keep their agencies communicating and their communities informed.
        </p>
        <ul className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {AGENCY_TYPES.map((label) => (
            <li
              key={label}
              className="rounded-full border border-[#1A365D]/15 bg-[#F0F4F8] px-5 py-2.5 text-sm font-semibold text-[#1A365D] transition-colors hover:border-[#1470AF]/40 hover:bg-[#1470AF]/5"
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const OUTCOMES = [
  {
    title: "Know what to communicate",
    description:
      "Surface timely communication opportunities that matter to your agency and community.",
    icon: Lightbulb,
    tile: "bg-[#7C5CFC]",
    bar: "bg-[#7C5CFC]",
  },
  {
    title: "Create professional messages",
    description: "Turn rough information into clear, agency-ready communication.",
    icon: PenLine,
    tile: "bg-[#2563EB]",
    bar: "bg-[#2563EB]",
  },
  {
    title: "Share trusted safety content",
    description: "Find ready-to-use graphics and captions without starting from scratch.",
    icon: Images,
    tile: "bg-[#F2B233]",
    bar: "bg-[#F2B233]",
  },
]

/** Section 3 — Three core outcomes. */
export function CoreOutcomes() {
  return (
    <section className="bg-gradient-to-b from-[#F0F4F8] to-[#DAE6F0] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl lg:text-5xl">
            Everything your agency needs to communicate with confidence
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#42536e]">
            From knowing what to say, to creating it, to sharing it — SaferU supports the entire
            communication workflow in one focused workspace.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {OUTCOMES.map((outcome) => (
            <div
              key={outcome.title}
              className="group relative overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <span className={`absolute inset-x-0 top-0 h-1 ${outcome.bar}`} />
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${outcome.tile} shadow-md transition-transform group-hover:scale-105`}
              >
                <outcome.icon
                  className={`h-7 w-7 ${outcome.tile === "bg-[#F2B233]" ? "text-[#1A365D]" : "text-white"}`}
                />
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#0F1C3F] sm:text-2xl">
                {outcome.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[#5c6b85]">
                {outcome.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PRESS_CENTER_TOOLS = [
  {
    label: "Press Releases",
    detail: "Turn incident details into a polished release with platform-ready social posts.",
    icon: FileText,
    tone: "bg-[#2563EB]",
  },
  {
    label: "Video Requests",
    detail: "Create clear, targeted footage requests while protecting sensitive information.",
    icon: Video,
    tone: "bg-[#E07C3E]",
  },
  {
    label: "Event Campaigns",
    detail: "Build coordinated messages for before, during, and after each event.",
    icon: CalendarDays,
    tone: "bg-[#4A9D6B]",
  },
  {
    label: "AI Post Generator",
    detail: "Get sourced, locally relevant post recommendations for your service area.",
    icon: Sparkles,
    tone: "bg-[#7C5CFC]",
  },
]

/** Section 4 — Press Center: generated press release showcase (dark color block). */
export function PressCenterPreview() {
  return (
    <section className="relative overflow-hidden bg-[#0B1B3A] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-40 -top-32 h-[420px] w-[420px] rounded-full bg-[#2563EB]/20 blur-[130px]" />
        <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[#7C5CFC]/15 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* Left: message + tool list */}
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#8fa3c2]">
              Press Center
            </p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Your agency&rsquo;s communications workspace
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#b8c7e0]">
              Turn incidents, events, and community updates into professional communications quickly
              and confidently.
            </p>

            <ul className="mt-9 space-y-4">
              {PRESS_CENTER_TOOLS.map((tool) => (
                <li key={tool.label} className="flex items-start gap-4">
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.tone} shadow-md`}
                  >
                    <tool.icon
                      className={`h-5 w-5 ${tool.tone === "bg-[#F2B233]" ? "text-[#1A365D]" : "text-white"}`}
                    />
                  </span>
                  <div>
                    <p className="font-bold text-white">{tool.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[#b8c7e0]">{tool.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              className="mt-10 rounded-xl bg-[#F2B233] px-9 py-7 text-lg font-bold text-[#1A365D] shadow-[0_8px_30px_rgba(242,178,51,0.3)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffc44d]"
            >
              <Link href="/pio-tool">Explore Press Center</Link>
            </Button>
          </div>

          {/* Right: a generated press release with its platform outputs */}
          <div className="relative mx-auto hidden w-full max-w-xl sm:block" aria-hidden="true">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[#2563EB]/25 via-transparent to-[#7C5CFC]/20 blur-3xl" />

            {/* Main document */}
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
              {/* Output tabs — mirrors the real generated-results screen */}
              <div className="flex items-center gap-1.5 border-b border-[#E2E8F5] bg-[#F7F9FC] px-4 py-2.5">
                {["Press Release", "Facebook", "X", "Talking Points", "Español"].map((tab, i) => (
                  <span
                    key={tab}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      i === 0
                        ? "bg-white text-[#1D4ED8] shadow-sm ring-1 ring-[#E2E8F5]"
                        : "text-[#5c6b85]"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              <div className="px-7 py-6">
                {/* Letterhead */}
                <div className="flex items-center gap-3 border-b-2 border-[#1A365D] pb-4">
                  <Image
                    src="/images/maplewood-fire-patch.png"
                    alt="Maplewood Fire Department patch"
                    width={56}
                    height={56}
                    className="h-12 w-12 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-black tracking-wide text-[#0F1C3F]">
                      MAPLEWOOD FIRE DEPARTMENT
                    </p>
                    <p className="text-[10px] font-semibold text-[#5c6b85]">
                      Office of Public Information · Maplewood, PA
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB]">
                    For Immediate Release
                  </p>
                  <p className="text-[10px] font-semibold text-[#5c6b85]">
                    July 17, 2026 · Incident #2026-0417
                  </p>
                </div>

                <p className="mt-3 text-base font-bold leading-snug text-[#0F1C3F]">
                  Cause of Maple Avenue Structure Fire Under Investigation
                </p>

                <div className="mt-3 space-y-2">
                  <p className="text-[11px] leading-relaxed text-[#42536e]">
                    <span className="font-bold text-[#0F1C3F]">MAPLEWOOD, PA —</span> The Maplewood
                    Fire Department, in coordination with the County Fire Marshal&rsquo;s Office, is
                    investigating the cause of Thursday night&rsquo;s structure fire in the 400
                    block of Maple Avenue. No injuries were reported.
                  </p>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded bg-[#EEF2F8]" />
                    <div className="h-2 w-11/12 rounded bg-[#EEF2F8]" />
                    <div className="h-2 w-full rounded bg-[#EEF2F8]" />
                    <div className="h-2 w-3/5 rounded bg-[#EEF2F8]" />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 border-t border-[#E2E8F5] pt-4">
                  <span className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-1.5 text-[10px] font-bold text-white">
                    <Copy className="h-3 w-3" />
                    Copy
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F5] px-3 py-1.5 text-[10px] font-bold text-[#42536e]">
                    <Download className="h-3 w-3" />
                    Download Document
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-[#4A9D6B]">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Ready to share
                  </span>
                </div>
              </div>
            </div>

            {/* Floating output: Facebook post */}
            <div className="absolute -bottom-10 -left-8 z-10 w-[240px] -rotate-2 rounded-2xl bg-white p-3.5 shadow-2xl ring-1 ring-white/25">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2]">
                  <Facebook className="h-4 w-4 fill-white text-white" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-[#0F1C3F]">Facebook Post</p>
                  <p className="text-[8px] font-semibold text-[#5c6b85]">Generated from release</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#42536e]">
                Last night&rsquo;s fire in the 400 block of Maple Ave. is under investigation. No
                injuries were reported. If you saw anything or have camera footage, please reach
                out…
              </p>
              <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#2563EB]/10 px-2 py-1 text-[9px] font-bold text-[#2563EB]">
                <Copy className="h-2.5 w-2.5" />
                Copy Facebook Post
              </span>
            </div>

            {/* Floating output: X post */}
            <div className="absolute -right-6 -top-8 z-10 w-[220px] rotate-2 rounded-2xl bg-white p-3.5 shadow-2xl ring-1 ring-white/25">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-sm font-black text-white">
                  𝕏
                </span>
                <div>
                  <p className="text-[10px] font-bold text-[#0F1C3F]">X Post</p>
                  <p className="text-[8px] font-semibold text-[#5c6b85]">Under 280 characters</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-[#42536e]">
                UPDATE: Cause of the Maple Ave. structure fire is under investigation with the Fire
                Marshal&rsquo;s Office. No injuries reported.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const AGENCY_FEEDBACK = [
  "Communications is only one part of my job. SaferU helps me create polished, professional content without needing hours of writing time or a dedicated communications staff.",
  "Instead of posting only when something happens, SaferU helps us share preventative information and stay connected with residents throughout the year.",
  "We already had the incident information. What took time was turning it into something the public could understand. SaferU now handles that process in a fraction of the time.",
  "We\u2019re a volunteer department with limited time and resources, but our community still expects timely, professional communication. SaferU helps us deliver that without adding another major workload.",
]

/** Section 5 — Agency feedback. */
export function AgencyFeedback() {
  return (
    <section className="bg-[#F0F4F8] py-14 sm:py-[72px]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl">
            Why Agencies Choose SaferU
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-[#42536e]">
            Real experiences from the professionals keeping their communities informed.
          </p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {AGENCY_FEEDBACK.map((quote) => (
            <figure
              key={quote}
              className="flex items-start gap-3.5 rounded-xl border border-[#E2E8F5] border-l-[3px] border-l-[#F2B233] bg-white p-5 shadow-sm"
            >
              <Quote
                className="mt-0.5 h-4 w-4 shrink-0 fill-[#F2B233] text-[#F2B233]"
                aria-hidden="true"
              />
              <blockquote className="text-[15px] font-medium leading-snug text-[#1A365D]">
                {quote}
              </blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

const BRIEFING_CARDS = [
  {
    state: "Recommended today",
    stateChip: "bg-[#7C5CFC] text-white",
    stateIcon: Sparkles,
    eyebrow: "Crime Prevention",
    eyebrowTone: "text-[#E07C3E]",
    headline: "Vehicle break-ins reported in your area this week",
    timing: "Post this evening before residents park for the night.",
    why: "Remind residents to lock up and remove valuables — and to share doorbell footage that could help your investigation.",
    source: "Based on: Your agency's recent incident reports",
  },
  {
    state: "Plan ahead",
    stateChip: "bg-[#2563EB] text-white",
    stateIcon: CalendarClock,
    eyebrow: "Back to School",
    eyebrowTone: "text-[#2563EB]",
    headline: "School zones reopen Monday, August 24",
    timing: "Schedule for the weekend before.",
    why: "Drivers need a reminder about buses, crosswalks, and reduced speed zones.",
    source: "Issued by: School district calendar",
  },
  {
    state: "Optional safety post",
    stateChip: "bg-[#4A9D6B] text-white",
    stateIcon: BookmarkCheck,
    eyebrow: "Fire Safety",
    eyebrowTone: "text-[#4A9D6B]",
    headline: "Monthly smoke alarm check — a 30-second habit",
    timing: "Optional this week.",
    why: "Working smoke alarms sharply cut home fire deaths. A monthly test keeps them ready.",
    source: "From the SaferU safety library",
  },
]

/** Section 6 — AI Post Generator (dark color block). */
export function AiPostGeneratorSection() {
  return (
    <section className="relative overflow-hidden bg-[#0F1C3F] py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#7C5CFC]/20 blur-[140px]" />
        <div className="absolute -left-32 bottom-0 h-[320px] w-[320px] rounded-full bg-[#2563EB]/15 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#7C5CFC] px-4 py-1.5 text-sm font-bold text-white shadow-[0_6px_20px_rgba(124,92,252,0.35)]">
            <Sparkles className="h-4 w-4" />
            AI Post Generator
          </p>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Know What&rsquo;s Worth Sharing
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#b8c7e0] sm:text-xl">
            SaferU reviews relevant public information and turns the strongest opportunities into
            clear recommendations for your agency.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {BRIEFING_CARDS.map((card) => (
            <div
              key={card.state}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1.5"
            >
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${card.stateChip}`}
              >
                <card.stateIcon className="h-3.5 w-3.5" />
                {card.state}
              </span>
              <p
                className={`mt-4 text-[11px] font-bold uppercase tracking-widest ${card.eyebrowTone}`}
              >
                {card.eyebrow}
              </p>
              <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#0F1C3F]">
                {card.headline}
              </h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]">
                <CalendarClock className="h-4 w-4 shrink-0" />
                {card.timing}
              </p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5c6b85]">{card.why}</p>
              <p className="mt-3 text-xs font-medium text-[#5c6b85]">{card.source}</p>
              <div className="mt-4 flex items-center border-t border-[#E2E8F5] pt-4">
                <span className="rounded-lg bg-[#7C5CFC] px-3.5 py-1.5 text-xs font-bold text-white">
                  Use This Post
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-[#7C5CFC] px-9 py-7 text-lg font-bold text-white shadow-[0_8px_30px_rgba(124,92,252,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#8d70ff]"
          >
            <Link href="/pio-tool/ideas">See Today&rsquo;s Recommendations</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/** Section 7 — Free curated library and weekly member content. */
export function ContentLibrarySection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-28">
      <div className="pointer-events-none absolute -left-48 top-20 h-96 w-96 rounded-full bg-[#1470AF]/10 blur-[120px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#1470AF]/10 px-4 py-1.5 text-sm font-bold text-[#1470AF]">
              <Images className="h-4 w-4" />
              Curated Safety Content
            </p>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl lg:text-5xl">
              Professional safety content—without starting from scratch.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#42536e]">
              Hundreds of agencies already use SaferU&rsquo;s curated graphics and ready-to-share
              captions for free. Browse practical content for crime prevention, fire safety, severe
              weather, disasters, and community awareness.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Crime Prevention",
                "Fire Safety",
                "Weather",
                "Natural Disasters",
                "Community Awareness",
              ].map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-[#E2E8F5] bg-[#F0F4F8] px-3 py-1.5 text-xs font-bold text-[#42536e]"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-xl bg-[#1470AF] px-8 py-6 text-base font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#125f95]"
              >
                <Link href="/templates">Browse Free Safety Content</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-[#1470AF]/30 px-8 py-6 text-base font-bold text-[#1470AF]"
              >
                <Link href="/sign-up?returnUrl=%2Fwhats-new">Create Free Account</Link>
              </Button>
            </div>
          </div>

          {/* Real-world content previews */}
          <div className="relative min-h-[520px]" aria-hidden="true">
            <div className="absolute inset-8 rounded-[2rem] bg-gradient-to-br from-[#DAE6F0] via-[#F0F4F8] to-[#F5F3FF]" />

            <div className="absolute left-0 top-8 z-10 w-[48%] -rotate-3 overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-[#1A365D] to-[#1470AF]">
                <ShieldCheck className="absolute -right-6 -top-6 h-28 w-28 text-white/10" />
                <div className="px-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F2B233]">
                    Crime Prevention
                  </p>
                  <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                    Lock it.
                    <br />
                    Take it.
                    <br />
                    Keep it.
                  </p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-[#0F1C3F]">Prevent vehicle break-ins</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5c6b85]">
                  Remove valuables, lock your doors, and never leave keys inside.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="flex items-center gap-1 rounded-md bg-[#EEF2F8] px-2 py-1 text-[9px] font-bold text-[#1470AF]">
                    <Copy className="h-3 w-3" /> Copy Caption
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-[#EEF2F8] px-2 py-1 text-[9px] font-bold text-[#1470AF]">
                    <Download className="h-3 w-3" /> Download
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-2 z-20 w-[48%] rotate-3 overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-[#E07C3E] to-[#C44D4D]">
                <Flame className="absolute -bottom-8 -left-5 h-32 w-32 text-white/10" />
                <div className="px-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
                    Fire Safety
                  </p>
                  <p className="mt-2 text-xl font-black uppercase leading-tight text-white">
                    Close before
                    <br />
                    you doze.
                  </p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-[#0F1C3F]">A closed door can slow a fire</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5c6b85]">
                  Make closing bedroom doors part of your family&rsquo;s nighttime routine.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="flex items-center gap-1 rounded-md bg-[#EEF2F8] px-2 py-1 text-[9px] font-bold text-[#1470AF]">
                    <Copy className="h-3 w-3" /> Copy Caption
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-[#EEF2F8] px-2 py-1 text-[9px] font-bold text-[#1470AF]">
                    <Download className="h-3 w-3" /> Download
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-[18%] z-30 w-[64%] overflow-hidden rounded-2xl border border-[#F2B233]/40 bg-[#0B1B3A] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-white">
                  <Star className="h-4 w-4 fill-[#F2B233] text-[#F2B233]" />
                  What&rsquo;s New
                </p>
                <span className="flex items-center gap-1 rounded-full bg-[#F2B233] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#1A365D]">
                  <Lock className="h-3 w-3" /> Members
                </span>
              </div>
              <div className="p-5">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F2B233]">
                  <Bell className="h-3.5 w-3.5" /> New curated content every week
                </p>
                <p className="mt-2 text-lg font-bold leading-snug text-white">
                  Timely graphics and captions based on current events.
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#b8c7e0]">
                  Seasonal safety, emerging scams, major weather, awareness campaigns, and topics
                  communities are talking about now.
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#F2B233]">
                  Free membership unlocks access <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Section 9 — Mission. */
export function Mission() {
  return (
    <section className="relative overflow-hidden bg-[#0B1B3A] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2B233]/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Better Communication Builds{" "}
          <span className="text-[#F2B233]">Safer Communities.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-[#b8c7e0] sm:text-xl">
          Clear, consistent communication helps residents prepare, prevent incidents, understand
          local risks, and build trust in the agencies that serve them.
        </p>
      </div>
    </section>
  )
}
