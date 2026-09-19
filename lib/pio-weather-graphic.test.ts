/**
 * Weather / public-works canvas graphic helpers.
 *
 * Run: npx --yes tsx --test lib/pio-weather-graphic.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  alertGraphicKind,
  isWeatherAlertOpportunity,
  needsAlertTemplateGraphic,
  weatherAlertHeadline,
} from "./pio-weather-graphic"

describe("alertGraphicKind", () => {
  it("marks official Weather Alert opportunities for the canvas template", () => {
    assert.equal(
      alertGraphicKind({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Tornado Watch",
      }),
      "weather"
    )
  })

  it("marks Weather Analysis the same way the engine blocks SaferU library graphics", () => {
    assert.equal(
      alertGraphicKind({
        sourceLabel: "Weather Analysis",
        category: "weather",
        title: "Local storm outlook",
      }),
      "weather"
    )
  })

  it("marks public-works closures for the same branded template", () => {
    assert.equal(
      alertGraphicKind({
        sourceLabel: "Local Update",
        category: "road_closure",
        title: "Main Street closed overnight",
      }),
      "public_works"
    )
  })

  it("marks community events for the PIO template", () => {
    assert.equal(
      alertGraphicKind({
        sourceLabel: "Current Local Opportunity",
        category: "community_event",
        title: 'Unity in the Community "A Sheriff\'s Community Celebration"',
      }),
      "community"
    )
  })
})

describe("weatherAlertHeadline", () => {
  it("derives Tornado Watch / Thunderstorm titles from NWS event text", () => {
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Tornado Watch",
      }),
      "Tornado Watch"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Severe Thunderstorm Warning",
      }),
      "Thunderstorm Warning"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Severe Thunderstorm",
      }),
      "Thunderstorm Alert"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Federal Advisory",
        category: "crime",
        title: "IRS impersonation scam",
      }),
      "Scam Alert"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Local Update",
        category: "road_closure",
        title: "Main Street closed overnight",
      }),
      "Road Closure"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Local Update",
        category: "traffic_advisory",
        title: "Main Street Speed Limit Reduction",
      }),
      "Traffic Advisory"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Current Local Opportunity",
        category: "community_event",
        title: 'Unity in the Community "A Sheriff\'s Community Celebration"',
      }),
      "Community Event"
    )
  })
})

describe("isWeatherAlertOpportunity", () => {
  it("is true for weather and public-works template topics", () => {
    assert.equal(
      isWeatherAlertOpportunity({
        sourceLabel: "Weather Alert",
        category: "weather",
        title: "Heat Advisory",
      }),
      true
    )
    assert.equal(
      isWeatherAlertOpportunity({
        sourceLabel: "Community News",
        category: "community_event",
        title: "Neighborhood watch meeting",
      }),
      false
    )
  })
})

describe("needsAlertTemplateGraphic", () => {
  it("applies the PIO template to live community events without a source graphic", () => {
    assert.equal(
      needsAlertTemplateGraphic({
        id: "tomorrow-1",
        title: "Unity in the Community",
        category: "community_event",
        sourceLabel: "Current Local Opportunity",
        opportunitySource: "external",
        whyItMatters: "",
        recommendedAction: "",
        recommendedPostTiming: "",
        priority: "plan_ahead",
        status: "new",
      }),
      true
    )
  })
})
