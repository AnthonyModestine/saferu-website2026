/**
 * Contradictory / malformed inspection outcomes must not approve.
 * Run: npx --yes tsx --test lib/graphic-studio/qa-contradiction.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applyLogoExpectationGuards, toInspection } from "./qa-normalize"
import { customerFacingHardQaRequired } from "@/lib/ai-config/phase3"

describe("QA contradiction hardening", () => {
  it("pass=true with critical defect becomes critical_failure", () => {
    const inspection = toInspection(
      {
        pass: true,
        issues: [],
        accidental_logo: false,
        outcome: "passed",
        notes: [],
        defects: [
          {
            category: "text_fidelity",
            severity: "critical",
            description: "Headline does not match",
          },
        ],
      },
      "test-model"
    )
    assert.equal(inspection.pass, false)
    assert.equal(inspection.outcome, "critical_failure")
  })

  it("accidental_logo forces critical failure even if outcome says passed", () => {
    const inspection = toInspection(
      {
        pass: true,
        issues: [],
        accidental_logo: true,
        outcome: "passed",
        notes: [],
        defects: [],
      },
      "test-model"
    )
    assert.equal(inspection.pass, false)
    assert.equal(inspection.outcome, "critical_failure")
  })

  it("customer-facing hard QA is required in production-like defaults", () => {
    const prevDev = process.env.SAFERU_AI_DEV_QA_FAIL_OPEN
    delete process.env.SAFERU_AI_DEV_QA_FAIL_OPEN
    assert.equal(customerFacingHardQaRequired(), true)
    if (prevDev !== undefined) process.env.SAFERU_AI_DEV_QA_FAIL_OPEN = prevDev
  })

  it("subjective tone/panic without safety keywords is demoted", () => {
    const inspection = toInspection(
      {
        pass: false,
        issues: [],
        accidental_logo: false,
        outcome: "critical_failure",
        notes: [],
        extracted_headline: "Carbon Monoxide: Invisible Threat",
        extracted_message: "ok",
        headline_text_status: "match",
        message_text_status: "match",
        creative_notes: [],
        defects: [
          {
            category: "message_clarity",
            severity: "critical",
            description: "The visual may imply urgency that could be misinterpreted as panic",
            evidence: "",
            confidence: "medium",
          },
        ],
      },
      "test-model"
    )
    assert.equal(inspection.defects[0]?.severity, "major")
    assert.equal(inspection.pass, false)
  })

  it("uncertain safety language is NOT demoted or silently passed", () => {
    const inspection = toInspection(
      {
        pass: true,
        issues: [],
        accidental_logo: false,
        outcome: "passed",
        notes: [],
        extracted_headline: "Car Seat Safety for Children",
        extracted_message: "ok",
        headline_text_status: "match",
        message_text_status: "match",
        creative_notes: [],
        defects: [
          {
            category: "safety_accuracy",
            severity: "critical",
            description:
              "The visual may depict a rear-facing seat in front of an active airbag",
            evidence: "front seat area",
            confidence: "low",
          },
        ],
      },
      "test-model"
    )
    assert.equal(inspection.defects[0]?.severity, "critical")
    assert.equal(inspection.outcome, "critical_failure")
    assert.equal(inspection.pass, false)
  })

  it("checklist affirmations in issues[] do not become the issue list", () => {
    const inspection = toInspection(
      {
        pass: false,
        issues: [
          "headline matches approved headline",
          "message matches approved message",
          "visual supports the safety message; does not depict unsafe behavior as recommended",
        ],
        accidental_logo: false,
        outcome: "correction_required",
        notes: [],
        defects: [
          {
            category: "composition",
            severity: "major",
            description: "Slight overcrowding on the left margin",
            evidence: "left third",
          },
        ],
      },
      "test-model"
    )
    assert.ok(!inspection.issues.some((i) => /headline matches approved/i.test(i)))
  })

  it("drops missing-logo complaints when no logo was expected", () => {
    const raw = toInspection(
      {
        pass: false,
        issues: ["Missing expected logo on graphic"],
        accidental_logo: false,
        outcome: "correction_required",
        notes: [],
        defects: [
          {
            category: "agency_branding",
            severity: "major",
            description: "Missing expected logo on graphic",
          },
        ],
      },
      "test-model"
    )
    const guarded = applyLogoExpectationGuards(raw, false)
    assert.equal(guarded.defects.length, 0)
    assert.equal(guarded.pass, true)
  })

  it("demotes airbag icon mistaken as accidental logo when no agency logo expected", () => {
    const raw = toInspection(
      {
        pass: false,
        issues: ["Accidental logo present on the seat back"],
        accidental_logo: true,
        outcome: "critical_failure",
        notes: [],
        defects: [
          {
            category: "agency_branding",
            severity: "critical",
            description: "Accidental logo present on the seat back",
            location: "Back seat headrest",
            evidence: "Visible logo on the seat back with the word 'AIRBAG'",
          },
        ],
      },
      "test-model"
    )
    const guarded = applyLogoExpectationGuards(raw, false)
    assert.equal(guarded.accidentalLogo, false)
    assert.notEqual(guarded.outcome, "critical_failure")
  })
})
