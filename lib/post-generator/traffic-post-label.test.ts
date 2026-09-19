import { describe, expect, it } from "vitest"
import {
  inferTrafficCategory,
  isActualRoadClosure,
  isSpeedLimitChange,
  trafficPostTypeLabel,
} from "./traffic-post-label"
import { opportunityPostTypeLabel, opportunityPrimaryLine } from "./opportunity-type-label"

describe("traffic-post-label", () => {
  it("detects speed limit changes without treating them as closures", () => {
    const text =
      "Main Street Speed Limit Reduction on West Main Street between Valley Forge Road and Cannon Avenue, reduced from 35 mph to 25 mph"
    expect(isSpeedLimitChange(text)).toBe(true)
    expect(isActualRoadClosure(text)).toBe(false)
    expect(trafficPostTypeLabel(text)).toBe("Traffic Advisory")
    expect(inferTrafficCategory(text)).toBe("traffic_advisory")
  })

  it("detects actual road closures", () => {
    const text = "Market Street closed between 10th and 12th Streets for utility work"
    expect(isActualRoadClosure(text)).toBe(true)
    expect(trafficPostTypeLabel(text)).toBe("Road Closure")
  })
})

describe("opportunity labels for speed limits", () => {
  it("does not prefix speed limit posts as road closures", () => {
    expect(
      opportunityPostTypeLabel({
        category: "traffic_advisory",
        title: "Main Street Speed Limit Reduction",
        sourceLabel: "Current Local Opportunity",
        opportunitySource: "external",
      })
    ).toBe("Traffic Advisory")

    expect(
      opportunityPrimaryLine({
        category: "traffic_advisory",
        title: "Main Street Speed Limit Reduction",
        sourceLabel: "Current Local Opportunity",
        opportunitySource: "external",
        verifiedFacts: [
          "West Main Street between Valley Forge Road and Cannon Avenue reduced from 35 mph to 25 mph",
        ],
      })
    ).toBe("Traffic Advisory — Main Street Speed Limit Reduction")
  })
})
