import { describe, expect, it } from "vitest"
import {
  applyBriefingVerification,
  messageReflectsVerifiedFacts,
  verifyBriefingPost,
} from "./briefing-post-verification"
import type { ExternalOpportunityInput } from "./types"

describe("verifyBriefingPost", () => {
  it("rejects when a road closure is in verified details but not in the Facebook post", () => {
    const result = verifyBriefingPost({
      title: "Morgan Log House Open House",
      verifiedFacts: [
        "Road closed on Main Street during the Morgan Log House open house Saturday from 9 a.m. to 3 p.m.",
      ],
      suggestedMessage:
        "Join us at Morgan Log House this Saturday for a community open house with tours and activities.",
      suggestedVisual: "Road closure map along Main Street",
      sourceUrl: "https://www.example.org/morgan-log-house-event",
    })

    expect(result.approved).toBe(false)
    expect(result.issues.join(" ")).toMatch(/road closure/i)
  })

  it("approves when the Facebook post includes the same material facts", () => {
    const result = verifyBriefingPost({
      title: "Morgan Log House Open House",
      verifiedFacts: [
        "Road closed on Main Street during the Morgan Log House open house Saturday from 9 a.m. to 3 p.m.",
      ],
      suggestedMessage:
        "Heads up: Main Street will be closed Saturday during the Morgan Log House open house from 9 a.m. to 3 p.m. Use Walnut Street as a detour.",
      suggestedVisual: "Branded community event graphic",
      sourceUrl: "https://www.example.org/morgan-log-house-event",
    })

    expect(result.approved).toBe(true)
  })

  it("rejects posts without a direct source URL", () => {
    const result = verifyBriefingPost({
      title: "Community festival",
      verifiedFacts: ["Saturday at 10 a.m. at City Park"],
      suggestedMessage: "Join us Saturday at 10 a.m. at City Park for the community festival.",
    })

    expect(result.approved).toBe(false)
    expect(result.issues.join(" ")).toMatch(/source URL/i)
  })

  it("rejects speed limit posts mislabeled as road closures", () => {
    const result = verifyBriefingPost({
      title: "Road Closure — Main Street Speed Limit Reduction",
      verifiedFacts: [
        "West Main Street between Valley Forge Road and Cannon Avenue reduced from 35 mph to 25 mph",
      ],
      suggestedMessage:
        "Starting next week, the speed limit on West Main Street between Valley Forge Road and Cannon Avenue will be reduced from 35 mph to 25 mph.",
      suggestedVisual: "Road closure public information graphic",
      sourceUrl: "https://www.lansdale.org/speed-limit",
    })

    expect(result.approved).toBe(false)
    expect(result.issues.join(" ")).toMatch(/speed limit change/i)
  })
})

describe("messageReflectsVerifiedFacts", () => {
  it("requires meaningful overlap with verified facts", () => {
    expect(
      messageReflectsVerifiedFacts(
        "Join us for a fun community day!",
        ["Road closed on Main Street during Morgan Log House open house Saturday"]
      )
    ).toBe(false)
  })
})

describe("applyBriefingVerification", () => {
  it("drops rejected opportunities before they reach the UI", () => {
    const opportunities: ExternalOpportunityInput[] = [
      {
        id: "bad",
        title: "Road closure",
        summary: "Main Street closed",
        category: "road_closure",
        sourceLabel: "Current Local Opportunity",
        whyItMatters: "Drivers need to know",
        recommendedAction: "Share",
        recommendedPostTiming: "7 a.m.",
        priority: "recommended_today",
        signals: [],
        verifiedFacts: ["Main Street closed between 1st and 2nd Streets"],
        suggestedMessage: "Come visit our community open house tomorrow!",
        sourceUrl: "https://example.com/closure",
      },
      {
        id: "good",
        title: "Main Street closure",
        summary: "Main Street closed between 1st and 2nd Streets",
        category: "road_closure",
        sourceLabel: "Current Local Opportunity",
        whyItMatters: "Drivers need to know",
        recommendedAction: "Share",
        recommendedPostTiming: "7 a.m.",
        priority: "recommended_today",
        signals: [],
        verifiedFacts: ["Main Street closed between 1st and 2nd Streets"],
        suggestedMessage:
          "Main Street will be closed tomorrow between 1st and 2nd Streets. Use Chestnut Street as a detour.",
        sourceUrl: "https://example.com/closure",
      },
    ]

    const approved = applyBriefingVerification(opportunities)
    expect(approved).toHaveLength(1)
    expect(approved[0]?.id).toBe("good")
  })
})
