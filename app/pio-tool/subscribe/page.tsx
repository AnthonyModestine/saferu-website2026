"use client"

import { useState } from "react"
import { Check, FileText, Sparkles, Download, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PRODUCTS } from "@/lib/products"
import { Checkout } from "@/components/checkout"

const features = [
  {
    icon: FileText,
    title: "Press Releases",
    description: "Turn incident details into a complete, professional statement. Organized, consistent, and ready for internal review before release.",
  },
  {
    icon: Sparkles,
    title: "Community Requests",
    description: "Create clear requests for community video or tips. Formatted for public platforms and aligned with Neighbors by Ring guidelines.",
  },
  {
    icon: Building2,
    title: "Built for Oversight",
    description: "Press Center supports your communication process—it does not replace it. Your team reviews, edits, and approves every message before it is shared.",
  },
  {
    icon: Download,
    title: "Ready to Share",
    description: "Download a branded PDF with your agency logo or copy the content directly into your existing workflow. No change to how your team operates.",
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
          <h1 className="text-2xl font-bold text-foreground">Complete Your Subscription</h1>
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
        <h1 className="text-3xl font-bold text-[#1a365d]">Confident Communication for Public Safety</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Press Center helps your agency turn key details into clear, structured public messaging—quickly and without disrupting your approval process.
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
          <CardDescription>Draft press releases and community requests using guided, structured input.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-foreground">
                ${monthlyPlan ? (monthlyPlan.priceInCents / 100).toFixed(0) : "20"}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">30 generations per month included</p>
          </div>

          <ul className="space-y-3 mx-auto max-w-sm">
            {[
              "Draft press releases and community requests from simple inputs",
              "Create posts for social media and community platforms",
              "Structured wording to support clear, consistent communication",
              "Professional tone aligned with official agency messaging",
              "Reduce time spent on first drafts so your team can focus on review and approval",
              "Export as a branded PDF or copy directly into your workflow",
              "Cancel anytime — no refunds on the current billing period",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1470AF]" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-[#f2b233] text-[#1a365d] hover:bg-[#e5a52e] font-semibold px-12"
              onClick={() => handleSubscribe("pio-tool-monthly")}
            >
              Get Started
            </Button>
          </div>


        </CardContent>
      </Card>

      {/* Trust */}
      <p className="text-center text-sm text-muted-foreground">
        Secure payment processing by Stripe. You may cancel anytime. All sales are final — no refunds on the current billing period.
      </p>
    </div>
  )
}
