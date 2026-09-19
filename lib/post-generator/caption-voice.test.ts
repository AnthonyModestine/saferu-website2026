/**

 * Caption voice / agency naming helpers.

 * Run: npx --yes tsx --test lib/post-generator/caption-voice.test.ts

 */



import assert from "node:assert/strict"

import { describe, it } from "node:test"

import {

  buildOpportunityFallbackMessage,

  containsGenericAgencyStandIn,

  hasRealAgencyName,

  pioAgencyLeadIn,

  resolveAgencyDisplayName,

  withPioAgencyAttribution,

} from "./caption-voice"



describe("agency naming helpers", () => {

  it("treats real agency names as real", () => {

    assert.equal(hasRealAgencyName("Springfield PD"), true)

    assert.equal(resolveAgencyDisplayName("Springfield PD"), "Springfield PD")

  })



  it("falls back to your agency when name is missing or placeholder", () => {

    assert.equal(hasRealAgencyName(""), false)

    assert.equal(hasRealAgencyName("our department"), false)

    assert.equal(hasRealAgencyName("the public safety agency"), false)

    assert.equal(resolveAgencyDisplayName(""), "your agency")

    assert.equal(resolveAgencyDisplayName("our department"), "your agency")

  })



  it("attributes template messages with the agency name", () => {

    const msg = withPioAgencyAttribution(

      "A tornado warning is in effect for our area. Move to shelter now.",

      "Springfield PD",

      { title: "Tornado Warning", issuingAuthority: "National Weather Service", sourceLabel: "Weather Alert" }

    )

    assert.match(msg, /Springfield PD is sharing this National Weather Service alert/)

    assert.match(msg, /Tornado Warning/)

    assert.match(msg, /tornado warning/)

  })



  it("names the issuing authority without inventing local police", () => {

    const msg = withPioAgencyAttribution("Move indoors and away from windows.", "", {

      title: "Severe Thunderstorm Warning",

      issuingAuthority: "National Weather Service",

      sourceLabel: "Weather Alert",

    })

    assert.match(msg, /National Weather Service has issued Severe Thunderstorm Warning/)

    assert.equal(containsGenericAgencyStandIn(msg), false)

  })



  it("does not double-wrap when the agency is already named", () => {

    const body = "Springfield PD is advising residents to shelter now."

    assert.equal(withPioAgencyAttribution(body, "Springfield PD"), body)

  })



  it("builds a readable wildfire relay post without NIFC bulletin repetition", () => {
    const msg = buildOpportunityFallbackMessage(
      {
        title: "Wildfire activity: Misery Trail in Chester County",
        summary:
          "NIFC reports Misery Trail (~0 acres) in Chester County, PA. The incident may affect air quality, travel, and outdoor activity nearby.",
        verifiedFacts: [
          'NIFC lists active wildland fire incident "Misery Trail" in Chester County, PA (~0 acres).',
          "Containment was reported at 0% or is not yet fully contained.",
        ],
        publicCallToAction: [
          "Monitor official local fire and emergency management channels.",
          "Be ready to leave quickly if evacuation orders are issued.",
          "Limit outdoor exertion if smoke is visible in your area.",
        ],
        sourceName: "National Interagency Fire Center / InciWeb",
        sourceLabel: "Current Local Opportunity",
        category: "wildfire",
        signals: ["wildfire", "fire_weather", "air_quality"],
      },
      "Demo Township Police Department",
      { city: "San Saba", county: "Chester", state: "PA" }
    )

    assert.match(msg, /Demo Township Police Department is sharing an update from NIFC\/InciWeb/)
    assert.match(msg, /Misery Trail/)
    assert.match(msg, /Chester County, PA/)
    assert.match(msg, /evacuation orders/i)
    assert.doesNotMatch(msg, /NIFC lists active wildland fire incident/i)
    assert.doesNotMatch(msg, /issued a new public alert/i)
  })

  it("builds a readable IC3 relay post without repeating the alert title", () => {
    const msg = buildOpportunityFallbackMessage(
      {
        title: "Russian Intelligence Services Continue to Target Commercial Messaging Applications",
        summary:
          "The FBI Internet Crime Complaint Center (IC3) issued a new public alert: Russian Intelligence Services Continue to Target Commercial Messaging Applications.",
        verifiedFacts: [
          'FBI IC3 published "Russian Intelligence Services Continue to Target Commercial Messaging Applications" on 2026-06-26.',
          "The alert is available on ic3.gov.",
        ],
        publicCallToAction: [
          "Verify unexpected calls, texts, and emails before sending money or personal information.",
          "Report suspected internet crime at ic3.gov.",
        ],
        sourceName: "FBI Internet Crime Complaint Center (IC3)",
        issuingAuthority: "FBI Internet Crime Complaint Center (IC3)",
        sourceLabel: "National Safety Alert",
        category: "scams",
        signals: ["scams", "fbi_alert"],
      },
      "Demo Township Police Department",
      { city: "San Saba", state: "TX" }
    )

    const titleCount = (
      msg.match(/Russian Intelligence Services Continue to Target Commercial Messaging Applications/gi) ||
      []
    ).length
    assert.ok(titleCount <= 1, `title repeated ${titleCount} times`)
    assert.match(msg, /Demo Township Police Department is sharing a public safety notice from the FBI/)
    assert.match(msg, /San Saba, TX/)
    assert.match(msg, /Verify unexpected calls/i)
    assert.doesNotMatch(msg, /issued a new public alert:/i)
  })

  it("builds fallback messages with issuer and agency context", () => {

    const msg = buildOpportunityFallbackMessage(

      {

        title: "Tornado Watch",

        summary: "Conditions are favorable for tornado development.",

        verifiedFacts: ["Affected area: Shelby County"],

        sourceName: "National Weather Service alert",

        issuingAuthority: "National Weather Service",

        sourceLabel: "Weather Alert",

      },

      "Memphis Police Department",
      { city: "Memphis", state: "TN" }
    )

    assert.match(msg, /TORNADO WATCH/)
    assert.match(msg, /A Tornado Watch is in effect for Memphis, TN/i)
    assert.match(msg, /Tornadoes are possible/i)
    assert.match(msg, /shelter|charged/i)

  })



  it("uses issuer-specific lead-in for weather without agency name", () => {

    const lead = pioAgencyLeadIn(null, {

      title: "Heat Advisory",

      issuingAuthority: "National Weather Service",

      sourceLabel: "Weather Alert",

    })

    assert.match(lead, /National Weather Service has issued Heat Advisory/)

  })

})


