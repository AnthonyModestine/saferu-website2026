import { describe, expect, it } from "vitest"
import { extractSourceUrl, parseSourceDisplayName } from "./source-display"
import {
  opportunityAboutText,
  opportunityPostingGuidance,
  opportunityPostingTimeDisplay,
  opportunitySaferuRecommendation,
  opportunitySourceLabel,
} from "./opportunity-card-display"

describe("extractSourceUrl", () => {
  it("extracts markdown link URLs", () => {
    expect(
      extractSourceUrl(
        "([phillypolice.com](https://www.phillypolice.com/districts/39th-district/?utm_source=openai))"
      )
    ).toBe("https://www.phillypolice.com/districts/39th-district/?utm_source=openai")
  })
})

describe("parseSourceDisplayName", () => {
  it("uses markdown link text instead of raw syntax", () => {
    expect(
      parseSourceDisplayName(
        "([phillypolice.com](https://www.phillypolice.com/districts/39th-district/))",
        "https://www.phillypolice.com/districts/39th-district/"
      )
    ).toBe("phillypolice.com")
  })
})

describe("opportunity card display helpers", () => {
  it("shows verified facts as the about line", () => {
    expect(
      opportunityAboutText({
        summary: "Community engagement",
        verifiedFacts: [
          "Coffee with a Cop at 39th District, July 24 at 10:00 a.m.",
          "Open to all residents",
        ],
        recommendedPostTiming: "",
        whyItMatters: "",
        opportunitySource: "external",
      })
    ).toContain("Coffee with a Cop")
  })

  it("formats standardized posting guidance", () => {
    expect(
      opportunityPostingTimeDisplay(
        "Post at 10:00 a.m. tomorrow so residents see it before the event starts."
      )
    ).toEqual({
      headline: "Post at 10:00 AM on Tomorrow",
      rationale: "So residents see it before the event starts",
    })
  })

  it("falls back to verified facts when why-it-matters is generic", () => {
    expect(
      opportunitySaferuRecommendation({
        whyItMatters:
          "Engaging with the community through local events fosters trust and collaboration.",
        verifiedFacts: [
          "Coffee with a Cop at 39th District, July 24 at 10:00 a.m.",
          "Meet officers in a relaxed setting at the district office.",
        ],
        opportunitySource: "external",
      })
    ).toContain("Coffee with a Cop")
  })

  it("cleans markdown from cached source labels", () => {
    expect(
      opportunitySourceLabel({
        sourceName:
          "([phillypolice.com](https://www.phillypolice.com/districts/39th-district/))",
        sourceUrl: "https://www.phillypolice.com/districts/39th-district/",
        opportunitySource: "external",
      })
    ).toBe("phillypolice.com")
  })
})
