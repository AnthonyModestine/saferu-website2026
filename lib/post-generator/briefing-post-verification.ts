import type { ExternalOpportunityInput } from "./types"
import { isActualRoadClosure, isSpeedLimitChange } from "./traffic-post-label"

export type BriefingVerificationInput = {
  title: string
  summary?: string
  category?: string
  verifiedFacts?: string[]
  suggestedMessage?: string
  suggestedVisual?: string
  sourceUrl?: string
}

export type BriefingVerificationResult = {
  approved: boolean
  issues: string[]
  qualityGateStatus: ExternalOpportunityInput["qualityGateStatus"]
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "around",
  "before",
  "community",
  "department",
  "during",
  "event",
  "friday",
  "house",
  "monday",
  "official",
  "police",
  "saturday",
  "sunday",
  "their",
  "there",
  "these",
  "thursday",
  "today",
  "tomorrow",
  "tuesday",
  "wednesday",
  "where",
  "which",
  "while",
  "with",
  "your",
])

type MaterialClaim = {
  label: string
  inSource: RegExp | ((text: string) => boolean)
  inMessage: RegExp
}

const MATERIAL_CLAIMS: MaterialClaim[] = [
  {
    label: "road closure or detour",
    inSource: (text) => isActualRoadClosure(text),
    inMessage: /road closed|closure|detour|closed between|alternate route|avoid|blocked/i,
  },
  {
    label: "boil water advisory",
    inSource: /boil water/i,
    inMessage: /boil water/i,
  },
  {
    label: "power or utility outage",
    inSource: /power outage|utility outage|electric outage|without power/i,
    inMessage: /power outage|without power|utility outage|electric service/i,
  },
  {
    label: "missing person",
    inSource: /missing person|amber alert|endangered missing/i,
    inMessage: /missing person|missing|amber alert|if you see/i,
  },
  {
    label: "evacuation",
    inSource: /evacuat/i,
    inMessage: /evacuat/i,
  },
]

function meaningfulTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
  )
}

/** Message should echo concrete details from verified facts, not just a generic invite. */
export function messageReflectsVerifiedFacts(
  message: string,
  verifiedFacts: string[]
): boolean {
  const trimmed = message.trim()
  if (!trimmed || !verifiedFacts.length) return false

  const messageTokens = meaningfulTokens(trimmed)
  const factTokens = meaningfulTokens(verifiedFacts.join(" "))
  if (!factTokens.size) return true

  let overlap = 0
  for (const token of factTokens) {
    if (messageTokens.has(token)) overlap++
  }

  return overlap >= 2 || overlap / factTokens.size >= 0.2
}

function claimPresent(text: string, pattern: RegExp | ((text: string) => boolean)): boolean {
  if (typeof pattern === "function") return pattern(text)
  return pattern.test(text)
}

export function verifyBriefingPost(input: BriefingVerificationInput): BriefingVerificationResult {
  const issues: string[] = []
  const title = input.title.trim()
  const message = input.suggestedMessage?.trim() ?? ""
  const facts = (input.verifiedFacts ?? []).map((fact) => fact.trim()).filter(Boolean)
  const factsText = facts.join(" ")
  const visual = input.suggestedVisual?.trim() ?? ""
  const sourceText = `${title} ${factsText} ${visual}`

  if (!input.sourceUrl?.trim() || !/^https?:\/\//i.test(input.sourceUrl)) {
    issues.push("Missing a direct https source URL from the official page")
  }
  if (!message) {
    issues.push("Missing a suggested Facebook post")
  }
  if (!facts.length) {
    issues.push("Missing verified details from the official source")
  }

  for (const claim of MATERIAL_CLAIMS) {
    const inTitle = claimPresent(title, claim.inSource)
    const inFacts = claimPresent(factsText, claim.inSource)
    const inVisual = claimPresent(visual, claim.inSource)
    const inMessage = claimPresent(message, claim.inMessage)

    if (inTitle && !inFacts) {
      issues.push(`Title mentions ${claim.label} but verified details do not support it`)
    }
    if ((inFacts || inVisual) && !inMessage) {
      issues.push(`Facebook post does not mention the ${claim.label} stated in verified details`)
    }
    if (inVisual && !inFacts && !inTitle) {
      issues.push(`Suggested visual references ${claim.label} without verified support`)
    }
  }

  if (
    /road\s*closure/i.test(`${title} ${visual}`) &&
    isSpeedLimitChange(factsText) &&
    !isActualRoadClosure(factsText)
  ) {
    issues.push(
      "Post labels a road closure but verified details describe a speed limit change or traffic notice, not a closure"
    )
  }

  if (message && facts.length && !messageReflectsVerifiedFacts(message, facts)) {
    issues.push("Facebook post does not reflect the verified details from the source")
  }

  if (title && facts.length) {
    const titleTokens = meaningfulTokens(title)
    const factTokens = meaningfulTokens(factsText)
    let titleOverlap = 0
    for (const token of titleTokens) {
      if (factTokens.has(token)) titleOverlap++
    }
    if (titleTokens.size >= 2 && titleOverlap === 0) {
      issues.push("Post topic does not match the verified details from the source")
    }
  }

  const hardReject = issues.length > 0

  return {
    approved: !hardReject,
    issues,
    qualityGateStatus: hardReject ? "rejected" : "approved",
  }
}

export function applyBriefingVerification(
  opportunities: ExternalOpportunityInput[]
): ExternalOpportunityInput[] {
  return opportunities
    .map((opp) => {
      const result = verifyBriefingPost({
        title: opp.title,
        summary: opp.summary,
        category: opp.category,
        verifiedFacts: opp.verifiedFacts,
        suggestedMessage: opp.suggestedMessage,
        suggestedVisual: opp.graphicAltText,
        sourceUrl: opp.sourceUrl,
      })

      return {
        ...opp,
        qualityGateStatus: result.qualityGateStatus,
        confidenceLevel: result.approved ? opp.confidenceLevel ?? "high" : "low",
        doNotClaim: [
          ...(opp.doNotClaim ?? []),
          "Only share facts stated in the linked official source.",
          ...result.issues.map((issue) => `Do not publish without verifying: ${issue}`),
        ],
      }
    })
    .filter((opp) => opp.qualityGateStatus === "approved")
}

export function briefingAccuracyBrief(): string {
  return `ACCURACY AND SOURCE RULES:
- Every recommended post must cite one direct official source URL that you actually reviewed.
- The post topic, verified details, suggested Facebook post, and suggested visual must describe the same real update. Do not mix unrelated facts.
- If verified details mention a road closure, the Facebook post must clearly mention that closure. Do not write only a generic event invite.
- Speed limit reductions, traffic signal work, and lane restrictions are traffic advisories — not road closures. Do not label them as closures in the post topic, Facebook post, or suggested visual.
- Do not put a road closure, outage, warning, or alert in the title unless that exact condition is confirmed in verified details from the source.
- Do not claim an official image, flyer, or map exists unless it is on the cited source page. When unsure, recommend the agency's branded announcement graphic instead.
- Do not invent dates, times, streets, closures, suspects, charges, or agency actions.
- If you cannot verify an item from an official page, exclude it rather than guessing.`
}
