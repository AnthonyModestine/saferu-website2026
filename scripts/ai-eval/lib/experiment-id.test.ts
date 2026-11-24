import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  experimentId,
  fingerprintConfig,
  graphicExperimentId,
} from "./experiment-id"

describe("experiment-id", () => {
  it("is stable for identical inputs", () => {
    const a = experimentId({
      kind: "graphic",
      fixtureId: "co-awareness",
      variant: "phase2_deterministic",
      model: "gpt-image-2.5-sunburst",
      promptVersion: "phase2-v1",
      configFingerprint: "abc",
    })
    const b = experimentId({
      kind: "graphic",
      fixtureId: "co-awareness",
      variant: "phase2_deterministic",
      model: "gpt-image-2.5-sunburst",
      promptVersion: "phase2-v1",
      configFingerprint: "abc",
    })
    assert.equal(a, b)
  })

  it("changes when prompt version changes", () => {
    const a = graphicExperimentId({
      topicId: "co-awareness",
      variant: "generic",
      model: "gpt-image-2.5-sunburst",
      promptVersion: "v0",
      env: { SAFERU_AI_PROMPT_MODE: "generic" },
    })
    const b = graphicExperimentId({
      topicId: "co-awareness",
      variant: "generic",
      model: "gpt-image-2.5-sunburst",
      promptVersion: "v1",
      env: { SAFERU_AI_PROMPT_MODE: "generic" },
    })
    assert.notEqual(a, b)
  })

  it("fingerprints only SAFERU_AI_ keys and ignores order", () => {
    const a = fingerprintConfig({
      SAFERU_AI_PROMPT_MODE: "phase2",
      SAFERU_AI_CREATIVE_DIRECTION: "1",
      OTHER: "x",
    })
    const b = fingerprintConfig({
      SAFERU_AI_CREATIVE_DIRECTION: "1",
      SAFERU_AI_PROMPT_MODE: "phase2",
    })
    assert.equal(a, b)
  })
})
