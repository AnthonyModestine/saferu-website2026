export const SAFERU_CAMPAIGN_LOGO_PATH = "/images/saferu-logo.png"

export type CampaignTheme =
  | "seasonal"
  | "weather"
  | "crime_trend"
  | "holiday"
  | "community_safety"

export type CampaignPostStatus = "planned" | "rendering" | "ready" | "failed"

export type CampaignStatus =
  | "planning"
  | "pending_graphics"
  | "ready"
  | "approved"
  | "rejected"

export type WeeklyCampaignPost = {
  id: string
  topic: string
  headline: string
  message: string
  messageFormat: "paragraph" | "callout" | "bullets"
  visualConcept: string
  importantVisualDetails: string[]
  caption: string
  imageUrl: string | null
  status: CampaignPostStatus
  error?: string
}

export type WeeklyCampaign = {
  id: string
  title: string
  summary: string
  theme: CampaignTheme
  whyThisWeek: string
  posts: WeeklyCampaignPost[]
  status: CampaignStatus
  publishedArticleId?: string
  decidedAt?: string
}

export type WeeklyCampaignBatch = {
  id: string
  weekLabel: string
  createdAt: string
  updatedAt: string
  status: "open" | "closed"
  campaigns: WeeklyCampaign[]
}
