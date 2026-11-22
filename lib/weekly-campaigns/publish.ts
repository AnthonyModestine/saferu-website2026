import "server-only"

import { addArticle, addPost, generateId, isCmsArticle } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { baseArticleExists } from "@/lib/content-merged"
import { setArticlePublished } from "@/lib/content-visibility"
import { loadVisibility, persistVisibility } from "@/lib/content-visibility-persist"
import { revalidateContentPages } from "@/lib/revalidate-content"
import {
  getWeeklyCampaignBatch,
  saveWeeklyCampaignBatch,
} from "@/lib/weekly-campaigns/store"
import type { WeeklyCampaignBatch } from "@/lib/weekly-campaigns/types"

const CATEGORY_ID = "whats-new"
const SUBCATEGORY_ID = "latest"

export async function decideWeeklyCampaign(opts: {
  batchId: string
  campaignId: string
  decision: "approve" | "reject"
}): Promise<{ batch: WeeklyCampaignBatch; articleId?: string; articlePath?: string }> {
  const batch = await getWeeklyCampaignBatch(opts.batchId)
  if (!batch) throw new Error("Campaign batch not found")

  const campaign = batch.campaigns.find((c) => c.id === opts.campaignId)
  if (!campaign) throw new Error("Campaign not found")
  if (campaign.status === "approved" || campaign.status === "rejected") {
    throw new Error("This campaign was already decided")
  }

  if (opts.decision === "reject") {
    campaign.status = "rejected"
    campaign.decidedAt = new Date().toISOString()
    await saveWeeklyCampaignBatch(batch)
    return { batch }
  }

  if (campaign.status !== "ready") {
    throw new Error("Finish building all graphics before approving this campaign")
  }
  const missing = campaign.posts.filter((p) => p.status !== "ready" || !p.imageUrl)
  if (missing.length > 0) {
    throw new Error("Every post needs a ready graphic before publishing")
  }

  await Promise.all([loadCmsAdditions(), loadVisibility()])

  let articleId = generateId("art", campaign.title)
  for (let i = 0; i < 6; i++) {
    const taken =
      isCmsArticle(CATEGORY_ID, SUBCATEGORY_ID, articleId) ||
      baseArticleExists(CATEGORY_ID, SUBCATEGORY_ID, articleId)
    if (!taken) break
    articleId = generateId("art", `${campaign.title}-${i + 1}`)
  }

  const created = addArticle({
    categoryId: CATEGORY_ID,
    subcategoryId: SUBCATEGORY_ID,
    id: articleId,
    title: campaign.title,
    description: `${campaign.summary} ${campaign.whyThisWeek}`.trim(),
  })
  if (!created) throw new Error("Could not create What's New article")

  for (const post of campaign.posts) {
    const caption = post.caption.trim() || post.message
    addPost({
      categoryId: CATEGORY_ID,
      subcategoryId: SUBCATEGORY_ID,
      articleId,
      id: generateId("post", post.headline),
      title: post.headline,
      image: post.imageUrl || undefined,
      message: caption,
      captions: {
        facebook: caption,
        instagram: caption,
        twitter: caption.slice(0, 280),
      },
    })
  }

  setArticlePublished(CATEGORY_ID, SUBCATEGORY_ID, articleId, true)
  await Promise.all([persistAdditions(), persistVisibility()])
  revalidateContentPages(CATEGORY_ID, SUBCATEGORY_ID)

  campaign.status = "approved"
  campaign.publishedArticleId = articleId
  campaign.decidedAt = new Date().toISOString()

  for (const other of batch.campaigns) {
    if (other.id === campaign.id) continue
    if (other.status === "approved" || other.status === "rejected") continue
    other.status = "rejected"
    other.decidedAt = campaign.decidedAt
  }
  batch.status = "closed"

  await saveWeeklyCampaignBatch(batch)
  return {
    batch,
    articleId,
    articlePath: `/whats-new/${articleId}`,
  }
}
