/**
 * Script-based post message generation.
 * Run: npx --yes tsx --test lib/post-generator/post-message/post-message.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { classifyPostMessage } from "./classify"
import { extractPostMessagePlaceholders } from "./extract-placeholders"
import { fillScriptDeterministic } from "./generate-post-message"
import { getMessageScript } from "./scripts"
import type { PostMessageInput } from "./types"

const thunderstormWatchInput: PostMessageInput = {
  agencyName: "Lansdale Borough Police Department",
  title: "Severe Thunderstorm Watch",
  issuingAuthority: "National Weather Service",
  verifiedFacts: [
    {
      id: "fact-1",
      text: "Severe Thunderstorm Watch issued at 6:15 PM until 7:00 PM for Lansdale Borough and central Montgomery County.",
    },
    { id: "fact-2", text: "Storms may produce 60 mph wind gusts and quarter-size hail." },
  ],
  publicCallToAction: ["Be prepared to move indoors if a warning is issued."],
}

describe("post-message scripts", () => {
  it("classifies severe thunderstorm watch", () => {
    const classification = classifyPostMessage(thunderstormWatchInput)
    assert.equal(classification.incidentCategory, "severe_thunderstorm")
    assert.equal(classification.status, "watch")
    assert.match(classification.scriptId, /severe_thunderstorm_watch/)
  })

  it("classifies severe thunderstorm warning", () => {
    const classification = classifyPostMessage({
      ...thunderstormWatchInput,
      title: "Severe Thunderstorm Warning",
      verifiedFacts: [
        {
          id: "fact-1",
          text: "Severe Thunderstorm Warning until 7:00 PM for Lansdale Borough.",
        },
        { id: "fact-2", text: "Move indoors immediately." },
      ],
      publicCallToAction: ["Move indoors immediately and stay away from windows."],
    })
    assert.equal(classification.status, "warning")
    assert.equal(classification.scriptId, "severe_thunderstorm_warning")
  })

  it("extracts structured placeholders from verified facts", () => {
    const placeholders = extractPostMessagePlaceholders(thunderstormWatchInput, {
      city: "Lansdale",
      state: "PA",
    })
    assert.equal(placeholders.agencyName, "Lansdale Borough Police Department")
    assert.equal(placeholders.alertType, "Severe Thunderstorm Watch")
    assert.match(placeholders.affectedArea || "", /Lansdale/i)
    assert.ok(placeholders.primaryThreats?.length)
  })

  it("fills watch script deterministically without leaving brackets", () => {
    const placeholders = extractPostMessagePlaceholders(thunderstormWatchInput, {
      city: "Lansdale",
      state: "PA",
    })
    const script = getMessageScript("severe_thunderstorm_watch_short")
    const post = fillScriptDeterministic(script.template, placeholders)
    assert.doesNotMatch(post, /\[/)
    assert.match(post, /weather-aware/i)
  })

  it("classifies boil-water advisory", () => {
    const classification = classifyPostMessage({
      agencyName: "Lansdale Borough Police Department",
      title: "Boil Water Advisory",
      verifiedFacts: [
        {
          id: "fact-1",
          text: "Boil-water advisory for customers on Main Street due to a water main break.",
        },
      ],
    })
    assert.equal(classification.incidentCategory, "boil_water")
    assert.equal(classification.scriptId, "boil_water_advisory")
  })

  it("classifies tornado warning with dedicated script", () => {
    const classification = classifyPostMessage({
      agencyName: "Lansdale Borough Police Department",
      title: "Tornado Warning",
      verifiedFacts: [
        { id: "fact-1", text: "Tornado Warning until 7:00 PM for Lansdale Borough." },
        { id: "fact-2", text: "Move to an interior room on the lowest floor." },
      ],
    })
    assert.equal(classification.incidentCategory, "tornado")
    assert.equal(classification.status, "warning")
    assert.equal(classification.scriptId, "tornado_warning")
  })

  it("classifies flood watch with dedicated script", () => {
    const classification = classifyPostMessage({
      agencyName: "Lansdale Borough Police Department",
      title: "Flood Watch",
      verifiedFacts: [
        { id: "fact-1", text: "Flood Watch until 10:00 PM for Montgomery County." },
      ],
    })
    assert.equal(classification.incidentCategory, "flood")
    assert.equal(classification.status, "watch")
    assert.match(classification.scriptId, /flood_watch/)
  })

  it("classifies power outage active", () => {
    const classification = classifyPostMessage({
      agencyName: "Lansdale Borough Police Department",
      title: "Power Outage",
      issuingAuthority: "PECO",
      verifiedFacts: [
        { id: "fact-1", text: "Power outage affecting 2,000 customers in Lansdale Borough." },
        { id: "fact-2", text: "Report downed lines to PECO." },
      ],
    })
    assert.equal(classification.incidentCategory, "power_outage")
    assert.equal(classification.scriptId, "power_outage_active")
  })

  it("classifies missing person request", () => {
    const classification = classifyPostMessage({
      agencyName: "Lansdale Borough Police Department",
      title: "Missing Person",
      verifiedFacts: [
        {
          id: "fact-1",
          text: "Missing: 16-year-old male last seen near Main Street at 8:00 PM.",
        },
        { id: "fact-2", text: "Call 215-555-0100 with information." },
      ],
      publicCallToAction: ["Call 215-555-0100 with information."],
    })
    assert.equal(classification.incidentCategory, "missing_person")
    assert.equal(classification.scriptId, "missing_person")
  })
})
