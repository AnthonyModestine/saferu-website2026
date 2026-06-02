import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-background.jpg')" }}
      />
      {/* Light overlay for text readability */}
      <div className="absolute inset-0 bg-sky-100/30" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[#1a365d] sm:text-5xl lg:text-6xl">
            Your Trusted Partner in
          </h1>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-[#1a365d] sm:text-5xl lg:text-6xl">
            Public Safety Communications
          </h1>

          <p className="mt-6 max-w-3xl mx-auto text-xl font-semibold leading-snug text-[#1a365d] sm:text-2xl">
            Not every agency has a PIO. Now every agency can communicate like one.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#f2b233] text-[#1a365d] hover:bg-[#e5a52e] font-bold shadow-lg px-8 py-6 text-lg rounded-lg"
            >
              <Link href="/templates">
                Browse Content Library
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-[#1a365d] text-white hover:bg-[#1a365d]/90 font-bold shadow-lg px-8 py-6 text-lg rounded-lg"
            >
              <Link href="/pio-tool">
                Open Press Center
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Bottom wave shape */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60V30C240 0 480 0 720 15C960 30 1200 50 1440 30V60H0Z" fill="#f0f4f8"/>
        </svg>
      </div>
    </section>
  )
}
