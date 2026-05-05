import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Zap, Shield, Download, ArrowRight } from "lucide-react"

const features = [
  {
    title: "Press Releases",
    description: "Turn key facts into a formal statement your leadership can review and approve. Organized, direct, and ready for release.",
    icon: FileText,
  },
  {
    title: "Community Requests",
    description: "Create clear, compliant requests for community assistance, including video and tips, aligned with platform guidelines such as Neighbors by Ring.",
    icon: Zap,
  },
  {
    title: "Built for Oversight",
    description: "Press Center supports your communication process—it does not replace it. All messaging is reviewed and finalized by your team before distribution.",
    icon: Shield,
  },
  {
    title: "Ready to Share",
    description: "Download a branded document or copy content directly into your existing workflow. Messaging can also be translated into Spanish to better reach your entire community.",
    icon: Download,
  },
]

export function PIOToolSection() {
  return (
    <section className="relative bg-[#1a365d] py-20">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Structured Communication When It Matters Most
            </h2>
            <p className="mt-4 text-xl text-[#a0c4e8]">
              Press Center
            </p>
            <p className="mt-6 text-lg text-[#c5d8eb] leading-relaxed">
              Press Center helps agencies draft clear, structured public messaging in minutes — without compromising oversight or professionalism.
            </p>
            <p className="mt-4 text-lg text-[#c5d8eb] leading-relaxed">
              Whether preparing a press release or a community request, Press Center provides guided drafting with consistent tone and structured language designed for public safety communication.
            </p>
            
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-bold shadow-lg px-8 py-6 text-lg rounded-lg"
              >
                <Link href="/pio-tool">
                  Open Press Center
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8 py-6 text-lg rounded-lg"
              >
                <Link href="/pricing">
                  See Pricing
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white/10 backdrop-blur-sm p-6 border border-white/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#f2b233]">
                  <feature.icon className="h-6 w-6 text-[#1a365d]" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-[#a0c4e8] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
