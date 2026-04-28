"use client"

import Link from "next/link"
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
} from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"

export default function PIODashboardPage() {
  const { isSubscribed } = useSubscription()
  // In production, this would pull from the user's account
  const totalGenerations = 30
  const usedGenerations = 12
  const remainingGenerations = totalGenerations - usedGenerations
  const isOutOfGenerations = isSubscribed && remainingGenerations === 0

  return (
    <div className="space-y-10">
      {/* Subscribe CTA (non-subscribers only) - prominent yellow banner at top */}
      {!isSubscribed && (
        <div className="rounded-xl border border-[#1470AF]/20 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#1a365d] text-lg">Get started with Press Center</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              $20/month. Confident communication for public safety—draft press releases and community requests in minutes without compromising oversight.
            </p>
          </div>
          <Button
            asChild
            className="shrink-0 bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
          >
            <Link href="/pio-tool/subscribe">Subscribe Now</Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Press Center</h1>
        <p className="text-muted-foreground mt-1">
          Confident communication for public safety. Draft press releases and community requests with guided drafting.
        </p>
      </div>

      {/* ====== SUBSCRIBER VIEW ====== */}
      {isSubscribed && (
        <>

          {/* Out of Generations */}
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
                  <button type="button" className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors text-left">
                    <p className="text-sm font-medium text-foreground">5 generations</p>
                    <p className="text-sm font-semibold text-foreground">$10</p>
                  </button>
                  <button type="button" className="w-full flex items-center justify-between px-5 py-3 bg-[#1470AF]/5 hover:bg-[#1470AF]/10 transition-colors text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">12 generations</p>
                      <span className="text-[10px] font-semibold text-[#1470AF] bg-[#1470AF]/10 px-2 py-0.5 rounded-full">Most popular</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">$20</p>
                  </button>
                  <button type="button" className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors text-left">
                    <p className="text-sm font-medium text-foreground">35 generations</p>
                    <p className="text-sm font-semibold text-foreground">$50</p>
                  </button>
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
                <p className="font-semibold text-foreground">New Community Request</p>
                <p className="text-sm text-muted-foreground">Alerts and footage requests for social media and community platforms</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#4a9d6b] transition-colors" />
            </Link>
          </div>
        </>
      )}

      {/* ====== NON-SUBSCRIBER VIEW ====== */}
      {!isSubscribed && (
        <>
          {/* Feature Preview Cards */}
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
                <h2 className="font-semibold text-foreground">Community Request</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Clear social posts requesting community video or tips—built to follow Neighbors by Ring Community Guidelines when you publish on that platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ====== HOW IT WORKS (visible to everyone) ====== */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-6">How It Works</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1470AF]/10">
              <ClipboardList className="h-5 w-5 text-[#1470AF]" />
            </div>
            <h3 className="font-semibold text-foreground">1. Pick Your Format</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Choose a formal press release for media or a community request for social media and community platforms.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1470AF]/10">
              <PenLine className="h-5 w-5 text-[#1470AF]" />
            </div>
            <h3 className="font-semibold text-foreground">2. Answer a Few Questions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter the details—incident type, location, timeframe.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1470AF]/10">
              <Share2 className="h-5 w-5 text-[#1470AF]" />
            </div>
            <h3 className="font-semibold text-foreground">3. Export or Copy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Download a branded PDF that includes your agency logo, or copy community requests into your usual channels.
            </p>
          </div>
        </div>
      </div>


    </div>
  )
}
