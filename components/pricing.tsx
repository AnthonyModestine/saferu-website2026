import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export function Pricing() {
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
            Plans and Pricing
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Ready-to-share safety content, or add Press Center to draft press releases and community requests with confident, professional messaging.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Free - Content Library */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground">Free</h3>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 flex-1">
              {[
                "Full access to SaferU's curated content library",
                "Ready-to-share social media posts and graphics",
                "Coverage across seasonal safety topics and awareness campaigns",
                "Organized by topic so your team can quickly find what they need",
                "Regularly updated with new content",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#1470AF] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full mt-8 py-6 text-base font-semibold bg-transparent"
            >
              <Link href="/templates">Start Browsing</Link>
            </Button>
          </div>

          {/* Press Center - Premium */}
          <div className="rounded-2xl border-2 border-[#1470AF] bg-card p-8 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-[#1470AF] text-white text-xs font-semibold px-3 py-1 rounded-full">
                Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground">Press Center</h3>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold text-foreground">$30</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 flex-1">
              {[
                "AI-assisted drafting for press releases and community requests",
                "Structured, professional output based on your inputs",
                "Guidance aligned with public safety communication standards",
                "Export to branded PDF or copy into your workflow",
                "Translate messaging into Spanish for broader community reach",
                "Helps your team respond quickly during active incidents",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#1470AF] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              className="w-full mt-8 py-6 text-base font-semibold bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
            >
              <Link href="/pio-tool/subscribe">Select Plan</Link>
            </Button>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          Cancel anytime. No contracts. Secure payment via Stripe.
        </p>
      </div>
    </section>
  )
}
