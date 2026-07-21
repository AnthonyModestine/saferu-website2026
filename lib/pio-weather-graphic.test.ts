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
})

describe("weatherAlertHeadline", () => {
  it("derives Tornado Watch / Thunderstorm titles from NWS event text", () => {
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Tornado Watch",
      }),
      "TORNADO WATCH"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Severe Thunderstorm Warning",
      }),
      "THUNDERSTORM WARNING"
    )
    assert.equal(
      weatherAlertHeadline({
        sourceLabel: "Weather Alert",
        category: "severe_storms",
        title: "Severe Thunderstorm",
      }),
      "THUNDERSTORM ALERT"
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
        category: "crime",
        title: "Neighborhood watch meeting",
      }),
      false
    )
  })
})
