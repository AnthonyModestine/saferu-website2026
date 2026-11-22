"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Check, X, Sparkles, RefreshCw, ExternalLink } from "lucide-react"
import type { WeeklyCampaign, WeeklyCampaignBatch } from "@/lib/weekly-campaigns/types"

const THEME_LABEL: Record<string, string> = {
  seasonal: "Seasonal",
  weather: "Weather",
  crime_trend: "Crime trend",
  holiday: "Holiday",
  community_safety: "Community safety",
}

export function WeeklyCampaignsClient() {
  const [batch, setBatch] = useState<WeeklyCampaignBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [planning, setPlanning] = useState(false)
  const [renderingId, setRenderingId] = useState<string | null>(null)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/admin/weekly-campaigns", { credentials: "same-origin" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not load campaigns")
      setBatch(data.latest || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const planWeek = async () => {
    setPlanning(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch("/api/admin/weekly-campaigns", {
        method: "POST",
        credentials: "same-origin",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not plan campaigns")
      setBatch(data.batch)
      setNotice("Campaign options are ready. Build graphics on each option, then YES or NO.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not plan campaigns")
    } finally {
      setPlanning(false)
    }
  }

  const buildGraphics = async (campaign: WeeklyCampaign) => {
    if (!batch) return
    setRenderingId(campaign.id)
    setError(null)
    setNotice(`Building SaferU graphics for “${campaign.title}”…`)
    try {
      let remaining = campaign.posts.length
      let current = batch
      while (remaining > 0) {
        const res = await fetch("/api/admin/weekly-campaigns/render", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: current.id, campaignId: campaign.id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || "Graphic render failed")
        current = data.batch as WeeklyCampaignBatch
        setBatch(current)
        remaining = Number(data.remaining ?? 0)
        if (!data.rendered) break
      }
      setNotice(`Graphics ready for “${campaign.title}”.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Graphic render failed")
      await load()
    } finally {
      setRenderingId(null)
    }
  }

  const decide = async (campaign: WeeklyCampaign, decision: "approve" | "reject") => {
    if (!batch) return
    setDecidingId(campaign.id)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch("/api/admin/weekly-campaigns/decide", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batch.id,
          campaignId: campaign.id,
          decision,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not save decision")
      setBatch(data.batch)
      if (decision === "approve" && data.articlePath) {
        setNotice(`Published to What's New.`)
      } else {
        setNotice("Campaign rejected.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save decision")
    } finally {
      setDecidingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Safety Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate 2–3 timely SaferU campaigns (seasonal, weather, crime trends). Build
            graphics with the SaferU logo, then YES to publish into What&apos;s New.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={planning || Boolean(renderingId)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => void planWeek()} disabled={planning || Boolean(renderingId)}>
            {planning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate this week&apos;s options
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </div>
      )}

      {!batch ? (
        <Card>
          <CardHeader>
            <CardTitle>No campaigns yet</CardTitle>
            <CardDescription>
              Click “Generate this week&apos;s options” to draft 2–3 campaign choices for review.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-gray-900">{batch.weekLabel}</span>
            <Badge variant="secondary">{batch.status}</Badge>
            <span>Created {new Date(batch.createdAt).toLocaleString()}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-1 xl:grid-cols-1">
            {batch.campaigns.map((campaign) => {
              const readyCount = campaign.posts.filter((p) => p.status === "ready").length
              const total = campaign.posts.length
              const canApprove = campaign.status === "ready"
              const busy = renderingId === campaign.id || decidingId === campaign.id
              return (
                <Card key={campaign.id} className="overflow-hidden">
                  <CardHeader className="space-y-3 border-b bg-slate-50/80">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-xl">{campaign.title}</CardTitle>
                          <Badge>{THEME_LABEL[campaign.theme] || campaign.theme}</Badge>
                          <Badge variant="outline">{campaign.status}</Badge>
                        </div>
                        <CardDescription className="max-w-3xl text-sm leading-relaxed">
                          {campaign.summary}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Why this week:</span> {campaign.whyThisWeek}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(campaign.status === "pending_graphics" ||
                          campaign.status === "ready" ||
                          campaign.posts.some((p) => p.status === "failed")) &&
                          campaign.status !== "approved" &&
                          campaign.status !== "rejected" && (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => void buildGraphics(campaign)}
                            >
                              {renderingId === campaign.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                              )}
                              {readyCount === total ? "Rebuild graphics" : `Build graphics (${readyCount}/${total})`}
                            </Button>
                          )}
                        {campaign.status !== "approved" && campaign.status !== "rejected" && (
                          <>
                            <Button
                              disabled={!canApprove || busy}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => void decide(campaign, "approve")}
                            >
                              {decidingId === campaign.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              YES — publish to What&apos;s New
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={busy}
                              onClick={() => void decide(campaign, "reject")}
                            >
                              <X className="mr-2 h-4 w-4" />
                              NO
                            </Button>
                          </>
                        )}
                        {campaign.publishedArticleId && (
                          <Button asChild variant="secondary">
                            <Link href={`/whats-new/${campaign.publishedArticleId}`} target="_blank">
                              View article <ExternalLink className="ml-2 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {campaign.posts.map((post) => (
                        <div
                          key={post.id}
                          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                        >
                          <div className="relative aspect-video bg-slate-100">
                            {post.imageUrl ? (
                              <Image
                                src={post.imageUrl}
                                alt={post.headline}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                {post.status === "rendering"
                                  ? "Rendering…"
                                  : post.status === "failed"
                                    ? "Failed"
                                    : "Waiting for graphic"}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">{post.headline}</p>
                              <Badge variant="outline" className="shrink-0 text-[10px]">
                                {post.status}
                              </Badge>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">{post.message}</p>
                            <p className="border-t pt-2 text-[11px] leading-relaxed text-slate-500">
                              <span className="font-semibold text-slate-700">Caption:</span> {post.caption}
                            </p>
                            {post.error && (
                              <p className="text-[11px] text-red-600">{post.error}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
