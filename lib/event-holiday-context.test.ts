import { describe, expect, it } from "vitest"
import {
  eventHolidayCopy,
  resolveEventHolidayContext,
  westernEasterYmd,
} from "./event-message-prompts"

describe("westernEasterYmd", () => {
  it("matches known Western Easter dates", () => {
    expect(westernEasterYmd(2025)).toBe("2025-04-20")
    expect(westernEasterYmd(2026)).toBe("2026-04-05")
    expect(westernEasterYmd(2027)).toBe("2027-03-28")
  })
})

describe("resolveEventHolidayContext", () => {
  it("detects Halloween by date proximity", () => {
    const holiday = resolveEventHolidayContext({
      eventDate: "2026-10-28",
      eventName: "Station open house",
      eventDescription: "Meet your firefighters and tour the apparatus bay.",
      eventType: "Open house",
    })
    expect(holiday?.id).toBe("halloween")
    expect(holiday?.emojiFocus).toContain("🎃")
  })

  it("detects Christmas by date proximity", () => {
    const holiday = resolveEventHolidayContext({
      eventDate: "2026-12-20",
      eventName: "Community breakfast",
      eventDescription: "Join us for a community breakfast at the station.",
      eventType: "Community event",
    })
    expect(holiday?.id).toBe("christmas")
  })

  it("detects New Year's across year boundary", () => {
    const holiday = resolveEventHolidayContext({
      eventDate: "2026-12-31",
      eventName: "First Night safety booth",
      eventDescription: "Find us at the downtown celebration.",
      eventType: "Community event",
    })
    expect(holiday?.id).toBe("new_years")
  })

  it("detects Fourth of July by name even a bit farther out", () => {
    const holiday = resolveEventHolidayContext({
      eventDate: "2026-07-01",
      eventName: "4th of July parade safety",
      eventDescription: "Officers will be along the parade route.",
      eventType: "Community event",
    })
    expect(holiday?.id).toBe("july_fourth")
    expect(holiday?.emojiFocus).toContain("🇺🇸")
  })

  it("detects Easter near the computed date", () => {
    const holiday = resolveEventHolidayContext({
      eventDate: "2026-04-04",
      eventName: "Spring egg hunt",
      eventDescription: "Family egg hunt at the park.",
      eventType: "Community event",
    })
    expect(holiday?.id).toBe("easter")
    expect(holiday?.holidayDate).toBe("2026-04-05")
  })

  it("returns null when no holiday is nearby", () => {
    expect(
      resolveEventHolidayContext({
        eventDate: "2026-09-15",
        eventName: "National Night Out",
        eventDescription: "Meet neighbors and first responders at the park.",
        eventType: "Community event",
      })
    ).toBeNull()
  })

  it("builds user-facing copy when a holiday matches", () => {
    const holiday = resolveEventHolidayContext({
      eventDate: "2026-10-31",
      eventName: "Halloween safety night",
      eventDescription: "Glow sticks and pedestrian safety tips.",
      eventType: "Community event",
    })
    expect(eventHolidayCopy(holiday)).toMatch(/Halloween/i)
  })
})
