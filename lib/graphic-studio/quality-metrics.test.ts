import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { recordGraphicQualityEvent } from "./quality-metrics"

describe("graphic quality metrics", () => {
  it("records without throwing even when database is unavailable", () => {
    assert.doesNotThrow(() => {
      recordGraphicQualityEvent({
        at: new Date().toISOString(),
        result: "success",
        firstAttemptQaPass: true,
        correctionsAttempted: 0,
        latencyMs: 1200,
        estimatedCostUsd: 0.05,
        promptVersion: "lean-image-v2+autonomy",
        imageVariant: "autonomy",
        hadLogo: false,
      })
    })
  })
})
