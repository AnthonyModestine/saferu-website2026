"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Newspaper,
  MessageSquare,
  ArrowRight,
  ClipboardList,
  PenLine,
  Share2,
  Loader2,
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"
import { startHostedCheckoutSession } from "@/app/actions/stripe"

interface GenerationStatus {
  used: number
  quota: number
  packs: number
  remaining: number
}

export default function PIODashboardPage() {
  const { member } = useMemberSession()
  const { isSubscribed } = useSubscription()
  const [genStatus, setGenStatus] = useState<GenerationStatus | null>(null)
  const [packLoading, setPackLoading] = useState<string | null>(null)

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

  return (
    <div className="space-y-10">
      {/* Subscribe CTA (non-subscribers only) */}
      {!isSubscribed && (
        <div className="rounded-xl border border-[#1470AF]/20 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#1a365d] text-lg">
              {member ? "Upgrade to Press Center" : "Get started with Press Center"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {member
                ? "You're signed in with a free account. Subscribe to unlock press release and video request drafting for crimes, fires, and accidents."
                : "$30/month. Draft press releases and video requests for crimes, fires, accidents, and public-safety incidents — without compromising oversight."}
            </p>
          </div>
          <Button asChild className="shrink-0 bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold">
            <Link href={member ? "/pio-tool/subscribe" : "/pricing"}>
              {member ? "Subscribe Now" : "See plans"}
            </Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a365d]">Press Center</h1>
        <p className="text-muted-foreground mt-1">
          Draft messaging for crimes, fires, traffic accidents, and public-safety incidents — press releases, social posts, and video requests.
        </p>
      </div>

      {/* ====== SUBSCRIBER VIEW ====== */}
      {isSubscribed && (
        <>
          {/* Generation usage bar */}
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

          {/* Out of Generations — buy a pack */}
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

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/pio-tool/new"
              className="group flex items-center gap-4 rounded-xl border border-border p-5 transition-all hover:border-[#1470AF]/40 hover:bg-[#1470AF]/5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1470AF]/10">
                <Newspaper className="h-6 w-6 text-[#1470AF]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">New Press Release</p>
                <p className="text-sm text-muted-foreground">Formal statements for media—consistent structure and tone</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#1470AF] transition-colors" />
            </Link>
            <Link
              href="/pio-tool/community-post"
              className="group flex items-center gap-4 rounded-xl border border-border p-5 transition-all hover:border-[#4a9d6b]/40 hover:bg-[#4a9d6b]/5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#4a9d6b]/10">
                <MessageSquare className="h-6 w-6 text-[#4a9d6b]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">New Video Request</p>
                <p className="text-sm text-muted-foreground">Footage requests for active investigations</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#4a9d6b] transition-colors" />
            </Link>
          </div>
        </>
      )}

      {/* ====== NON-SUBSCRIBER VIEW ====== */}
      {!isSubscribed && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1470AF]/10">
                <Newspaper className="h-5 w-5 text-[#1470AF]" />
              </div>
              <h2 className="font-semibold text-foreground">Press Release</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Draft formal media statements from the facts you enter. Structured format. Professional tone. Ready for internal review before release.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4a9d6b]/10">
                <MessageSquare className="h-5 w-5 text-[#4a9d6b]" />
              </div>
              <h2 className="font-semibold text-foreground">Video Request</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Request security camera or doorbell footage that may help investigators — formatted for social media, Neighbors by Ring, and your usual channels.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====== HOW IT WORKS (everyone) ====== */}
      <div className="pb-10">
        <h2 className="text-lg font-semibold text-[#1a365d] mb-6">How It Works</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1470AF]/10">
              <ClipboardList className="h-5 w-5 text-[#1470AF]" />
            </div>
            <h3 className="font-semibold text-[#1a365d]">1. Pick Your Format</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Choose a formal press release for media or a video request to solicit footage for an active investigation.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1470AF]/10">
              <PenLine className="h-5 w-5 text-[#1470AF]" />
            </div>
            <h3 className="font-semibold text-[#1a365d]">2. Answer a Few Questions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter the details—incident type, location, timeframe.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1470AF]/10">
              <Share2 className="h-5 w-5 text-[#1470AF]" />
            </div>
            <h3 className="font-semibold text-[#1a365d]">3. Export or Copy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Download a branded PDF that includes your agency logo, or copy video requests into your usual channels.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
