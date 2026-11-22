import "server-only"

import { generateSafetyGraphic } from "@/lib/graphic-studio/generate"
import { generateSafetySocialCaption } from "@/lib/graphic-studio/social-caption"
import { storeGraphicStudioImageFromDataUrl } from "@/lib/graphic-studio/store-image"
import {
  getWeeklyCampaignBatch,
  saveWeeklyCampaignBatch,
} from "@/lib/weekly-campaigns/store"
import { SAFERU_CAMPAIGN_LOGO_PATH } from "@/lib/weekly-campaigns/types"
import type { WeeklyCampaignBatch } from "@/lib/weekly-campaigns/types"

function refreshCampaignStatus(batch: WeeklyCampaignBatch, campaignId: string): void {
  const campaign = batch.campaigns.find((c) => c.id === campaignId)
  if (!campaign) return
  if (campaign.status === "approved" || campaign.status === "rejected") return
  const allReady = campaign.posts.every((p) => p.status === "ready" && p.imageUrl)
  const anyFailed = campaign.posts.some((p) => p.status === "failed")
  if (allReady) campaign.status = "ready"
  else if (anyFailed) campaign.status = "pending_graphics"
  else campaign.status = "pending_graphics"
}

export async function renderWeeklyCampaignPost(opts: {
  batchId: string
  campaignId: string
  postId: string
}): Promise<WeeklyCampaignBatch> {
  const batch = await getWeeklyCampaignBatch(opts.batchId)
  if (!batch) throw new Error("Campaign batch not found")

  const campaign = batch.campaigns.find((c) => c.id === opts.campaignId)
  if (!campaign) throw new Error("Campaign not found")
  if (campaign.status === "approved" || campaign.status === "rejected") {
    throw new Error("This campaign was already decided")
  }

  const post = campaign.posts.find((p) => p.id === opts.postId)
  if (!post) throw new Error("Post not found")

  post.status = "rendering"
  post.error = undefined
  await saveWeeklyCampaignBatch(batch)

  const graphic = await generateSafetyGraphic({
    approvedHeadline: post.headline,
    approvedMessage: post.message,
    messageFormat: post.messageFormat,
    visualConcept: post.visualConcept,
    importantVisualDetails: post.importantVisualDetails,
    visualNotes: "Educational SaferU branded safety graphic for public agencies.",
    style: "Let SaferU Decide",
    agencyLogoUrl: SAFERU_CAMPAIGN_LOGO_PATH,
  })

  if (!graphic.ok) {
    post.status = "failed"
    post.error = graphic.detail || graphic.reason || "Graphic generation failed"
    refreshCampaignStatus(batch, campaign.id)
    await saveWeeklyCampaignBatch(batch)
    throw new Error(post.error)
  }

  const stored = await storeGraphicStudioImageFromDataUrl(
    `${campaign.id}-${post.id}`,
    graphic.data.imageDataUrl
  )
  post.imageUrl = stored.url

  const captionResult = await generateSafetySocialCaption({
    topic: post.topic,
    headline: post.headline,
    message: post.message,
    agencyName: "SaferU",
  })
  if (captionResult.ok && captionResult.data.trim()) {
    post.caption = captionResult.data.trim()
  }

  post.status = "ready"
  post.error = undefined
  refreshCampaignStatus(batch, campaign.id)
  await saveWeeklyCampaignBatch(batch)
  return batch
}

export async function renderNextPendingPost(
  batchId: string,
  campaignId: string
): Promise<{ batch: WeeklyCampaignBatch; rendered: boolean; remaining: number }> {
  const batch = await getWeeklyCampaignBatch(batchId)
  if (!batch) throw new Error("Campaign batch not found")
  const campaign = batch.campaigns.find((c) => c.id === campaignId)
  if (!campaign) throw new Error("Campaign not found")

  const next = campaign.posts.find((p) => p.status === "planned" || p.status === "failed")
  if (!next) {
    refreshCampaignStatus(batch, campaignId)
    await saveWeeklyCampaignBatch(batch)
    return {
      batch,
      rendered: false,
      remaining: 0,
    }
  }

  const updated = await renderWeeklyCampaignPost({
    batchId,
    campaignId,
    postId: next.id,
  })
  const remaining = updated.campaigns
    .find((c) => c.id === campaignId)
    ?.posts.filter((p) => p.status === "planned" || p.status === "failed").length ?? 0
  return { batch: updated, rendered: true, remaining }
}
