import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  findUnauthorizedClaims,
  groundingFactsFromTipLine,
} from "./pio-claim-grounding"
import { buildCall1Facts, type PressReleasePayload } from "./pio-normalized-facts"

const basePayload = (): PressReleasePayload => ({
  agencyName: "Riverside Police Department",
  city: "Riverside",
  state: "CA",
  incidentType: "investigation",
  incidentSummary:
    "Police are investigating an incident downtown involving a juvenile. Identifying details about the juvenile are not being released. A description of any suspects has not been confirmed.",
  investigationOngoing: true,
  persons: [],
  arrests: [],
  entryType: "none",
  contactName: "PIO",
  contactPhone: "909-555-0100",
  contactEmail: "pio@example.gov",
  tipLine: "909-555-0199",
  protectedVictim: true,
})

describe("pio claim grounding", () => {
  it("flags anonymity when tip line is not anonymous", () => {
    const facts = groundingFactsFromTipLine({ tipLine: "909-555-0199" })
    const v = findUnauthorizedClaims(
      "Anyone with information can provide tips anonymously at 909-555-0199.",
      facts
    )
    assert.ok(v.some((x) => x.claimType === "anonymous_reporting"))
  })

  it("allows anonymity when explicitly authorized", () => {
    const facts = groundingFactsFromTipLine({
      tipLine: "909-555-0199",
      tipLineIsAnonymous: true,
    })
    const v = findUnauthorizedClaims(
      "Tips may be submitted anonymously at 909-555-0199.",
      facts
    )
    assert.equal(v.filter((x) => x.claimType === "anonymous_reporting").length, 0)
  })

  it("flags confidential, safety guarantee, and unauthorized public action", () => {
    const facts = groundingFactsFromTipLine({ tipLine: "909-555-0199" })
    const text =
      "Tips are confidential. You are safe. Please report any suspicious activity."
    const v = findUnauthorizedClaims(text, facts)
    assert.ok(v.some((x) => x.claimType === "confidential_reporting"))
    assert.ok(v.some((x) => x.claimType === "guarantee_of_safety"))
    assert.ok(v.some((x) => x.claimType === "unauthorized_public_action"))
  })

  it("does not map plain tipLine into anonymous_tip_line fact", () => {
    const facts = buildCall1Facts(basePayload())
    assert.equal(facts.tip_line, "909-555-0199")
    assert.equal(facts.anonymous_tip_line, null)
    assert.equal(facts.tip_line_is_anonymous, false)
  })

  it("sets anonymous_tip_line only when authorized", () => {
    const facts = buildCall1Facts({
      ...basePayload(),
      tipLineIsAnonymous: true,
    })
    assert.equal(facts.anonymous_tip_line, "909-555-0199")
    assert.equal(facts.tip_line_is_anonymous, true)
  })

  it("regression: phase4 professional + editorial samples would fail grounding", () => {
    const facts = groundingFactsFromTipLine({ tipLine: "909-555-0199" })
    const professional =
      "Anyone with information is encouraged to contact the department or provide tips anonymously at 909-555-0199."
    const editorial =
      "Residents are encouraged to report any suspicious activity and can contact the department or use the anonymous tip line at 909-555-0199."
    assert.ok(findUnauthorizedClaims(professional, facts).length >= 1)
    assert.ok(findUnauthorizedClaims(editorial, facts).length >= 2)
  })
})
