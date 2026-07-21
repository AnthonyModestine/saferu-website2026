/**
 * Weather alert PIO message helpers.
 * Run: npx --yes tsx --test lib/post-generator/weather-alert-message.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  buildWeatherAlertPost,
  localizeAlertArea,
  weatherSafetyReminder,
} from "./weather-alert-message"

const MULTI_COUNTY_AREA =
  "New Castle; Morris; Hunterdon; Somerset; Middlesex; Western Monmouth; Eastern Monmouth; Mercer; Gloucester; Camden; Northwestern Burlington; Delaware; Philadelphia; Western Chester; Eastern Chester; Western Montgomery; Eastern Montgomery; Upper Bucks; Lower Bucks"

describe("weather alert messages", () => {
  it("localizes multi-county NWS areas to the agency community", () => {
    assert.equal(
      localizeAlertArea(MULTI_COUNTY_AREA, {
        city: "Lansdale",
        county: "Montgomery",
        state: "PA",
      }),
      "Lansdale, PA"
    )
    assert.equal(
      localizeAlertArea(MULTI_COUNTY_AREA, {
        county: "Montgomery",
        state: "PA",
      }),
      "Montgomery County, PA"
    )
    assert.doesNotMatch(
      localizeAlertArea(MULTI_COUNTY_AREA, { city: "Lansdale", state: "PA" }),
      /Hunterdon|Morris/
    )
  })

  it("builds a short flood watch post without listing every county", () => {
    const msg = buildWeatherAlertPost(
      {
        title: "Flood Watch",
        verifiedFacts: [
          `Flood Watch issued July 20 at 2:44PM EDT until July 22 at 2:00AM EDT by NWS Mount Holly NJ`,
          `Affected area: ${MULTI_COUNTY_AREA}`,
        ],
        publicCallToAction: [
          "You should monitor later forecasts and be prepared to take action should Flash Flood Warnings be issued.",
        ],
        sourceLabel: "Weather Alert",
      },
      {
        agencyName: "Lansdale Borough Police Department",
        city: "Lansdale",
        county: "Montgomery",
        state: "PA",
      }
    )

    assert.match(msg, /FLOOD WATCH/)
    assert.match(msg, /A Flood Watch is in effect for Lansdale, PA/i)
    assert.match(msg, /Flooding is possible/i)
    assert.match(msg, /flooded roads|Flash Flood Warning/i)
    assert.doesNotMatch(msg, /is possible in Lansdale/)
    assert.doesNotMatch(msg, /Hunterdon/)
    assert.doesNotMatch(msg, /is sharing a Flood Watch/)
    assert.doesNotMatch(msg, /Safety reminder:/)
    assert.doesNotMatch(msg, /From the National Weather Service:/)
  })

  it("builds a warning post with matching header and body product", () => {
    const msg = buildWeatherAlertPost(
      {
        title: "Tornado Warning",
        verifiedFacts: ["Affected area: Shelby County"],
        publicCallToAction: ["Take shelter now."],
        sourceLabel: "Weather Alert",
      },
      { city: "Memphis", state: "TN" }
    )

    assert.match(msg, /TORNADO WARNING — TAKE SHELTER NOW/)
    assert.match(msg, /A Tornado Warning is in effect for Memphis, TN/i)
    assert.match(msg, /Take shelter now/i)
  })

  it("names NWS and one safety line for non-watch advisory without agency name", () => {
    const msg = buildWeatherAlertPost(
      {
        title: "Heat Advisory",
        verifiedFacts: ["Affected area: Shelby County"],
        sourceLabel: "Weather Alert",
      },
      { city: "Memphis", state: "TN" }
    )

    assert.match(msg, /National Weather Service has issued a Heat Advisory for Memphis, TN/)
    assert.match(msg, /water|outdoors/i)
  })

  it("maps alert types to practical safety reminders", () => {
    assert.match(weatherSafetyReminder("Severe Thunderstorm Warning"), /indoors/i)
    assert.match(weatherSafetyReminder("Heat Advisory"), /water|outdoors/i)
  })
})
