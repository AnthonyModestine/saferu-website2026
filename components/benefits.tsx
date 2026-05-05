import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, BarChart3, Award, Handshake, ArrowRight } from "lucide-react"

const benefits = [
  {
    title: "Save Time",
    description: "Use ready-made posts and graphics so your team can share important information without starting from scratch.",
    icon: CheckCircle,
    iconBg: "bg-[#f2b233]",
    iconColor: "text-[#1a365d]",
  },
  {
    title: "Reach Your Community",
    description: "Deliver timely, relevant updates through the platforms your community already follows and trusts.",
    icon: BarChart3,
    iconBg: "bg-[#1470AF]",
    iconColor: "text-white",
  },
  {
    title: "Stay Professional",
    description: "Maintain clear, consistent messaging that meets the expectations of public safety communication.",
    icon: Award,
    iconBg: "bg-[#e07c3e]",
    iconColor: "text-white",
  },
  {
    title: "Inform & Protect",
    description: "Provide accurate information that helps your community stay informed, prepared, and safer.",
    icon: Handshake,
    iconBg: "bg-[#f2b233]",
    iconColor: "text-[#1a365d]",
  },
]

export function Benefits() {
  return (
    <section className="relative bg-gradient-to-b from-[#dae6f0] to-[#c5d8eb] py-16">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "url('/images/hero-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#dae6f0]/85 to-[#c5d8eb]/90" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
            Ready-to-Share Safety Content
          </h2>
          <p className="mt-4 text-lg text-[#4a5568]">
            Save time and resources with SaferU's FREE curated social media posts designed specifically for public safety agencies.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-xl bg-white/70 backdrop-blur-sm p-6 shadow-md border border-white/50"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${benefit.iconBg}`}
              >
                <benefit.icon className={`h-6 w-6 ${benefit.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-[#1a365d]">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-[#4a5568] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-bold shadow-lg px-8 py-6 text-lg rounded-lg"
          >
            <Link href="/member-site">
              Join SaferU for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
