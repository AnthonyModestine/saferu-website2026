import { describe, expect, it } from "vitest"
import {
  formatPostingTimeDisplay,
  normalizePostingTimeGuidance,
  normalizeTimeToken,
} from "./posting-time-display"

describe("normalizeTimeToken", () => {
  it("normalizes varied time formats", () => {
    expect(normalizeTimeToken("7:00 a.m.")).toBe("7:00 AM")
    expect(normalizeTimeToken("12:00 PM")).toBe("12:00 PM")
    expect(normalizeTimeToken("9 a.m.")).toBe("9:00 AM")
  })
})

describe("formatPostingTimeDisplay", () => {
  it("standardizes post-at phrasing with rationale", () => {
    expect(
      formatPostingTimeDisplay(
        "Post at 10:00 a.m. tomorrow so residents see it before the event starts."
      )
    ).toEqual({
      headline: "Post at 10:00 AM on Tomorrow",
      rationale: "So residents see it before the event starts",
    })
  })

  it("standardizes date and time without post-at boilerplate", () => {
    expect(
      formatPostingTimeDisplay("Friday, July 24, 2026, at 12:00 PM")
    ).toEqual({
      headline: "Post at 12:00 PM on Friday, July 24, 2026",
    })
  })

  it("standardizes commute guidance", () => {
    expect(formatPostingTimeDisplay("Post at 7:00 a.m. before peak traffic.")).toEqual({
      headline: "Post at 7:00 AM",
      rationale: "Before peak traffic",
    })
  })
})

describe("normalizePostingTimeGuidance", () => {
  it("stores a normalized guidance string", () => {
    expect(
      normalizePostingTimeGuidance(
        "Post at 7:00 a.m. before peak traffic."
      )
    ).toBe("Post at 7:00 AM. Before peak traffic.")
  })
})
