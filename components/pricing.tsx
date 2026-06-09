"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { SignUpModal } from "@/components/sign-up-modal"
import { CheckoutModal } from "@/components/checkout-modal"
import { useMemberSession } from "@/lib/use-member-session"
import { useSubscription } from "@/lib/use-subscription"

export function Pricing() {
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const isLoading = sessionLoading || subLoading

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-[#1a365d] sm:text-5xl text-balance">
            {member && !isSubscribed ? "Upgrade to Press Center" : "Plans and Pricing"}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            {member && !isSubscribed
              ? `You're signed in as ${member.email}. Subscribe below to unlock Press Center.`
              : "Start free and get instant access to our content library. Add Press Center when you need to communicate faster and with more confidence."}
          </p>
        </div>

        <div
          className={`grid gap-8 mx-auto ${
            member ? "max-w-lg md:grid-cols-1" : "max-w-4xl md:grid-cols-2"
          }`}
        >
          {!member && (
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
              <div className="mb-2">
                <h3 className="text-xl font-semibold text-[#1a365d]">Free Member</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a free account and start using SaferU today.
                </p>
              </div>

              <div className="mb-8 mt-4">
                <span className="text-5xl font-bold text-[#1a365d]">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  "Exclusive access to What's New — updated every week",
                  "Full access to SaferU's curated content library",
                  "Ready-to-share social media posts and graphics",
                  "Coverage across seasonal safety topics and campaigns",
                  "Organized by topic for your whole team",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#1470AF] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {isLoading ? (
                <Button size="lg" className="w-full mt-8 py-6" disabled>
                  Loading…
                </Button>
              ) : (
                <SignUpModal />
              )}
            </div>
          )}

          <div className="rounded-2xl border-2 border-[#1470AF] bg-[#1470AF]/5 p-8 flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-[#1470AF] text-white text-xs font-semibold px-3 py-1 rounded-full">
                {isSubscribed ? "Your plan" : "Most Popular"}
              </span>
            </div>

            <div className="mb-2">
              <h3 className="text-xl font-semibold text-[#1a365d]">Press Center</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Everything you need to communicate with confidence during any incident.
              </p>
            </div>

            <div className="mb-8 mt-4">
              <span className="text-5xl font-bold text-[#1a365d]">$30</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <ul className="space-y-4 flex-1">
              {[
                "30 generations per month included",
                "Professional press releases drafted in minutes — not hours",
                "Facebook & X posts written and ready to copy",
                "Talking points so your spokesperson walks in prepared",
                "Branded PDF with your logo — send it the moment it's done",
                "Video requests drafted and ready to post",
                "One-click Spanish translation to reach every resident",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#1470AF] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {isLoading ? (
              <Button size="lg" className="w-full mt-8 py-6" disabled>
                Loading…
              </Button>
            ) : isSubscribed ? (
              <Button
                asChild
                size="lg"
                className="w-full mt-8 py-6 bg-[#1470AF] text-white hover:bg-[#1470AF]/90 font-semibold"
              >
                <Link href="/pio-tool">Open Press Center</Link>
              </Button>
            ) : member ? (
              <CheckoutModal label="Subscribe to Press Center — $30/month" />
            ) : (
              <CheckoutModal />
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Cancel anytime. No contracts. Secure payment via Stripe.
        </p>
      </div>
    </section>
  )
}
