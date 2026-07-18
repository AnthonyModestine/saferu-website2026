import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FileText,
  Video,
  CalendarDays,
  Sparkles,
  Images,
  Bell,
  CheckCircle,
} from "lucide-react"

export const metadata = {
  title: "About - SaferU",
  description:
    "SaferU is a public safety content and communications platform built for police, sheriffs, fire, EMS, emergency management, and local government agencies.",
}

const AGENCY_TYPES = [
  "Police",
  "Sheriff's Office",
  "State Police",
  "Fire",
  "EMS",
  "Emergency Management",
  "City / County Government",
]

const PRESS_CENTER_POINTS = [
  "Draft press releases with social posts, talking points, and Spanish versions",
  "Request doorbell and dash camera footage with privacy-safe locations",
  "Plan event campaigns with messages before, during, and after each event",
  "Get sourced post recommendations for your service area",
]

const CONTENT_POINTS = [
  "Ready-to-share graphics and captions, free to every agency",
  "Crime prevention, fire safety, severe weather, disasters, and community awareness",
  "New curated What's New content every week for members",
  "Built to match how residents actually consume safety information",
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero: clean editorial opening */}
        <section className="border-b border-[#E2E8F5] bg-white">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <span className="block h-1 w-16 rounded-full bg-[#F2B233]" aria-hidden="true" />
            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-[#5c6b85]">
              About SaferU
            </p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-tight tracking-tight text-[#1A365D] sm:text-5xl">
              Built for the people behind the message
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#42536e] sm:text-xl">
              SaferU pairs ready-to-share safety content with communication tools built for public
              safety — helping agencies keep their communities informed without adding to their
              workload.
            </p>
          </div>
        </section>

        {/* Mission: asymmetric editorial split */}
        <section className="bg-gradient-to-b from-[#F0F4F8] to-[#DAE6F0] py-16 sm:py-20">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[200px_1fr] lg:gap-14 lg:px-8">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A365D]">
                Our Mission
              </h2>
              <span className="mt-4 block h-1 w-12 rounded-full bg-[#F2B233]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-semibold leading-relaxed text-[#1A365D] sm:text-2xl">
                Public safety agencies are expected to communicate quickly and clearly, but many
                teams do not have the time or staffing to manage that process well.
              </p>
              <p className="mt-6 text-lg leading-relaxed text-[#42536e]">
                Some have a dedicated Public Information Officer. Others rely on a chief, officer,
                firefighter, emergency manager, or administrative employee who is already balancing
                several responsibilities.
              </p>
              <blockquote className="mt-6 border-l-[3px] border-[#F2B233] pl-5 text-lg font-semibold leading-relaxed text-[#1A365D]">
                Not every agency has a Public Information Officer. SaferU gives every department
                the tools to communicate like one.
              </blockquote>
              <p className="mt-6 text-lg leading-relaxed text-[#42536e]">
                That belief shapes everything we build — practical tools and ready-to-use content
                that help departments keep their communities informed and prepared.
              </p>
            </div>
          </div>
        </section>

        {/* Who we serve: navy band */}
        <section className="relative overflow-hidden bg-[#0B1B3A] py-14 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Who We Serve
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#b8c7e0] sm:text-lg">
                SaferU is built for Public Information Officers, chiefs, and anyone responsible for
                keeping the community informed — especially teams with limited staff or
                communication resources.
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-2.5 lg:justify-end">
              {AGENCY_TYPES.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* What SaferU does: asymmetric 12-col cards */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <h2 className="text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl">
                What SaferU Does
              </h2>
              <span
                className="mb-2 hidden h-1 flex-1 max-w-48 rounded-full bg-[#F2B233] sm:block"
                aria-hidden="true"
              />
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl lg:col-span-7">
                <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#2563EB] to-[#4d84f5] px-7 py-3.5">
                  <FileText className="h-5 w-5 text-white" />
                  <p className="text-sm font-bold uppercase tracking-wide text-white">
                    Press Center
                  </p>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-3">
                    {[
                      { icon: FileText, tone: "bg-[#2563EB]" },
                      { icon: Video, tone: "bg-[#E07C3E]" },
                      { icon: CalendarDays, tone: "bg-[#4A9D6B]" },
                      { icon: Sparkles, tone: "bg-[#7C5CFC]" },
                    ].map((item, i) => (
                      <span
                        key={i}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.tone} shadow-md`}
                      >
                        <item.icon className="h-5 w-5 text-white" />
                      </span>
                    ))}
                  </div>
                  <p className="mt-5 text-base leading-relaxed text-[#5c6b85]">
                    A focused workspace that turns incidents, events, and community updates into
                    professional communications quickly and confidently.
                  </p>
                  <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {PRESS_CENTER_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-[#42536e]">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl lg:col-span-5">
                <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#1470AF] to-[#3b8ec9] px-7 py-3.5">
                  <Images className="h-5 w-5 text-white" />
                  <p className="text-sm font-bold uppercase tracking-wide text-white">
                    Curated Safety Content
                  </p>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1470AF] shadow-md">
                      <Images className="h-5 w-5 text-white" />
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2B233] shadow-md">
                      <Bell className="h-5 w-5 text-[#1A365D]" />
                    </span>
                  </div>
                  <p className="mt-5 text-base leading-relaxed text-[#5c6b85]">
                    Hundreds of agencies already use SaferU&rsquo;s curated graphics and
                    ready-to-share captions to keep their communities informed year-round.
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {CONTENT_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-sm text-[#42536e]">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#1470AF]" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Brand moment + CTA */}
        <section className="relative overflow-hidden bg-[#0B1B3A] py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute left-1/2 top-1/2 h-[380px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2B233]/10 blur-[130px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Better Communication Builds{" "}
              <span className="text-[#F2B233]">Safer Communities.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#b8c7e0]">
              Clear, consistent communication helps residents prepare, prevent incidents,
              understand local risks, and build trust in the agencies that serve them.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
        </section>
      </main>
      <Footer />
    </div>
  )
}
