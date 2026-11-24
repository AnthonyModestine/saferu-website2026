/**
 * Advisory: which approved information belongs on the graphic vs the social caption.
 * Runs BEFORE final customer copy approval — never silently removes approved wording.
 */

import { partitionApprovedCopy } from "@/lib/graphic-studio/execution-strategy"

export type CopyPlacementAdvisory = {
  status: "advisory_only"
  graphicStandaloneOk: boolean
  onGraphic: {
    headline: string
    message: string
  }
  captionSuggested: string | null
  retainedFullApproved: {
    headline: string
    message: string
  }
  rationale: string
  requiresOwnerApprovalToSplit: boolean
  /** True when the graphic would still teach the essential action if viewed alone. */
  essentialSafetyPreservedOnGraphic: boolean
}

/**
 * Recommend placement without mutating customer-approved copy.
 * Caller must present this to the customer before locking generation copy.
 *
 * When research already proposed a social_caption, prefer that complementary
 * caption over mechanically splitting the on-graphic message.
 */
export function adviseCopyPlacement(opts: {
  headline: string
  message: string
  /** Research-proposed complementary caption (preferred when present). */
  researchSocialCaption?: string | null
  /** Optional: mark which sentences are essential for independent comprehension. */
  essentialSentenceIndexes?: number[]
}): CopyPlacementAdvisory {
  const full = { headline: opts.headline, message: opts.message }
  const researchCaption = opts.researchSocialCaption?.trim() || ""

  if (researchCaption) {
    const overlapsHeavily =
      researchCaption.toLowerCase() === opts.message.trim().toLowerCase() ||
      (opts.message.length > 40 &&
        researchCaption.toLowerCase().includes(opts.message.trim().toLowerCase().slice(0, 40)))
    return {
      status: "advisory_only",
      graphicStandaloneOk: true,
      onGraphic: { headline: opts.headline, message: opts.message },
      captionSuggested: overlapsHeavily ? null : researchCaption,
      retainedFullApproved: full,
      rationale: overlapsHeavily
        ? "Research caption largely repeated the graphic; keep graphic-only until a complementary caption is approved."
        : "Research recommended a complementary social caption. Graphic copy is unchanged until the customer accepts.",
      requiresOwnerApprovalToSplit: false,
      essentialSafetyPreservedOnGraphic: true,
    }
  }

  const partition = partitionApprovedCopy(opts.headline, opts.message)

  if (!partition.captionRemainder) {
    return {
      status: "advisory_only",
      graphicStandaloneOk: true,
      onGraphic: { headline: opts.headline, message: opts.message },
      captionSuggested: null,
      retainedFullApproved: full,
      rationale: partition.reason,
      requiresOwnerApprovalToSplit: false,
      essentialSafetyPreservedOnGraphic: true,
    }
  }

  const onGraphicMessage = partition.onGraphicMessage || opts.message
  // Heuristic: lead sentence usually carries the core hazard/action; flag for owner.
  const essentialSafetyPreservedOnGraphic =
    /\b(never|always|do not|don't|install|leave|hang up|call|use|place|evacuate|detector|seat|airbag)\b/i.test(
      onGraphicMessage
    )

  return {
    status: "advisory_only",
    graphicStandaloneOk: essentialSafetyPreservedOnGraphic,
    onGraphic: {
      headline: partition.onGraphicHeadline,
      message: onGraphicMessage,
    },
    captionSuggested: partition.captionRemainder,
    retainedFullApproved: full,
    rationale: `${partition.reason} Full approved wording is retained until the customer accepts a split.`,
    requiresOwnerApprovalToSplit: true,
    essentialSafetyPreservedOnGraphic,
  }
}
