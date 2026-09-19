import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

/**
 * Homepage hero — full-bleed desk panorama behind existing copy.
 * Section size matches the original compact hero; image framing stays zoomed out.
 */
export function Hero() {
  return (
    <section className="relative min-h-[520px] overflow-hidden bg-[#0B1B3A] h-[min(56.25vw,640px)]">
      {/* Full-bleed image — edge to edge left/right */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/hero-saferu-desk.jpg"
          alt=""
          fill
          priority
          quality={100}
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Keep copy readable on the left; let the desk scene show across the panorama */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B3A] via-[#0B1B3A]/88 to-[#0B1B3A]/20 sm:via-[#0B1B3A]/80 sm:to-[#0B1B3A]/10 lg:via-[#0B1B3A]/75 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A]/40 via-transparent to-[#0B1B3A]/20" />
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl lg:max-w-[42%]">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            <span className="block">Public Safety</span>
            <span className="block">Communication</span>
            <span className="block text-[#F2B233]">Made Easier</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#b8c7e0] sm:text-xl">
            Not every agency has a Public Information Officer. SaferU gives every department the
            tools to communicate like one.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
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
              className="rounded-xl border-2 border-white bg-white px-9 py-7 text-lg font-bold text-[#0B1B3A] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5 hover:bg-[#E8EEF9] hover:text-[#0B1B3A]"
            >
              <Link href="/templates">Browse Free Safety Content</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" aria-hidden="true" />
    </section>
  )
}
