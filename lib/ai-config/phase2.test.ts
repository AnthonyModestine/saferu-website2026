/**
 * Phase 2 config flags — experimental settings must not silently become defaults.
 * Run: npx --yes tsx --test lib/ai-config/phase2.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  creativeDirectionEnabled,
  hardGraphicQaEnabled,
  imageExperimentVariant,
  resolveImageModelAndQuality,
  spanishReviewEnabled,
} from "./phase2"

describe("phase2 config", () => {
  it("keeps hard QA on by default", () => {
    const prev = process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN
    delete process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN
    assert.equal(hardGraphicQaEnabled(), true)
    if (prev !== undefined) process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN = prev
  })

  it("keeps creative direction off by default", () => {
    const prev = process.env.SAFERU_AI_CREATIVE_DIRECTION
    delete process.env.SAFERU_AI_CREATIVE_DIRECTION
    assert.equal(creativeDirectionEnabled(), false)
    if (prev !== undefined) process.env.SAFERU_AI_CREATIVE_DIRECTION = prev
  })

  it("defaults image experiment to baseline high quality sunburst 2.5", () => {
    const prev = process.env.SAFERU_AI_IMAGE_EXPERIMENT
    delete process.env.SAFERU_AI_IMAGE_EXPERIMENT
    assert.equal(imageExperimentVariant(), "baseline")
    const resolved = resolveImageModelAndQuality()
    assert.equal(resolved.quality, "high")
    assert.match(resolved.model, /sunburst|gpt-image/)
    if (prev !== undefined) process.env.SAFERU_AI_IMAGE_EXPERIMENT = prev
  })

  it("keeps spanish review off by default", () => {
    const prev = process.env.SAFERU_AI_SPANISH_REVIEW
    delete process.env.SAFERU_AI_SPANISH_REVIEW
    assert.equal(spanishReviewEnabled(), false)
    if (prev !== undefined) process.env.SAFERU_AI_SPANISH_REVIEW = prev
  })
})
