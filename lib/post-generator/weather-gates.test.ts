import { describe, expect, it } from "vitest"
import { shouldRejectOrdinaryWeather } from "./weather-gates"

describe("shouldRejectOrdinaryWeather", () => {
  it("rejects pleasant routine forecasts", () => {
    expect(
      shouldRejectOrdinaryWeather({
        title: "Nice weather tomorrow",
        summary: "Mostly sunny with a high of 75 degrees",
        whyItMatters: "Residents can enjoy a pleasant day outdoors.",
        category: "weather",
        sourceLabel: "Current Local Opportunity",
        verifiedFacts: ["High of 75, low of 58, partly cloudy"],
        suggestedMessage: "Tomorrow looks like a beautiful day in Philadelphia!",
      })
    ).toBe(true)
  })

  it("keeps official heat warnings", () => {
    expect(
      shouldRejectOrdinaryWeather({
        title: "Excessive Heat Warning",
        summary: "Heat index up to 105°F tomorrow afternoon",
        whyItMatters: "Residents should limit outdoor activity and check on vulnerable neighbors.",
        category: "weather",
        sourceLabel: "Current Local Opportunity",
        sourceName: "National Weather Service",
        verifiedFacts: ["Excessive Heat Warning in effect until 8 p.m."],
        suggestedMessage:
          "The National Weather Service has issued an Excessive Heat Warning for tomorrow.",
      })
    ).toBe(false)
  })
})
