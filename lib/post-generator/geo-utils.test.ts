import { describe, expect, it } from "vitest"
import { normalizeCityForDiscovery } from "./geo-utils"

describe("normalizeCityForDiscovery", () => {
  it("maps Center City Philadelphia to Philadelphia", () => {
    expect(normalizeCityForDiscovery("Center City Philadelphia", "PA")).toBe("Philadelphia")
  })

  it("maps Philly neighborhoods in PA to Philadelphia", () => {
    expect(normalizeCityForDiscovery("Center City", "PA")).toBe("Philadelphia")
    expect(normalizeCityForDiscovery("Fishtown", "PA")).toBe("Philadelphia")
  })

  it("leaves unrelated cities unchanged", () => {
    expect(normalizeCityForDiscovery("Austin", "TX")).toBe("Austin")
  })
})
