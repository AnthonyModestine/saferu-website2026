import {
  DEFAULT_DAILY_RECOMMENDATION_LIMIT,
  type ExternalOpportunityInput,
  type OpportunityPriority,
} from "./types"
import { cleanDisplayTitle, isGenericWhyText } from "./display-text"
import { extractSourceUrl, parseSourceDisplayName } from "./source-display"
import { inferTrafficCategory } from "./traffic-post-label"
import { normalizePostingTimeGuidance } from "./posting-time-display"

export type ParsedTomorrowPost = {
  index: number
  topic: string
  priority: string
  category?: string
  issuingAuthority?: string
  whyItMatters: string
  verifiedDetails: string
  recommendedPostingTime: string
  facebookPost: string
  shortVersion: string
  suggestedVisual: string
  source: string
  sourceOrganization?: string
  sourceTitle?: string
  sourceDate?: string
  sourceUrl?: string
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractField(block: string, label: string): string {
  const escaped = escapeRegExp(label)
  const patterns = [
    new RegExp(
      `\\*\\*${escaped}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Za-z][^\\n]*:\\*\\*|\\n(?:\\*\\*)?[A-Za-z][^\\n:]*:(?:\\*\\*)?|\\n###\\s|\\n##\\s|$)`,
      "i"
    ),
    new RegExp(
      `(?:^|\\n)${escaped}:\\s*([\\s\\S]*?)(?=\\n(?:\\*\\*)?[A-Za-z][^\\n:]*:(?:\\*\\*)?|\\n###\\s|\\n##\\s|$)`,
      "i"
    ),
  ]

  for (const pattern of patterns) {
    const match = block.match(pattern)
    if (match?.[1]?.trim()) return match[1].trim()
  }

  return ""
}

function extractHeadingTopic(block: string): string {
  const match = block.match(/^###\s+\d+\.\s*(.+?)(?:\n|$)/i)
  if (!match?.[1]) return ""
  const raw = match[1].trim()
  if (/^post topic$/i.test(raw)) return ""
  return cleanDisplayTitle(raw)
}

function extractTopicTitle(
  block: string,
  whyItMatters: string,
  verifiedDetails: string,
  facebookPost: string
): string {
  const afterHeading = block.replace(/^###\s+\d+\.\s*(?:Post Topic\s*)?/i, "")
  const lines = afterHeading
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (/^priority:/i.test(line) || line.startsWith("###")) continue

    const normalized = line.replace(/^-\s+/, "")
    const labeled = normalized.match(/^\*\*([^*]+)\*\*:?\s*(.+)$/i)
    if (labeled?.[2]) {
      const value = cleanDisplayTitle(labeled[2])
      if (value && value !== cleanDisplayTitle(whyItMatters)) return value
    }

    if (normalized.startsWith("**")) continue

    const cleaned = cleanDisplayTitle(normalized)
    if (!cleaned || cleaned.length > 140) continue
    if (whyItMatters && cleaned === cleanDisplayTitle(whyItMatters)) continue
    if (isGenericWhyText(cleaned)) continue
    return cleaned
  }

  const firstFact = splitFacts(verifiedDetails)[0]
  if (firstFact) {
    const cleaned = cleanDisplayTitle(firstFact)
    if (cleaned && !isGenericWhyText(cleaned)) return cleaned
  }

  const fbLead = cleanDisplayTitle(facebookPost.split(/[.!?\n]/)[0] || "")
  if (fbLead && fbLead.length <= 140 && !isGenericWhyText(fbLead)) return fbLead

  return "Community update"
}

function buildSaferuRecommendation(whyItMatters: string, facts: string[]): string {
  const cleanWhy = whyItMatters.trim()
  if (cleanWhy && !isGenericWhyText(cleanWhy)) return cleanWhy
  if (facts.length >= 2) return `${facts[0]} ${facts[1]}`.slice(0, 280)
  if (facts[0]) return facts[0]
  return cleanWhy
}

function buildAboutSummary(facts: string[], verifiedDetails: string): string {
  if (facts.length) return facts.slice(0, 3).join(" · ")
  return verifiedDetails.trim()
}

function parseSourceName(source: string, sourceUrl?: string): string {
  return parseSourceDisplayName(source, sourceUrl)
}

function categoryFromLabel(label: string, topic: string, details: string): string {
  const key = label.toLowerCase().trim()
  const map: Record<string, string> = {
    "road closure": "road_closure",
    "traffic advisory": "traffic_advisory",
    "utility alert": "utility",
    "public works update": "public_works",
    "community event": "community_event",
    "safety alert": "public_safety",
    "scam alert": "scams",
    "weather alert": "weather",
  }
  if (map[key]) return map[key]
  return inferCategory(topic, details)
}

function buildSourceFields(block: string): {
  source: string
  sourceOrganization?: string
  sourceTitle?: string
  sourceDate?: string
  sourceUrl?: string
} {
  const sourceOrganization = extractField(block, "Source organization")
  const sourceTitle = extractField(block, "Source title")
  const sourceDate = extractField(block, "Source date")
  const sourceUrlField = extractField(block, "Source URL")
  const legacySource = extractField(block, "Source")

  const sourceUrl =
    extractSourceUrl(sourceUrlField) ||
    extractSourceUrl(legacySource) ||
    extractSourceUrl(block)

  const sourceParts = [sourceOrganization, sourceTitle, sourceDate].filter(Boolean).join("\n")

  return {
    source: sourceParts || legacySource,
    sourceOrganization: sourceOrganization || undefined,
    sourceTitle: sourceTitle || undefined,
    sourceDate: sourceDate || undefined,
    sourceUrl,
  }
}

function inferCategory(topic: string, details: string): string {
  const topicLower = topic.toLowerCase()
  if (/event|festival|night out|meeting|gathering|celebration|community day|open house/.test(topicLower)) {
    return "community_event"
  }

  const text = `${topic} ${details}`.toLowerCase()
  const trafficCategory = inferTrafficCategory(`${topic} ${details}`)
  if (trafficCategory) return trafficCategory

  if (/construction|detour|511|penndot|dot/.test(text)) return "traffic_advisory"
  if (/weather|heat|storm|flood|snow|ice|wind|tornado|air quality/.test(text)) return "weather"
  if (/fire|smoke|wildfire/.test(text)) return "fire_safety"
  if (/scam|fraud|phishing/.test(text)) return "scams"
  if (/missing|amber|endangered/.test(text)) return "missing_person"
  if (/event|festival|night out|meeting|gathering|celebration|community day/.test(text)) {
    return "community_event"
  }
  if (/utility|power|outage|boil|water/.test(text)) return "utility"
  if (/school|student/.test(text)) return "school"
  if (/crime|police|suspect|theft/.test(text)) return "crime_prevention"
  return "community_update"
}

function mapPriority(priority: string): {
  tier: "top_recommended" | "could_post"
  urgency: OpportunityPriority
} {
  const lower = priority.toLowerCase()
  if (lower.includes("high priority")) {
    return { tier: "top_recommended", urgency: "recommended_today" }
  }
  if (lower.includes("community engagement")) {
    return { tier: "could_post", urgency: "plan_ahead" }
  }
  return { tier: "top_recommended", urgency: "recommended_today" }
}

function splitFacts(details: string): string[] {
  return details
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter((line) => line.length > 8)
    .slice(0, 6)
}

/** Split markdown into per-post blocks; handles briefings that start directly on Post Topic 1. */
function splitByHeading(section: string, headingPattern: RegExp): string[] {
  const parts = section.split(new RegExp(`(?=${headingPattern.source})`, headingPattern.flags))
  if (!parts.length) return []

  const first = parts[0]?.trim() ?? ""
  if (headingPattern.test(first)) {
    return parts.map((part) => part.trim()).filter((part) => headingPattern.test(part))
  }

  return parts.slice(1).map((part) => part.trim()).filter(Boolean)
}

function splitPostTopicBlocks(section: string): string[] {
  const postTopicHeadings = /###\s+\d+\.\s*(?:Post Topic)?/i
  const primary = splitByHeading(section, postTopicHeadings)
  if (primary.length > 0) return primary

  const numberedHeadings = /###\s+\d+\.\s+/i
  return splitByHeading(section, numberedHeadings).filter((part) =>
    /###\s+\d+\.\s+/i.test(part)
  )
}

export function parseRecommendationsFound(markdown: string): number | undefined {
  const match = markdown.match(/Recommendations found:\s*(\d+)/i)
  if (!match?.[1]) return undefined
  return Number(match[1])
}

export function parseTomorrowBriefingPosts(markdown: string): ParsedTomorrowPost[] {
  const posts: ParsedTomorrowPost[] = []
  const section =
    markdown.split(/(?:###|##)\s+Items Reviewed but Not Recommended/i)[0] ?? markdown
  const blocks = splitPostTopicBlocks(section)

  for (const block of blocks) {
    const indexMatch = block.match(/###\s+(\d+)\.\s*/i)
    const index = indexMatch ? Number(indexMatch[1]) : posts.length + 1
    const whyItMatters = extractField(block, "Why it matters")
    const verifiedDetails = extractField(block, "Verified details")
    const recommendedPostingTime = extractField(block, "Recommended posting time")
    const facebookPost = extractField(block, "Suggested Facebook post")
    const shortVersion = extractField(block, "Suggested short version")
    const suggestedVisual = extractField(block, "Suggested visual")
    const priority = extractField(block, "Priority")
    const categoryLabel = extractField(block, "Category")
    const issuingAuthority = extractField(block, "Issuing authority")
    const sourceFields = buildSourceFields(block)
    const topic =
      extractHeadingTopic(block) ||
      cleanDisplayTitle(
        extractTopicTitle(block, whyItMatters, verifiedDetails, facebookPost)
      )
    const cleanWhy = isGenericWhyText(whyItMatters) ? "" : whyItMatters.trim()

    if (!topic && !facebookPost && !verifiedDetails) continue

    posts.push({
      index,
      topic,
      priority,
      category: categoryLabel || undefined,
      issuingAuthority: issuingAuthority || undefined,
      whyItMatters: cleanWhy,
      verifiedDetails,
      recommendedPostingTime,
      facebookPost,
      shortVersion,
      suggestedVisual,
      source: sourceFields.source,
      sourceOrganization: sourceFields.sourceOrganization,
      sourceTitle: sourceFields.sourceTitle,
      sourceDate: sourceFields.sourceDate,
      sourceUrl: sourceFields.sourceUrl,
    })
    if (posts.length >= DEFAULT_DAILY_RECOMMENDATION_LIMIT) break
  }

  return posts
}

export function parsedPostsToOpportunities(
  posts: ParsedTomorrowPost[],
  todayIso: string
): ExternalOpportunityInput[] {
  return posts.map((post) => {
    const { tier, urgency } = mapPriority(post.priority)
    const facts = splitFacts(post.verifiedDetails)
    const detailsSummary = buildAboutSummary(facts, post.verifiedDetails)
    const recommendation = buildSaferuRecommendation(post.whyItMatters, facts)

    const title = cleanDisplayTitle(post.topic)
    const category = post.category
      ? categoryFromLabel(post.category, post.topic, post.verifiedDetails)
      : inferCategory(post.topic, post.verifiedDetails)
    const postingGuidance = normalizePostingTimeGuidance(
      post.recommendedPostingTime.trim() || "Tomorrow morning"
    )
    const sourceName =
      post.sourceOrganization?.trim() ||
      parseSourceName(post.source, post.sourceUrl)

    return {
      id: `tomorrow-${todayIso}-${slug(title || post.topic)}-${post.index}`,
      title,
      summary: detailsSummary,
      category,
      sourceLabel: "Current Local Opportunity",
      whyItMatters: recommendation,
      surfacedReason: recommendation || undefined,
      whyNow: recommendation || undefined,
      recommendedAction: "Share the verified update in a calm, community-focused voice.",
      recommendedPostTiming: postingGuidance,
      priority: urgency,
      recommendationTier: tier,
      jurisdictionFit: "own",
      signals: ["tomorrow_briefing", category],
      sourceName: sourceName.slice(0, 120),
      sourceUrl: post.sourceUrl,
      issuingAuthority: post.issuingAuthority,
      verifiedFacts: facts.length ? facts : [post.verifiedDetails].filter(Boolean),
      publicCallToAction: post.shortVersion
        ? [post.shortVersion.slice(0, 240)]
        : ["Follow official channels for updates."],
      doNotClaim: [
        "Do not add facts, dates, or locations not stated in the cited source.",
      ],
      suggestedMessage: post.facebookPost,
      graphicAltText: post.suggestedVisual.slice(0, 200) || undefined,
      confidenceLevel: post.sourceUrl ? "high" : "medium",
      qualityGateStatus: post.sourceUrl ? "approved" : "needs_human_review",
    }
  })
}

export function extractBriefingSchedule(markdown: string): string | undefined {
  const match = markdown.match(
    /(?:###|##)\s+Recommended Daily Schedule\s*([\s\S]*?)(?:\n(?:###|##)\s|$)/i
  )
  return match?.[1]?.trim()
}

export function briefingIndicatesNoPosts(markdown: string): boolean {
  const lower = markdown.toLowerCase()
  const declared = parseRecommendationsFound(markdown)
  if (declared === 0) return true
  if (!parseTomorrowBriefingPosts(markdown).length) {
    return (
      lower.includes("no timely, verified, locally relevant post was found") ||
      lower.includes("should not force generic content") ||
      lower.includes("no post is justified") ||
      lower.includes("recommendations found: 0")
    )
  }
  return false
}
