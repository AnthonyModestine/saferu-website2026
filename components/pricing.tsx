"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Check, Flame, Sparkles } from "lucide-react"
import { CheckoutModal } from "@/components/checkout-modal"
import { VolunteerPricingModal } from "@/components/volunteer-pricing-modal"
import { useSubscription } from "@/lib/use-subscription"

type Billing = "monthly" | "annual"

const FREE_FEATURES = [
  "Access to the SaferU Content Library",
  "Ready-to-share safety captions",
  "Downloadable graphics",
  "New and seasonal content",
  "Crime prevention content",
  "Fire safety content",
  "Severe weather preparedness",
  "Disaster preparedness",
  "Community awareness content",
  "Free member account",
]

const PRESS_CENTER_FEATURES: { label: string; ai?: boolean }[] = [
  { label: "Up to three agency users" },
  { label: "100,000 AI tokens each month", ai: true },
  { label: "Press Release Generator", ai: true },
  { label: "Social media versions included with each press release" },
  { label: "Video Request Generator", ai: true },
  { label: "Community Event Campaigns" },
  { label: "AI Post Generator", ai: true },
  { label: "Sourced communication recommendations for your service area", ai: true },
  { label: "Agency profile and branding" },
  { label: "Saved drafts and communication history" },
  { label: "Ready-to-share captions" },
  { label: "Downloadable documents" },
  { label: "Full access to the SaferU Content Library" },
  { label: "Email support" },
]

const TOKEN_USES = [
  "Generates a press release package",
  "Creates a video request",
  "Generates an event campaign message",
  "Creates a post from an AI recommendation",
  "Regenerates a new version",
  "Processes the information needed to create the requested communication",
]

const TOKEN_NON_USES = [
  "Browsing the Content Library",
  "Viewing recommendation cards",
  "Viewing sources",
  "Editing an existing draft manually",
  "Saving content",
  "Copying content",
  "Downloading graphics",
  "Downloading generated documents",
  "Managing events",
  "Viewing saved history",
]

const FAQ_ITEMS = [
  {
    q: "What is included in the free membership?",
    a: "Free members can browse SaferU's public safety Content Library, copy ready-to-share captions, download graphics, and access new and seasonal safety content.",
  },
  {
    q: "What is an AI token?",
    a: "AI tokens are the units used when SaferU processes information and creates content. Longer or more complex communications use more tokens than shorter messages. Press Center includes 100,000 AI tokens each month.",
  },
  {
    q: "How many communications can I create?",
    a: "The number varies based on the length and complexity of each communication. A full press release package uses more tokens than a short community post. Your monthly allowance is designed to support regular agency communication across SaferU's creation tools.",
  },
  {
    q: "Does viewing AI Post Generator recommendations use tokens?",
    a: "No. Viewing recommendations and their sources does not use the agency's monthly AI allowance. Tokens are used when the agency asks SaferU to generate a message from the recommendation.",
  },
  {
    q: "Does editing or copying a message use tokens?",
    a: "No. Editing, saving, copying, and downloading existing content do not use AI tokens.",
  },
  {
    q: "What happens when we reach the monthly limit?",
    a: "The agency can continue using the Content Library, viewing recommendations, editing drafts, saving work, copying messages, and downloading content. New AI generations will become available again when the monthly allowance resets or when additional usage is purchased.",
  },
  {
    q: "Do unused tokens roll over?",
    a: "Included monthly tokens do not roll over. Additional token packages purchased separately remain available until used.",
  },
  {
    q: "Can more than one person use Press Center?",
    a: "Yes. The standard Press Center subscription includes up to three agency users.",
  },
  {
    q: "Do you offer volunteer agency pricing?",
    a: "Yes. Verified volunteer fire and EMS agencies receive 50% off. Subscribe at the standard rate, then submit a volunteer agency pricing request. Once approved, SaferU will refund 50% of the initial payment and apply the discounted rate to future renewals — $49.50/month or $499.50/year.",
  },
  {
    q: "Do annual subscribers receive a monthly token allowance?",
    a: "Yes. Annual subscriptions include 100,000 AI tokens each month.",
  },
  {
    q: "Can we pay by invoice or purchase order?",
    a: "Invoice and purchase-order billing may be available for annual subscriptions. Contact SaferU for assistance.",
  },
  {
    q: "Can we cancel at any time?",
    a: "Monthly subscriptions may be canceled before the next renewal. Annual subscriptions remain active through the end of the paid subscription period.",
  },
]

