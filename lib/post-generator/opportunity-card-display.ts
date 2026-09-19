import type { PostOpportunity } from "./types"
import { isGenericWhyText } from "./display-text"
import { parseSourceDisplayName } from "./source-display"
import { formatPostingTimeDisplay } from "./posting-time-display"

type OpportunityCardDisplayInput = Pick<
  PostOpportunity,
  | "summary"
  | "verifiedFacts"
  | "recommendedPostTiming"
  | "whyItMatters"
  | "surfacedReason"
  | "whyNow"
  | "sourceName"
  | "sourceUrl"
  | "issuingAuthority"
  | "opportunitySource"
>

/** What this post is about — verified facts first, then summary. */
export function opportunityAboutText(opp: OpportunityCardDisplayInput): string {
  const facts = (opp.verifiedFacts ?? []).map((fact) => fact.trim()).filter(Boolean)
  if (facts.length) return facts.slice(0, 3).join(" · ")
  return opp.summary?.trim() || ""
}

/** Full posting guidance including why that time works. */
export function opportunityPostingGuidance(opp: OpportunityCardDisplayInput): string {
  return opp.recommendedPostTiming?.trim() || ""
}

export function opportunityPostingTimeDisplay(
  guidance: string
): ReturnType<typeof formatPostingTimeDisplay> {
  return formatPostingTimeDisplay(guidance)
}

/** @deprecated Use opportunityPostingTimeDisplay instead. */
export function opportunityPostingTimeLabel(guidance: string): string | undefined {
  const display = formatPostingTimeDisplay(guidance)
  return display?.headline.replace(/^Post (?:at|on) /i, "")
}

/** SaferU recommendation copy — skips generic AI filler when possible. */
export function opportunitySaferuRecommendation(opp: OpportunityCardDisplayInput): string {
  for (const value of [opp.whyItMatters, opp.surfacedReason, opp.whyNow]) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    if (!isGenericWhyText(trimmed)) return trimmed
  }

  const facts = (opp.verifiedFacts ?? []).map((fact) => fact.trim()).filter(Boolean)
  if (facts.length >= 2) return `${facts[0]} ${facts[1]}`.slice(0, 280)
  if (facts[0]) return facts[0]

  return opp.whyItMatters?.trim() || opp.surfacedReason?.trim() || ""
}

export function opportunitySourceLabel(opp: OpportunityCardDisplayInput): string {
  if (opp.opportunitySource === "saferu_curated") return "SaferU"
  const raw =
    opp.sourceName?.trim() ||
    opp.issuingAuthority?.trim() ||
    ""
  if (!raw) {
    return opp.sourceUrl ? parseSourceDisplayName("", opp.sourceUrl) : ""
  }
  return parseSourceDisplayName(raw, opp.sourceUrl)
}
