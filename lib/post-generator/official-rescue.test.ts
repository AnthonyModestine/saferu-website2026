import { describe, expect, it } from "vitest"
import {
  isPromotableDiscoveryCandidate,
  promoteDiscoveryCandidates,
} from "./official-rescue"
import type { ExternalOpportunityInput } from "./types"

const ic3Alert: ExternalOpportunityInput = {
  id: "ic3-test",
  title: "FBI warns of payroll diversion scam",
  summary: "IC3 alert on payroll diversion.",
  category: "scams",
  sourceLabel: "National Safety Alert",
  whyItMatters: "Residents should verify unexpected payroll change requests before acting.",
  recommendedAction: "Share the IC3 warning with practical verification tips.",
  recommendedPostTiming: "Post today while the alert is current.",
  priority: "optional",
  signals: ["scams", "fbi_alert"],
  sourceName: "FBI IC3",
  sourceUrl: "https://www.ic3.gov/Media/Y2026/test",
  verifiedFacts: ["FBI IC3 published a payroll diversion scam alert."],
  confidenceLevel: "medium",
}

describe("promoteDiscoveryCandidates", () => {
  it("promotes FBI IC3 alerts that strict ranking may reject", () => {
    expect(isPromotableDiscoveryCandidate(ic3Alert)).toBe(true)
    const promoted = promoteDiscoveryCandidates([ic3Alert])
    expect(promoted).toHaveLength(1)
    expect(promoted[0]?.recommendationTier).toBe("top_recommended")
  })

  it("does not promote seasonal calendar filler", () => {
    expect(
      isPromotableDiscoveryCandidate({
        ...ic3Alert,
        id: "calendar-july4",
        sourceLabel: "Seasonal Recommendation",
      })
    ).toBe(false)
  })
})
