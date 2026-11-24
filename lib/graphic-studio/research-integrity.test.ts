import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  assessResearchIntegrity,
  sanitizeClientCreativeStrategyOverride,
} from "./research-integrity"

describe("research-integrity", () => {
  it("never treats confidence alone as verified automation", () => {
    const a = assessResearchIntegrity({
      researchConfidence: "verified",
      sourceRecords: [{ name: "NHTSA", url: "https://example.invalid" }],
    })
    assert.equal(a.treatsAsVerifiedForAutomation, false)
    assert.equal(a.hasAuthoritativeSources, true)
  })

  it("warns when verified lacks sources", () => {
    const a = assessResearchIntegrity({ researchConfidence: "verified", sourceRecords: [] })
    assert.ok(a.warnings.some((w) => /without source_records/i.test(w)))
  })

  it("blocks strategy from overriding approved copy", () => {
    const r = sanitizeClientCreativeStrategyOverride({
      approvedHeadline: "A",
      approvedMessage: "B",
      strategyHeadline: "Hijack",
      strategyMessage: "B",
    })
    assert.equal(r.headline, "A")
    assert.equal(r.message, "B")
    assert.equal(r.rejectedOverride, true)
  })
})
