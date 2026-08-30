import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  FileText,
  Video,
  CalendarDays,
  Facebook,
  BadgeCheck,
  Shield,
} from "lucide-react"

/**
 * Homepage hero — dark statement section per SAFERU-UI-UX.md §11.
 * Right side: the outcome agencies publish (graphic + message), not the app dashboard.
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

          {/* Right: published outcome — graphic + social post + tool hints */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-xl" aria-hidden="true">
            <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-[#2563EB]/30 via-[#7C5CFC]/15 to-[#F2B233]/15 blur-3xl" />

            {/* Tool chips — what created this, not a dashboard */}
            <div className="relative mb-4 flex flex-wrap justify-center gap-2 sm:justify-end">
              {[
                { label: "Press Release", icon: FileText, tone: "bg-[#2563EB]/90" },
                { label: "Graphic Studio", icon: Sparkles, tone: "bg-[#F59E0B]/90" },
                { label: "Video Request", icon: Video, tone: "bg-[#7C5CFC]/90" },
                { label: "Events", icon: CalendarDays, tone: "bg-[#10B981]/90" },
              ].map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 rounded-full ${item.tone} px-3 py-1.5 text-[11px] font-bold text-white shadow-lg ring-1 ring-white/20`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </span>
              ))}
            </div>

            {/* 16:9 safety graphic mock */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#C2410C] via-[#EA580C] to-[#9A3412] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.65)] ring-1 ring-white/25">
              <div className="aspect-video p-5 sm:p-6">
                <div className="flex h-full gap-4">
                  {/* Copy — inset from edges */}
                  <div className="flex w-[46%] flex-col justify-center">
                    <p className="text-[11px] font-black uppercase leading-tight tracking-wide text-white sm:text-sm lg:text-base">
                      Put Out Grease Fires Safely
                    </p>
                    <p className="mt-2 text-[8px] font-semibold leading-snug text-white/90 sm:text-[10px]">
                      Use a lid or baking soda — never water.
                    </p>
                    <p className="mt-2 text-[7px] font-medium leading-snug text-white/75 sm:text-[9px]">
                      If the fire spreads, evacuate and call 911.
                    </p>
                  </div>

                  {/* Illustration */}
                  <div className="relative flex flex-1 items-end justify-center pb-1">
                    <div className="relative h-[70%] w-[75%]">
                      <div className="absolute bottom-0 left-1/2 h-3 w-[85%] -translate-x-1/2 rounded-sm bg-[#1c1917]/80" />
                      <div className="absolute bottom-3 left-1/2 h-[55%] w-[70%] -translate-x-1/2 rounded-full bg-gradient-to-t from-[#FBBF24] via-[#F97316] to-[#FDE68A] opacity-95" />
                      <div className="absolute bottom-[38%] right-[8%] h-[28%] w-[38%] rotate-12 rounded-full border-4 border-[#D1D5DB] bg-[#E5E7EB]/90 shadow-md" />
                    </div>
                  </div>
                </div>

                {/* Agency logo — bottom right */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 shadow-md">
                  <Image
                    src="/images/maplewood-fire-patch.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <span className="hidden text-[7px] font-bold leading-tight text-[#0F1C3F] sm:block">
                    Maplewood
                    <br />
                    Fire Dept.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/15 bg-black/20 px-4 py-2">
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white/80">
                  <Sparkles className="h-3 w-3 text-[#FDE68A]" />
                  Graphic Studio
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-[#86EFAC]">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Ready to post
                </span>
              </div>
            </div>

            {/* Facebook post — the paired message */}
            <div className="relative z-10 mx-4 -mt-6 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-white/30 sm:mx-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2]">
                  <Facebook className="h-5 w-5 fill-white text-white" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#0F1C3F]">Maplewood Fire Department</p>
                  <p className="text-[10px] font-medium text-[#64748B]">Community post · Just now</p>
                </div>
                <Shield className="ml-auto h-4 w-4 text-[#4A9D6B]" />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[#334155] sm:text-xs">
                Kitchen grease fires can spread in seconds. If a pan catches fire, slide a lid over it
                and turn off the heat — never use water. We&rsquo;re sharing this reminder so every
                household knows what to do before an emergency happens.
              </p>
              <div className="mt-3 flex items-center gap-2 border-t border-[#E2E8F5] pt-3">
                <span className="rounded-lg bg-[#2563EB]/10 px-2.5 py-1 text-[10px] font-bold text-[#2563EB]">
                  Copy post
                </span>
                <span className="text-[10px] font-semibold text-[#64748B]">
                  Graphic + message, paired
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" aria-hidden="true" />
    </section>
  )
}
