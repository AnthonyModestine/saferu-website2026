/**
 * Run: npx --yes tsx --test lib/post-generator/recommendation/recommendation.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { scorePioCandidate, selectFinalRecommendations } from "./index"
import type { RankedExternalOpportunity } from "../types"

function baseOpportunity(
  overrides: Partial<RankedExternalOpportunity> = {}
): RankedExternalOpportunity {
  return {
    id: "test-1",
    title: "Severe Thunderstorm Warning",
    summary: "Storms affecting the jurisdiction until 7 PM.",
    category: "weather",
    sourceLabel: "Weather Alert",
    whyItMatters: "Residents should seek shelter indoors immediately.",
    surfacedReason:
      "The warning is active now and affects agency ZIP codes until 7 PM tonight.",
    recommendedAction: "Seek shelter indoors.",
    recommendedPostTiming: "Post immediately",
    priority: "urgent",
    signals: ["severe_weather"],
    jurisdictionFit: "own",
    recommendationTier: "top_recommended",
    internalScores: {
      agencyRelevance: 90,
      geographicRelevance: 95,
      residentValue: 92,
      actionability: 90,
      urgency: 95,
      sourceTrust: 98,
      seasonalRelevance: 70,
      engagementPotential: 70,
      freshness: 95,
      composite: 92,
      pioRating: 5,
    },
    confidenceLevel: "high",
    verifiedFacts: ["Severe Thunderstorm Warning in effect until 7 PM."],
    sourceUrl: "https://weather.gov/example",
    sourceName: "National Weather Service",
    ...overrides,
  }
}

describe("recommendation scoring", () => {
  it("qualifies a strong urgent local warning", () => {
    const scored = scorePioCandidate(baseOpportunity())
    assert.equal(scored.eligible, true)
    assert.ok(scored.score >= 65)
  })

  it("rejects weak regional items below threshold", () => {
    const scored = scorePioCandidate(
      baseOpportunity({
        priority: "optional",
        jurisdictionFit: "regional",
        surfacedReason: "Maybe relevant",
        internalScores: {
          agencyRelevance: 40,
          geographicRelevance: 35,
          residentValue: 40,
          actionability: 30,
          urgency: 20,
          sourceTrust: 50,
          seasonalRelevance: 40,
          engagementPotential: 30,
          freshness: 40,
          composite: 38,
          pioRating: 2,
        },
      })
    )
    assert.equal(scored.eligible, false)
  })
})

describe("selectFinalRecommendations", () => {
  it("returns at most four recommendations", () => {
    const candidates = Array.from({ length: 8 }, (_, index) =>
      baseOpportunity({
        id: `test-${index}`,
        title: `Topic ${index}`,
        category: index % 2 === 0 ? "weather" : "traffic",
      })
    )
    const result = selectFinalRecommendations(candidates)
    assert.ok(result.recommendations.length <= 4)
  })

  it("returns empty state message when nothing qualifies", () => {
    const result = selectFinalRecommendations([])
    assert.equal(result.recommendations.length, 0)
    assert.match(
      result.noRecommendationReason || "",
      /No strong post recommendations/
    )
  })
})
