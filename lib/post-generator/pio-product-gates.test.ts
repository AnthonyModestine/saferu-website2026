/**
 * Product-gate unit tests for SaferU AI Post Generator hardening.
 *
 * Run: npx --yes tsx --test lib/post-generator/pio-product-gates.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  hasVerifiedAgencyParticipation,
  shouldExcludeUnverifiedEvent,
} from "./event-exclusion"
import {
  containsVagueHolidayLanguage,
  isValidHolidayRecommendation,
} from "./holiday-validation"
import {
  sourceSupportsPluralTrend,
  suggestPreventionSignals,
  suggestsManufacturedTrend,
} from "./preventative-followup"
import { shouldRejectOrdinaryWeather, isSeriousWeatherRecommendation } from "./weather-gates"
import {
  rankAndGateExternalOpportunities,
  scoreExternalOpportunity,
  topicKey,
} from "./rank-opportunities"
import type { ExternalOpportunityInput } from "./types"
import { normalizeCandidates } from "./candidate-normalize"
import { isLikelyHomepageUrl } from "./source-standards"

function baseOpp(
  overrides: Partial<ExternalOpportunityInput> & Pick<ExternalOpportunityInput, "id" | "title">
): ExternalOpportunityInput {
  return {
    summary: overrides.summary || overrides.title,
    category: overrides.category || "public_safety",
    sourceLabel: overrides.sourceLabel || "Current Local Opportunity",
    whyItMatters: overrides.whyItMatters || "Residents need timely information.",
    recommendedAction: overrides.recommendedAction || "Share verified guidance.",
    recommendedPostTiming: overrides.recommendedPostTiming || "Post today.",
    priority: overrides.priority || "recommended_today",
    signals: overrides.signals || ["public_safety"],
    verifiedFacts: overrides.verifiedFacts || ["Verified fact from official source."],
    publicCallToAction: overrides.publicCallToAction || ["Follow official guidance."],
    confidenceLevel: overrides.confidenceLevel || "high",
    eventStart: overrides.eventStart || "2026-07-20",
    ...overrides,
  }
}

describe("Test 1: Irrelevant Town Hall", () => {
  it("rejects a town hall the police department is not hosting", () => {
    const input = {
      title: "City Town Hall on Budget",
      summary: "A town hall is scheduled downtown to discuss the municipal budget.",
      category: "community_event",
      sourceLabel: "Upcoming Event" as const,
      sourceName: "City Calendar",
      verifiedFacts: ["Town hall scheduled Friday at City Hall."],
    }
    assert.equal(shouldExcludeUnverifiedEvent(input), true)
    assert.equal(hasVerifiedAgencyParticipation(input), false)

    const ranked = rankAndGateExternalOpportunities(
      [
        baseOpp({
          id: "town-hall-1",
          title: input.title,
          summary: input.summary,
          category: input.category,
          sourceLabel: input.sourceLabel,
          sourceName: input.sourceName,
          verifiedFacts: input.verifiedFacts,
          signals: ["local_event"],
          sourceUrl: "https://example.gov/town-hall",
        }),
      ],
      {
        agencyType: "police",
        agencyName: "Springfield PD",
        city: "Springfield",
        todayIso: "2026-07-20",
        requireTrustedSource: false,
      }
    )
    assert.equal(ranked.length, 0)
  })
})

describe("Test 2: Real Agency Event", () => {
  it("allows Coffee with a Cop when the agency hosts it", () => {
    const input = {
      title: "Coffee with a Cop",
      summary: "Springfield PD is hosting Coffee with a Cop at the community center.",
      sourceName: "Springfield Police Department",
      verifiedFacts: ["Springfield PD is hosting Coffee with a Cop on Saturday."],
      category: "community_event",
      sourceLabel: "Upcoming Event" as const,
    }
    assert.equal(hasVerifiedAgencyParticipation(input), true)
    assert.equal(shouldExcludeUnverifiedEvent(input), false)
  })
})

describe("Test 3: Generic Holiday Failure", () => {
  it("rejects vague holiday language and out-of-window holidays", () => {
    assert.equal(containsVagueHolidayLanguage("With the holidays coming up, lock your car"), true)
    const result = isValidHolidayRecommendation(
      { id: "july-fourth", label: "Independence Day", month: 7, day: 4, category: "holiday_safety" },
      "2026-03-15",
      7
    )
    assert.equal(result.ok, false)
  })
})

describe("Test 4: Specific Holiday", () => {
  it("allows Independence Day inside the window", () => {
    const result = isValidHolidayRecommendation(
      { id: "july-fourth", label: "Independence Day", month: 7, day: 4, category: "holiday_safety" },
      "2026-07-01",
      7
    )
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.eventDate, "2026-07-04")
    }
  })

  it("does not reject calendar-july-fourth via ranking when eventStart is set", () => {
    const candidate = baseOpp({
      id: "calendar-july-fourth",
      title: "Independence Day",
      summary: "Independence Day fireworks safety reminder for residents.",
      category: "holiday_safety",
      sourceLabel: "Seasonal Recommendation",
      sourceName: "SaferU seasonal calendar",
      signals: ["fireworks_safety"],
      eventStart: "2026-07-04",
      eventEnd: "2026-07-04",
      jurisdictionFit: "own",
      whyItMatters:
        "Independence Day fireworks risks affect Springfield residents right now. A short safety reminder helps keep the community informed.",
      recommendedAction: "Remind residents to keep a safe distance from fireworks and lock vehicles.",
      publicCallToAction: [
        "Keep fireworks away from dry grass and structures.",
        "Never leave children or pets in a hot vehicle.",
      ],
      verifiedFacts: ["Independence Day is observed around 2026-07-04."],
    })
    const scored = scoreExternalOpportunity(candidate, {
      agencyType: "police",
      agencyName: "Springfield PD",
      city: "Springfield",
      todayIso: "2026-07-01",
      requireTrustedSource: false,
    })
    assert.ok(scored, "calendar-july-fourth should score, not be rejected for missing_date")

    const ranked = rankAndGateExternalOpportunities([candidate], {
      agencyType: "police",
      agencyName: "Springfield PD",
      city: "Springfield",
      todayIso: "2026-07-01",
      requireTrustedSource: false,
    })
    assert.equal(ranked.length, 1)
    assert.equal(ranked[0]?.id, "calendar-july-fourth")
  })
})

describe("Test 5: Vehicle Break-In Press Release", () => {
  it("maps vehicle break-ins to vehicle-security / 9PM routine signals", () => {
    const signals = suggestPreventionSignals(
      "Press release: several vehicle break-ins reported overnight in the downtown area."
    )
    assert.ok(signals.includes("vehicle_security") || signals.includes("9pm_routine"))
  })
})

describe("Test 6: Single Vehicle Incident", () => {
  it("flags manufactured trend language for a single incident", () => {
    assert.equal(suggestsManufacturedTrend("an increase in vehicle break-ins"), true)
    assert.equal(sourceSupportsPluralTrend("One vehicle was entered overnight on Oak Street."), false)
    assert.equal(
      suggestsManufacturedTrend("Following a recent report, lock your vehicle tonight."),
      false
    )
  })
})

describe("Test 7: House Fire", () => {
  it("suggests smoke-alarm / escape / cooking safety follow-up signals", () => {
    const signals = suggestPreventionSignals(
      "Fire department press release about a residential house fire on Maple Ave. Cause under investigation."
    )
    assert.ok(
      signals.some((s) =>
        ["smoke_alarm", "escape_plan", "cooking_safety", "fire_safety"].includes(s)
      )
    )
  })
})

describe("Test 8: Neighboring Road Closure", () => {
  it("rejects a neighboring road with no local travel impact via ranking", () => {
    const ranked = rankAndGateExternalOpportunities(
      [
        baseOpp({
          id: "road-neighbor",
          title: "Main Street closure in Shelbyville",
          summary: "Shelbyville Public Works closed Main Street for paving.",
          whyItMatters: "A neighboring town has a local paving project.",
          category: "road_closure",
          signals: ["road_closure"],
          sourceName: "Shelbyville Public Works",
          sourceUrl: "https://shelbyville.gov/roads/main-street-closure",
          jurisdictionFit: "nearby",
          distanceMiles: 22,
          verifiedFacts: ["Main Street in Shelbyville is closed for paving."],
        }),
      ],
      {
        agencyType: "police",
        agencyName: "Springfield PD",
        city: "Springfield",
        todayIso: "2026-07-20",
        requireTrustedSource: false,
      }
    )
    assert.equal(ranked.length, 0)
  })
})

describe("Test 9: Ordinary Weather", () => {
  it("rejects seasonal forecast with no hazard", () => {
    assert.equal(
      shouldRejectOrdinaryWeather({
        title: "Tuesday mostly sunny and warm",
        summary: "Seasonal temperatures near average with light breeze.",
        category: "weather",
        sourceLabel: "Weather Analysis",
        signals: ["weather_safety"],
      }),
      true
    )
  })
})

describe("Test 10: Serious Weather", () => {
  it("accepts NWS warning affecting the jurisdiction", () => {
    assert.equal(
      isSeriousWeatherRecommendation({
        title: "NWS Severe Thunderstorm Warning",
        summary: "National Weather Service issued a Severe Thunderstorm Warning for Springfield.",
        category: "weather",
        sourceLabel: "Weather Alert",
        signals: ["severe_storms"],
        verifiedFacts: ["NWS Severe Thunderstorm Warning active for Springfield."],
        priority: "urgent",
      }),
      true
    )
  })
})

describe("Test 11: No Strong Recommendations", () => {
  it("returns zero recommendations for weak filler candidates", () => {
    const ranked = rankAndGateExternalOpportunities(
      [
        baseOpp({
          id: "filler-1",
          title: "Interesting civic trivia",
          summary: "A fun fact about the city seal.",
          whyItMatters: "Might be interesting.",
          category: "community",
          signals: ["community_engagement"],
          verifiedFacts: [],
          publicCallToAction: [],
          recommendedAction: "",
          sourceUrl: "https://example.com/trivia",
        }),
      ],
      {
        agencyType: "police",
        agencyName: "Springfield PD",
        city: "Springfield",
        todayIso: "2026-07-20",
        requireTrustedSource: false,
      }
    )
    assert.equal(ranked.length, 0)
  })
})

describe("Test 12: Duplicate Topics", () => {
  it("consolidates the same storm into one topic family", () => {
    const a = baseOpp({
      id: "storm-nws",
      title: "Severe Thunderstorm Warning",
      summary: "NWS warns of severe storms this evening.",
      category: "weather",
      sourceLabel: "Weather Alert",
      signals: ["severe_storms"],
      sourceName: "National Weather Service",
      sourceUrl: "https://alerts.weather.gov/example",
      priority: "urgent",
      verifiedFacts: ["NWS Severe Thunderstorm Warning for the county."],
    })
    const b = baseOpp({
      id: "storm-tv",
      title: "Storm safety reminder",
      summary: "Local TV discusses the same evening storms.",
      category: "weather",
      signals: ["severe_storms", "weather_safety"],
      sourceName: "Local TV Weather",
      sourceUrl: "https://localtv.example/storm",
      verifiedFacts: ["Evening storms expected across the viewing area."],
    })
    const c = baseOpp({
      id: "storm-site",
      title: "Heavy rain expected",
      summary: "Weather website notes heavy rain with the storm system.",
      category: "weather",
      signals: ["severe_storms"],
      sourceName: "Weather.com",
      sourceUrl: "https://weather.com/storm",
      verifiedFacts: ["Heavy rain expected with the storm system."],
    })
    assert.equal(topicKey(a), topicKey(b))
    assert.equal(topicKey(a), topicKey(c))

    const ranked = rankAndGateExternalOpportunities([a, b, c], {
      agencyType: "emergency_management",
      agencyName: "Springfield EM",
      city: "Springfield",
      todayIso: "2026-07-20",
      requireTrustedSource: false,
    })
    const stormItems = ranked.filter((item) => topicKey(item) === "severe_weather")
    assert.ok(stormItems.length <= 1)
  })
})

describe("Normalization and source URL helpers", () => {
  it("normalizes agency follow-ups without fabricating source URLs", () => {
    const [normalized] = normalizeCandidates([
      baseOpp({
        id: "saferu-followup-abc123-vehicle-security",
        title: "Vehicle Security Reminder",
        sourceName: "Recent content created by this agency in SaferU",
        signals: ["vehicle_security"],
      }),
    ])
    assert.equal(normalized.sourceType, "agency_content")
    assert.equal(normalized.sourceUrl, undefined)
  })

  it("flags bare homepages as insufficient source URLs", () => {
    assert.equal(isLikelyHomepageUrl("https://www.weather.gov/"), true)
    assert.equal(
      isLikelyHomepageUrl("https://alerts.weather.gov/search?zone=XYZ"),
      false
    )
  })
})