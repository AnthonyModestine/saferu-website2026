/**
 * Graphic inspection outcome rules — Phase 2A hard QA.
 * Run: npx --yes tsx --test lib/graphic-studio/inspection-types.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  inspectionIsShipable,
  inspectionNeedsCorrection,
  inspectionUnavailable,
  makeCriticalInspection,
  makeUnavailableInspection,
} from "./inspection-types"

describe("graphic inspection outcomes", () => {
  it("does not treat inspection_unavailable as shipable", () => {
    const inspection = makeUnavailableInspection("gpt-4o-mini", "provider timeout")
    assert.equal(inspection.pass, false)
    assert.equal(inspectionIsShipable(inspection), false)
    assert.equal(inspectionUnavailable(inspection), true)
  })

  it("marks critical safety defects as not shipable", () => {
    const inspection = makeCriticalInspection("gpt-4o-mini", [
      {
        category: "safety_accuracy",
        severity: "critical",
        description: "Shows water on grease fire as recommended",
      },
    ])
    assert.equal(inspection.outcome, "critical_failure")
    assert.equal(inspectionIsShipable(inspection), false)
    assert.equal(inspectionNeedsCorrection(inspection), true)
  })

  it("passed_with_notes remains shipable", () => {
    const inspection = {
      outcome: "passed_with_notes" as const,
      pass: true,
      accidentalLogo: false,
      defects: [
        {
          category: "composition" as const,
          severity: "note" as const,
          description: "Slightly soft background",
        },
      ],
      issues: [],
      notes: ["Slightly soft background"],
      model: "gpt-4o-mini",
      inspectedAt: new Date().toISOString(),
    }
    assert.equal(inspectionIsShipable(inspection), true)
  })
})
