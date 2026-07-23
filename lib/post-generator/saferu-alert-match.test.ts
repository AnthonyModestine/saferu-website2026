/**
 * Run: npx --yes tsx --test lib/post-generator/saferu-alert-match.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { DEMO_INDEXED_POSTS } from "./content-index"
import {
  resolveSaferuContentMatch,
  shouldOfferSeparateSaferuCard,
} from "./saferu-content-match"
import type { ExternalOpportunityInput } from "./types"

function hurricaneWatchAlert(): ExternalOpportunityInput {
  return {
    id: "alert-hurricane-watch",
    title: "Hurricane Watch issued for coastal areas",
    summary: "A Hurricane Watch is in effect through Friday evening.",
    category: "weather",
    sourceLabel: "Weather Alert",
    whyItMatters: "Residents should begin hurricane preparations today.",
    surfacedReason:
      "The Hurricane Watch begins within 48 hours. Posting today gives residents time to prepare supplies and review evacuation plans.",
    recommendedAction: "Review hurricane plans and monitor official updates.",
    recommendedPostTiming: "Post today",
    priority: "recommended_today",
    signals: ["hurricane", "severe_weather"],
    sourceName: "National Weather Service",
    sourceUrl: "https://weather.gov/example",
    verifiedFacts: [
      "The National Weather Service issued a Hurricane Watch for the service area.",
      "Hurricane conditions are possible within 48 hours.",
    ],
    recommendationTier: "top_recommended",
    jurisdictionFit: "own",
    internalScores: {
      agencyRelevance: 88,
      geographicRelevance: 95,
      residentValue: 90,
      actionability: 85,
      urgency: 82,
      sourceTrust: 98,
      seasonalRelevance: 80,
      engagementPotential: 70,
      freshness: 90,
      composite: 88,
      pioRating: 5,
    },
    confidenceLevel: "high",
  }
}

describe("SaferU safety messaging on alerts", () => {
  it("finds hurricane preparedness content for hurricane alerts", () => {
    const match = resolveSaferuContentMatch(
      hurricaneWatchAlert(),
      DEMO_INDEXED_POSTS,
      "2026-07-01"
    )
    assert.ok(match?.post.message.toLowerCase().includes("hurricane"))
    assert.equal(shouldOfferSeparateSaferuCard(hurricaneWatchAlert(), match), true)
  })

  it("does not offer a duplicate SaferU card when the prevention post is already primary", () => {
    const match = resolveSaferuContentMatch(
      {
        id: "followup-break-in",
        title: "Prevention reminder after recent vehicle break-ins",
        summary: "Several vehicle break-ins were reported in the downtown area.",
        category: "crime prevention",
        sourceLabel: "Current Local Opportunity",
        whyItMatters: "Residents can reduce theft by locking vehicles and removing valuables.",
        recommendedAction: "Lock vehicles and report suspicious activity.",
        recommendedPostTiming: "Post today",
        priority: "recommended_today",
        signals: ["vehicle_security", "9pm_routine"],
        verifiedFacts: ["The agency reported several vehicle break-ins this week."],
        confidenceLevel: "high",
        internalScores: {
          agencyRelevance: 85,
          geographicRelevance: 90,
          residentValue: 88,
          actionability: 86,
          urgency: 70,
          sourceTrust: 80,
          seasonalRelevance: 70,
          engagementPotential: 72,
          freshness: 85,
          composite: 84,
          pioRating: 5,
        },
      },
      DEMO_INDEXED_POSTS,
      "2026-07-01"
    )
    assert.ok(match?.post.signals.includes("9pm_routine"))
    assert.equal(
      shouldOfferSeparateSaferuCard(
        {
          id: "followup-break-in",
          title: "Prevention reminder after recent vehicle break-ins",
          summary: "",
          category: "crime prevention",
          sourceLabel: "Current Local Opportunity",
          whyItMatters: "",
          recommendedAction: "",
          recommendedPostTiming: "Post today",
          priority: "recommended_today",
          signals: ["vehicle_security", "9pm_routine"],
        },
        match
      ),
      false
    )
  })
})
