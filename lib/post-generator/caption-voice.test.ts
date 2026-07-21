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


