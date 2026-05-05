import Link from "next/link"
import { ShieldCheck, Star, Flame, Lock } from "lucide-react"

const categories = [
  {
    title: "Crime Prevention",
    description:
      "Advice on crime prevention, suspicious activity, and security tips.",
    href: "/crime-prevention",
    icon: ShieldCheck,
    iconBg: "bg-[#1470AF]",
    iconColor: "text-white",
    membersOnly: false,
  },
  {
    title: "What's New",
    description:
      "Seasonal alerts, trending topics, and timely updates.",
    href: "/whats-new",
    icon: Star,
    iconBg: "bg-[#f2b233]",
    iconColor: "text-[#1a365d]",
    membersOnly: true,
  },
  {
    title: "Fire Prevention",
    description:
      "Safety tips on fire prevention, smoke alarms, and escape planning.",
    href: "/fire-prevention",
    icon: Flame,
    iconBg: "bg-[#e07c3e]",
    iconColor: "text-white",
    membersOnly: false,
  },
]

export function Categories() {
  return (
    <section className="relative bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] py-20">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "url('/images/hero-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f0f4f8]/80 to-[#dae6f0]/90" />
      
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
            Browse Our Content Library
          </h2>
          <p className="mt-4 text-lg text-[#4a5568]">
            Browse content by topic and quickly find the right message for your community.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group flex flex-col items-center text-center rounded-2xl bg-white/90 backdrop-blur-sm p-8 shadow-md border border-white/50 transition-all hover:shadow-lg hover:-translate-y-1"
            >
              {/* Rounded square icon */}
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-xl ${category.iconBg} transition-transform group-hover:scale-105`}
              >
                <category.icon className={`h-8 w-8 ${category.iconColor}`} />
              </div>
              
              {/* Title with members badge */}
              <div className="mt-5 flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#1a365d]">
                  {category.title}
                </h3>
                {category.membersOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1470AF]/10 px-2 py-0.5 text-xs font-medium text-[#1470AF]">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
              </div>
              
              {/* Description */}
              <p className="mt-3 text-sm text-[#4a5568] leading-relaxed">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
