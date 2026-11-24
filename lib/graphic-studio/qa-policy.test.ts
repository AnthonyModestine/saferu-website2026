/**
 * Hard QA policy: unavailable / critical must never ship.
 * Run: npx --yes tsx --test lib/graphic-studio/qa-policy.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { hardGraphicQaEnabled } from "@/lib/ai-config/phase2"
import {
  inspectionIsShipable,
  makeUnavailableInspection,
  makeCriticalInspection,
} from "./inspection-types"
import { buildCorrectionInstruction } from "./qa-correction"

describe("hard QA policy", () => {
  it("hardGraphicQaEnabled is true unless explicitly disabled", () => {
    const prev = process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN
    delete process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN
    assert.equal(hardGraphicQaEnabled(), true)
    process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN = "1"
    assert.equal(hardGraphicQaEnabled(), false)
    if (prev === undefined) delete process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN
    else process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN = prev
  })

  it("provider failure maps to non-shipable unavailable inspection", () => {
    const inspection = makeUnavailableInspection("gpt-4o-mini", "ECONNRESET")
    assert.equal(inspectionIsShipable(inspection), false)
    assert.equal(inspection.pass, false)
  })

  it("critical branding defect cannot ship even with high subjective taste", () => {
    const inspection = makeCriticalInspection("gpt-4o-mini", [
      {
        category: "agency_branding",
        severity: "critical",
        description: "Fabricated department badge",
      },
    ])
    assert.equal(inspectionIsShipable(inspection), false)
    assert.equal(inspection.accidentalLogo, true)
  })

  it("builds targeted correction instructions from defects", () => {
    const inspection = makeCriticalInspection("gpt-4o-mini", [
      {
        category: "text_fidelity",
        severity: "critical",
        description: "Headline does not match approved text",
        suggestedCorrection: "Render the approved headline exactly",
      },
    ])
    const instruction = buildCorrectionInstruction(inspection)
    assert.match(instruction, /Headline does not match/)
    assert.match(instruction, /approved headline exactly/)
  })
})