function FeatureItem({ label, ai }: { label: string; ai?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      {ai ? (
        <Sparkles className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#7C5CFC]" />
      ) : (
        <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#1470AF]" />
      )}
      <span className="text-sm leading-relaxed text-[#42536e]">{label}</span>
    </li>
  )
}

export function Pricing() {
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const [billing, setBilling] = useState<Billing>("monthly")

  const productId = billing === "annual" ? "pio-tool-annual" : "pio-tool-monthly"

  return (
    <>
      {/* Hero */}
      <section className="bg-background pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1470AF]">
            Simple, transparent pricing
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-[#1a365d] sm:text-5xl">
            Save time. Communicate professionally. Keep your community informed.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Start with free, ready-to-share public safety content. Upgrade to Press Center when
            your agency needs a faster way to create professional messages, plan communications,
            and know what may be worth sharing.
          </p>

          {/* Billing toggle */}
          <div className="mt-9 inline-flex items-center gap-3">
            <div className="inline-flex rounded-full border border-[#E2E8F5] bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  billing === "monthly"
                    ? "bg-[#1a365d] text-white"
                    : "text-[#42536e] hover:text-[#1a365d]"
                }`}
                aria-pressed={billing === "monthly"}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("annual")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  billing === "annual"
                    ? "bg-[#1a365d] text-white"
                    : "text-[#42536e] hover:text-[#1a365d]"
                }`}
                aria-pressed={billing === "annual"}
              >
                Annual
              </button>
            </div>
            <span className="rounded-full bg-[#F2B233]/15 px-3 py-1.5 text-xs font-bold text-[#8a6416]">
              Save $189 annually
            </span>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section id="plans" className="bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-2">
            {/* Free Membership */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-8">
              <h3 className="text-xl font-semibold text-[#1a365d]">Free Membership</h3>
              <div className="mt-4">
                <span className="text-5xl font-bold text-[#1a365d]">$0</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Trusted, ready-to-share public safety content for agencies and community partners.
              </p>

              <p className="mt-7 text-xs font-bold uppercase tracking-wider text-[#5c6b85]">
                Included
              </p>
              <ul className="mt-4 flex-1 space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <FeatureItem key={feature} label={feature} />
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="mt-8 w-full border-[#1470AF] py-6 font-semibold text-[#1470AF] hover:bg-[#1470AF]/5 hover:text-[#1470AF]"
              >
                <Link href="/templates">Browse Free Content</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                No credit card required.
              </p>
            </div>

            {/* Press Center */}
            <div className="relative flex flex-col rounded-2xl border-2 border-[#1470AF] bg-card p-8 shadow-xl shadow-[#1470AF]/10 lg:-my-4 lg:py-12">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[#F2B233] px-4 py-1 text-xs font-bold text-[#1a365d] shadow-sm">
                  {isSubscribed ? "Your plan" : "Most Popular"}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-[#1a365d]">Press Center</h3>
              <div className="mt-4">
                {billing === "annual" ? (
                  <>
                    <span className="text-5xl font-bold text-[#1a365d]">$999</span>
                    <span className="text-muted-foreground">/year</span>
                    <p className="mt-1.5 text-sm font-medium text-[#1470AF]">
                      Equivalent to $83.25 per month
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-bold text-[#1a365d]">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Save time, reduce the guesswork, and create professional agency communications
                without starting from scratch.
              </p>

              <p className="mt-7 text-xs font-bold uppercase tracking-wider text-[#5c6b85]">
                Included
              </p>
              <ul className="mt-4 flex-1 space-y-3">
                {PRESS_CENTER_FEATURES.map((feature) => (
                  <FeatureItem key={feature.label} label={feature.label} ai={feature.ai} />
                ))}
              </ul>

              <div className="mt-8">
                {subLoading ? (
                  <Button size="lg" className="w-full py-6" disabled>
                    Loading…
                  </Button>
                ) : isSubscribed ? (
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-[#1470AF] py-6 font-semibold text-white hover:bg-[#1470AF]/90"
                  >
                    <Link href="/pio-tool">Open Press Center</Link>
                  </Button>
                ) : (
                  <CheckoutModal
                    key={productId}
                    productId={productId}
                    label="Subscribe to Press Center"
                    className="w-full py-6 text-base font-semibold bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Volunteer agency callout */}
          <div className="mx-auto mt-14 max-w-6xl rounded-2xl bg-[#EAF1F8] p-8 sm:p-10">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Flame className="h-7 w-7 text-[#E07C3E]" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1a365d]">
                    Volunteer fire or EMS agency?
                  </h2>
                  <p className="mt-2 max-w-2xl leading-relaxed text-[#42536e]">
                    Subscribe at the standard rate, then request volunteer agency pricing. Once
                    approved, you&rsquo;ll receive a 50% refund on your initial payment and 50%
                    off future renewals.
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <VolunteerPricingModal />
              </div>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-muted-foreground">
            Cancel anytime. No contracts. Secure payment via Stripe.
          </p>
        </div>
      </section>

      {/* AI usage */}
      <section className="border-t border-[#E2E8F5] bg-[#F7FAFD] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
              Generous AI usage for everyday agency communication
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              Press Center includes 100,000 AI tokens each month for creating press releases,
              video requests, event messages, and community posts. The number of communications an
              agency can create depends on the length and complexity of each request.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E2E8F5] bg-white p-7">
              <h3 className="flex items-center gap-2.5 font-bold text-[#1a365d]">
                <Sparkles className="h-5 w-5 text-[#7C5CFC]" />
                What uses AI tokens
              </h3>
              <ul className="mt-5 space-y-3">
                {TOKEN_USES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#42536e]">
                    <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#7C5CFC]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E2E8F5] bg-white p-7">
              <h3 className="flex items-center gap-2.5 font-bold text-[#1a365d]">
                <Check className="h-5 w-5 text-[#4A9D6B]" />
                What does not use AI tokens
              </h3>
              <ul className="mt-5 space-y-3">
                {TOKEN_NON_USES.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#42536e]">
                    <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-[#4A9D6B]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
            Pricing FAQ
          </h2>
          <Accordion type="single" collapsible className="mt-10">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left font-semibold text-[#1a365d]">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="leading-relaxed text-[#42536e]">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-[#0B1B3A] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[380px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2B233]/10 blur-[130px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Give your agency a faster way to communicate.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#b8c7e0]">
            Create professional messages, share trusted safety content, and keep your community
            informed without adding more to your workload.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full rounded-xl bg-[#F2B233] px-9 py-7 text-lg font-bold text-[#1a365d] shadow-[0_8px_30px_rgba(242,178,51,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#ffc44d] sm:w-auto"
              onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}
            >
              View Press Center Plan
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-xl border-white/25 bg-white/5 px-9 py-7 text-lg font-semibold text-white backdrop-blur transition-colors hover:bg-white/10 hover:text-white sm:w-auto"
            >
              <Link href="/templates">Browse Free Content</Link>
            </Button>
          </div>
          <p className="mt-10 text-lg font-bold text-[#F2B233]">
            Better Communication Builds Safer Communities.
          </p>
        </div>
      </section>
    </>
  )
}
