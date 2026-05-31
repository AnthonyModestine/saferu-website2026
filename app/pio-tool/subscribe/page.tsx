"use client"

import { useState } from "react"
import { Check, FileText, Zap, Shield, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTS } from "@/lib/products"
import { Checkout } from "@/components/checkout"

const features = [
  {
    icon: FileText,
    title: "Press Releases",
    description: "Turn key facts into a formal statement your leadership can review and approve. Organized, direct, and ready for release.",
  },
  {
    icon: Zap,
    title: "Community Requests",
    description: "Create clear, compliant requests for community assistance, including video and tips, aligned with platform guidelines such as Neighbors by Ring.",
  },
  {
    icon: Shield,
    title: "Built for Oversight",
    description: "Press Center supports your communication process—it does not replace it. All messaging is reviewed and finalized by your team before distribution.",
  },
  {
    icon: Download,
    title: "Ready to Share",
    description: "Download a branded document or copy content directly into your existing workflow. Messaging can also be translated into Spanish to better reach your entire community.",
  },
]

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  const monthlyPlan = PRODUCTS.find((p) => p.id === "pio-tool-monthly")

  const handleSubscribe = (productId: string) => {
    setSelectedPlan(productId)
    setShowCheckout(true)
  }

  if (showCheckout && selectedPlan) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a365d]">Complete Your Subscription</h1>
          <p className="mt-2 text-muted-foreground">
            Secure checkout powered by Stripe
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Checkout productId={selectedPlan} />
          </CardContent>
        </Card>
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => {
              setShowCheckout(false)
              setSelectedPlan(null)
            }}
          >
            Back to plans
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1a365d]">Communicate with Confidence</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Press Center helps your agency turn incident details into clear, professional public messaging — in minutes, not hours.
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
          <CardDescription>Everything you need to communicate with confidence during any incident.</CardDescription>
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
              "Community footage requests drafted and ready to post",
              "One-click Spanish translation to reach every resident",
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
              onClick={() => handleSubscribe("pio-tool-monthly")}
            >
              Get Press Center
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
