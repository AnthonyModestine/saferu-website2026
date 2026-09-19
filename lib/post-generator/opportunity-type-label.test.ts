import { describe, expect, it } from "vitest"
import { opportunityPostTypeLabel, opportunityPrimaryLine } from "./opportunity-type-label"
import { cleanDisplayTitle } from "./display-text"

describe("opportunityPrimaryLine", () => {
  it("shows the event name without a redundant Event prefix", () => {
    expect(
      opportunityPrimaryLine({
        category: "community_event",
        title: '- **Event:** Unity in the Community "A Sheriff\'s Community Celebration"',
        sourceLabel: "Current Local Opportunity",
        opportunitySource: "external",
      })
    ).toBe('Unity in the Community "A Sheriff\'s Community Celebration"')
  })

  it("prefixes road closures and alerts", () => {
    expect(
      opportunityPrimaryLine({
        category: "road_closure",
        title: "Market Street closed between 10th and 12th Streets",
        sourceLabel: "Current Local Opportunity",
        opportunitySource: "external",
      })
    ).toBe("Road Closure — Market Street closed between 10th and 12th Streets")
  })
})

describe("cleanDisplayTitle", () => {
  it("strips markdown event labels", () => {
    expect(cleanDisplayTitle('- **Event:** Unity in the Community')).toBe(
      "Unity in the Community"
    )
  })

  it("strips leading colons after type prefixes", () => {
    expect(cleanDisplayTitle("Road Closure — : Main Street Speed Limit Reduction")).toBe(
      "Main Street Speed Limit Reduction"
    )
  })
})

describe("opportunityPostTypeLabel", () => {
  it("labels road closures", () => {
    expect(
      opportunityPostTypeLabel({
        category: "road_closure",
        title: "Market Street closure",
        sourceLabel: "Current Local Opportunity",
        opportunitySource: "external",
      })
    ).toBe("Road Closure")
  })
})
