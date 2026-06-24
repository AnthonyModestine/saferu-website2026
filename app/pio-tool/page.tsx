"use client"

import Link from "next/link"
import { useEffect, useState, Fragment } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Newspaper,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Loader2,
  Zap,
  Download,
  Languages,
  FileText,
  Mic,
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"
import { startHostedCheckoutSession } from "@/app/actions/stripe"

const MONTHLY_PRODUCT = "pio-tool-monthly"

interface GenerationStatus {
  used: number
  quota: number
  packs: number
  remaining: number
}

const oneGenerationOutputs = [
  { icon: FileText, label: "Formal press release" },
  { icon: Download, label: "Branded PDF with your agency logo" },
  { icon: MessageSquare, label: "Facebook post" },
  { icon: Zap, label: "X post" },
  { icon: Mic, label: "Spokesperson talking points" },
  { icon: MessageSquare, label: "Video request messaging" },
  { icon: Languages, label: "Spanish translation of Facebook post" },
]

const howItWorksSteps = [
  {
    step: "1",
    title: "Enter the facts",
    line: "Provide the basic incident details your team already collects.",
  },
  {
    step: "2",
    title: "Generate everything at once",
    line: "Press release, social media posts, talking points, community requests, and branded PDFs are created automatically from a single submission.",
  },
  {
    step: "3",
    title: "Review and publish",
    line: "Approve the content and share it with the media, your community, and internal stakeholders.",
  },
]

