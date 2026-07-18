"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, FileText, Zap, Shield, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTS } from "@/lib/products"
import { useMemberSession } from "@/lib/use-member-session"
import { useSubscription } from "@/lib/use-subscription"
import { startHostedCheckoutSession } from "@/app/actions/stripe"

const MONTHLY_PRODUCT = "pio-tool-monthly"

const features = [
  {
    icon: FileText,
    title: "Press Releases",
    description: "Turn key facts into a formal statement your leadership can review and approve. Organized, direct, and ready for release.",
  },
  {
    icon: Zap,
    title: "Video Requests",
    description: "Create clear video requests for active investigations — footage and tips formatted for social media and platforms like Neighbors by Ring.",
  },
  {
    icon: Shield,
    title: "Built for Oversight",
    description: "Press Center supports your communication process—it does not replace it. All messaging is reviewed and finalized by your team before distribution.",
  },
  {
    icon: Download,
    title: "Ready to Share",
    description: "Download a branded document or copy content directly into your existing workflow. Spanish translation is available when you need it.",
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const [redirectingToStripe, setRedirectingToStripe] = useState(false)

  const monthlyPlan = PRODUCTS.find((p) => p.id === "pio-tool-monthly")

  useEffect(() => {
    if (sessionLoading || subLoading) return
    if (isSubscribed) {
      router.replace("/pio-tool")
      return
    }
    if (!member) {
      const params = new URLSearchParams(window.location.search)
      const returnPath =
        params.get("checkout") === "1"
          ? "/pio-tool/subscribe?checkout=1"
          : "/pio-tool/subscribe"
      router.replace(
        `/sign-up?returnUrl=${encodeURIComponent(returnPath)}&pressCenter=1`
      )
    }
  }, [member, isSubscribed, sessionLoading, subLoading, router])

  useEffect(() => {
    if (sessionLoading || subLoading || isSubscribed || !member) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("checkout") !== "1") return

    let cancelled = false
    setRedirectingToStripe(true)
    startHostedCheckoutSession(MONTHLY_PRODUCT)
      .then((url) => {
        if (cancelled) return
        if (url) window.location.href = url
        else setRedirectingToStripe(false)
      })
      .catch(() => {
        if (!cancelled) setRedirectingToStripe(false)
      })

    return () => {
      cancelled = true
    }
  }, [member, isSubscribed, sessionLoading, subLoading])

  async function handleSubscribe() {
    setRedirectingToStripe(true)
    try {
      const url = await startHostedCheckoutSession(MONTHLY_PRODUCT)
      if (url) window.location.href = url
      else setRedirectingToStripe(false)
    } catch {
      setRedirectingToStripe(false)
    }
  }

  if (sessionLoading || subLoading || isSubscribed || !member || redirectingToStripe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1470AF] border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {redirectingToStripe ? "Redirecting to secure checkout…" : "Loading..."}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Upgrade to Press Center</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Signed in as {member.email}. Subscribe to unlock press release and video request drafting.
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1470AF]/10">
              <feature.icon className="h-5 w-5 text-[#1470AF]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Card */}
      <Card className="border-[#1470AF]/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Press Center</CardTitle>
          <CardDescription>Crimes, fires, accidents, and public-safety incidents — press releases, social posts, and video requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-foreground">
                ${monthlyPlan ? (monthlyPlan.priceInCents / 100).toFixed(0) : "30"}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mx-auto max-w-sm">
            {[
              "30 generations per month included",
              "Professional press releases drafted in minutes — not hours",
              "Facebook & X posts written and ready to copy",
              "Talking points so your spokesperson walks in prepared",
              "Branded PDF with your logo — send it the moment it's done",
              "Video requests drafted and ready to post",
              "One-click Spanish translation for incident messaging",
              "Cancel anytime — no contracts",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1470AF]" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-[#f2b233] text-[#1a365d] hover:bg-[#e5a52e] font-semibold px-12"
              onClick={handleSubscribe}
              disabled={redirectingToStripe}
            >
              Subscribe — $99/month
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust */}
      <p className="text-center text-sm text-muted-foreground">
        Cancel anytime. No contracts. Secure payment via Stripe.
      </p>
    </div>
  )
}
