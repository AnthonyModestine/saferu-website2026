/**
 * Unit checks for evidence claim matching.
 *
 * Run: npx --yes tsx --test lib/post-generator/evidence-match.test.ts
 *
 * Assumption for dry scenarios: Los Angeles County, CA western agency
 * (NWS / NIFC-style paraphrased claims vs homepage vs structured feed text).
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  allowsSoftOfficialClaimMatch,
  claimAppearsInSource,
  claimTokens,
  distinctiveClaimTokens,
} from "./evidence"

describe("claimAppearsInSource", () => {
  it("hard-matches when most claim tokens appear in the source", () => {
    const claim = "National Weather Service issued a Heat Advisory for Los Angeles County"
    const source =
      "national weather service heat advisory los angeles county through thursday evening"
    assert.equal(claimAppearsInSource(claim, source), true)
  })

  it("hard-match fails for paraphrased claims against a generic homepage", () => {
    const claim =
      'NIFC lists active wildland fire incident "Lake Fire" in Los Angeles County, CA (~1200 acres).'
    const homepage =
      "inciweb wildland fire information incident management teams nationwide resources maps about contact"
    assert.equal(claimAppearsInSource(claim, homepage), false)
  })

  it("softOfficial accepts paraphrased official claims when identity tokens are in the feed", () => {
    const claim =
      'NIFC lists active wildland fire incident "Lake Fire" in Los Angeles County, CA (~1200 acres).'
    const feedJson =
      '{"features":[{"attributes":{"IncidentName":"Lake Fire","POOCounty":"Los Angeles","POOState":"US-CA","DiscoveryAcres":1200}}]}'
    assert.equal(
      claimAppearsInSource(claim, feedJson.toLowerCase(), { softOfficial: true }),
      true
    )
  })

  it("softOfficial rejects when distinctive identity tokens are missing", () => {
    const claim =
      'NIFC lists active wildland fire incident "Lake Fire" in Los Angeles County, CA (~1200 acres).'
    const unrelated = "road closure downtown bridge repair traffic advisory detour available"
    assert.equal(claimAppearsInSource(claim, unrelated, { softOfficial: true }), false)
  })

  it("softOfficial helps NWS forecast paraphrases against forecast API text", () => {
    const claim = "Forecast high temperatures near 102 degrees for Pasadena, CA."
    const forecast =
      "forecast periods tuesday high temperatures near 102 degrees pasadena area hot and sunny"
    assert.equal(claimAppearsInSource(claim, forecast, { softOfficial: true }), true)
  })
})

describe("claim token helpers", () => {
  it("extracts tokens and distinctive place/incident names", () => {
    const tokens = claimTokens("Lake Fire in Los Angeles County listed by NIFC")
    assert.ok(tokens.includes("lake"))
    assert.ok(tokens.includes("angeles"))
    const distinctive = distinctiveClaimTokens(
      'NIFC lists active wildland fire incident "Lake Fire" in Los Angeles County'
    )
    assert.ok(distinctive.includes("lake"))
    assert.ok(distinctive.includes("angeles"))
    assert.ok(!distinctive.includes("lists"))
    assert.ok(!distinctive.includes("fire"))
  })
})

describe("allowsSoftOfficialClaimMatch", () => {
  it("allows official and nifc_wfigs registry sources", () => {
    assert.equal(allowsSoftOfficialClaimMatch("official_operational_authority"), true)
    assert.equal(allowsSoftOfficialClaimMatch("authoritative_data", "nifc_wfigs"), true)
    assert.equal(allowsSoftOfficialClaimMatch("established_local_media"), false)
  })
})