export default function PIODashboardPage() {
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const [genStatus, setGenStatus] = useState<GenerationStatus | null>(null)
  const [packLoading, setPackLoading] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!isSubscribed) return
    fetch("/api/pio/generations")
      .then((r) => r.json())
      .then((data) => {
        if (data.remaining !== undefined) setGenStatus(data)
      })
      .catch(() => {})
  }, [isSubscribed])

  const isOutOfGenerations = isSubscribed && genStatus !== null && genStatus.remaining === 0

  async function handleSubscribe() {
    if (sessionLoading || subLoading) return

    setCheckoutLoading(true)
    try {
      const url = await startHostedCheckoutSession(MONTHLY_PRODUCT)
      if (url) window.location.href = url
      else setCheckoutLoading(false)
    } catch {
      setCheckoutLoading(false)
    }
  }

  async function handlePackPurchase(productId: string) {
    setPackLoading(productId)
    try {
      const url = await startHostedCheckoutSession(productId)
      if (url) window.location.href = url
    } catch {
      setPackLoading(null)
    }
  }

  const packs = [
    { id: "generations-5", label: "5 generations", price: "$10" },
    { id: "generations-12", label: "12 generations", price: "$20", popular: true },
    { id: "generations-35", label: "35 generations", price: "$50" },
  ]

  function SubscribeButton({
    size = "default",
    className = "",
    children,
  }: {
    size?: "default" | "lg"
    className?: string
    children: React.ReactNode
  }) {
    return (
      <Button
        type="button"
        size={size}
        disabled={checkoutLoading || sessionLoading || subLoading}
        onClick={handleSubscribe}
        className={className}
      >
        {checkoutLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to checkout…
          </>
        ) : (
          children
        )}
      </Button>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      {isSubscribed ? (
        <>
          <div>
            <h1 className="text-2xl font-bold text-[#1a365d]">Press Center</h1>
            <p className="text-muted-foreground mt-1">
              Draft messaging for crimes, fires, traffic accidents, and public-safety incidents — press releases, social posts, and video requests.
            </p>
          </div>

          {genStatus && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Generations this month</p>
                <p className="text-sm font-semibold text-foreground">
                  {genStatus.used} / {genStatus.quota} used
                  {genStatus.packs > 0 && (
                    <span className="ml-2 text-[#1470AF]">+{genStatus.packs} extra</span>
                  )}
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    genStatus.used >= genStatus.quota ? "bg-red-500" : "bg-[#1470AF]"
                  }`}
                  style={{ width: `${Math.min(100, (genStatus.used / genStatus.quota) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {isOutOfGenerations && (
            <Card className="border-[#f2b233]/40 bg-[#f2b233]/5">
              <CardContent className="py-5 space-y-4">
                <div>
                  <p className="font-semibold text-foreground">{"You've used all your generations this month"}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generations reset next month, or add more now to keep going.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
                  {packs.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      disabled={packLoading !== null}
                      onClick={() => handlePackPurchase(pack.id)}
                      className={`w-full flex items-center justify-between px-5 py-3 transition-colors text-left disabled:opacity-60 ${
                        pack.popular
                          ? "bg-[#1470AF]/5 hover:bg-[#1470AF]/10"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{pack.label}</p>
                        {pack.popular && (
                          <span className="text-[10px] font-semibold text-[#1470AF] bg-[#1470AF]/10 px-2 py-0.5 rounded-full">
                            Most popular
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{pack.price}</p>
                        {packLoading === pack.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <WhenToUseSection />
          <HowItWorksSection />
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-[#1470AF]/25 bg-gradient-to-br from-[#1470AF]/10 via-card to-[#f2b233]/10 px-6 py-8 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1470AF] mb-3">
              Press Center
            </p>
            <h1 className="text-2xl font-bold text-[#1a365d] sm:text-3xl leading-tight">
              Your Next Press Release Shouldn&apos;t Take Hours.
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Enter the facts once. Press Center instantly creates your press release, social media
              posts, talking points, video requests, branded PDFs, and Spanish translations.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Built for public safety agencies that need to communicate quickly, professionally, and
              consistently—without dedicating hours to writing content.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <SubscribeButton
                size="lg"
                className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold shadow-sm"
              >
                {member ? "Subscribe — $30/month" : "Get started — $30/month"}
                {!checkoutLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </SubscribeButton>
              {!member && (
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in?returnUrl=%2Fpio-tool">Sign in</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">Cancel anytime</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#f2b233]/40 bg-[#f2b233]/5 p-6">
            <p className="text-sm font-bold uppercase tracking-wide text-[#1470AF]">
              One generation. Full package.
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#1a365d]">
              Everything below comes from a single press release generation
            </h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {oneGenerationOutputs.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-md border border-border/60 bg-card px-3 py-2.5"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-[#1470AF]" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <WhenToUseSection />
          <HowItWorksSection />

          <div className="flex justify-center">
            <SubscribeButton
              size="lg"
              className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold px-8"
            >
              {member ? "Subscribe — $30/month" : "Get started — $30/month"}
            </SubscribeButton>
          </div>
        </>
      )}
    </div>
  )
}

function WhenToUseSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/pio-tool/new"
        className="group flex items-start gap-4 rounded-xl border border-border p-5 transition-all hover:border-[#1470AF]/40 hover:bg-[#1470AF]/5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1470AF]/10">
          <Newspaper className="h-6 w-6 text-[#1470AF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">Press Release</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Formal media statement plus social posts, talking points, and a branded PDF.
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#1470AF] transition-colors" />
      </Link>

      <Link
        href="/pio-tool/community-post"
        className="group flex items-start gap-4 rounded-xl border border-border p-5 transition-all hover:border-[#4a9d6b]/40 hover:bg-[#4a9d6b]/5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4a9d6b]/10">
          <MessageSquare className="h-6 w-6 text-[#4a9d6b]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">Video Request</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Ask residents for doorbell or security camera footage during an active investigation.
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[#4a9d6b] transition-colors" />
      </Link>
    </div>
  )
}

function HowItWorksSection() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#1a365d]">How It Works</h2>
        <p className="text-sm font-medium text-[#1a365d] mt-1">
          One Incident. One Draft. Every Channel Covered.
        </p>
      </div>

      <HowItWorksRow />
    </div>
  )
}

function HowItWorksRow() {
  return (
    <div className="flex items-stretch">
      {howItWorksSteps.map((item, index) => (
        <Fragment key={item.step}>
          <div
            className={`flex flex-1 min-w-0 flex-col rounded-lg border p-4 ${
              item.step === "2"
                ? "border-[#f2b233]/50 bg-gradient-to-b from-[#f2b233]/10 to-card shadow-sm"
                : "border-[#1470AF]/15 bg-[#1470AF]/5"
            }`}
          >
            <span
              className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                item.step === "2"
                  ? "bg-[#f2b233] text-[#1a365d]"
                  : "bg-[#1470AF] text-white"
              }`}
            >
              {item.step}
            </span>
            <h3 className="text-sm font-bold text-[#1a365d] leading-snug">{item.title}</h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.line}</p>
          </div>
          {index < howItWorksSteps.length - 1 && (
            <div className="flex w-5 shrink-0 items-center justify-center">
              <ChevronRight className="h-4 w-4 text-[#1470AF]/40" aria-hidden />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  )
}
