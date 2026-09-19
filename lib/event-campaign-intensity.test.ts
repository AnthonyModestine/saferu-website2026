import { describe, expect, it } from "vitest"
import {
  applyCampaignIntensity,
  resolveCampaignIntensity,
  type EventCampaignKey,
} from "./event-message-prompts"

function slot(key: EventCampaignKey, day: string) {
  return {
    key,
    timingLabel: key,
    recommendedPostDate: day,
    recommendedPostTime: "10:00 AM",
    timeUntilEvent: "soon",
  }
}

describe("resolveCampaignIntensity", () => {
  it("treats drug take-back as light", () => {
    expect(
      resolveCampaignIntensity({
        eventType: "Drug take-back",
        eventName: "Spring Take Back",
        eventDescription: "Bring unused medication for safe disposal.",
        eventCategory: "",
      })
    ).toBe("light")
  })

  it("detects take-back wording even if type is community event", () => {
    expect(
      resolveCampaignIntensity({
        eventType: "Community event",
        eventName: "DEA Drug Take Back Day",
        eventDescription: "Prescription drop-off in the station parking lot.",
        eventCategory: "",
      })
    ).toBe("light")
  })

  it("treats community events as awareness", () => {
    expect(
      resolveCampaignIntensity({
        eventType: "Community event",
        eventName: "National Night Out",
        eventDescription: "Meet neighbors and first responders at the park.",
        eventCategory: "",
      })
    ).toBe("awareness")
  })
})

describe("applyCampaignIntensity", () => {
  const full = [
    slot("initial_announcement", "2026-09-01"),
    slot("event_highlight", "2026-09-10"),
    slot("one_week_reminder", "2026-09-17"),
    slot("what_to_expect", "2026-09-21"),
    slot("day_before", "2026-09-23"),
    slot("event_day", "2026-09-24"),
    slot("optional_final", "2026-09-24"),
    slot("thank_you", "2026-09-25"),
  ]

  it("keeps a fuller awareness schedule", () => {
    expect(applyCampaignIntensity(full, "awareness")).toHaveLength(8)
  })

  it("caps light campaigns to four practical posts", () => {
    const light = applyCampaignIntensity(full, "light")
    expect(light).toHaveLength(4)
    expect(light.map((s) => s.key)).toEqual([
      "initial_announcement",
      "day_before",
      "event_day",
      "thank_you",
    ])
  })

  it("drops optional final for standard campaigns", () => {
    const standard = applyCampaignIntensity(full, "standard")
    expect(standard.some((s) => s.key === "optional_final")).toBe(false)
    expect(standard.length).toBe(7)
  })
})
