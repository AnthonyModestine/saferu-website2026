/** Recurring public-safety calendar — observances, holidays, seasonal signals. */

export type CalendarEntry = {
  id: string
  label: string
  /** Month 1–12 */
  month?: number
  /** Day of month */
  day?: number
  /** Week of month for floating observances (e.g. Fire Prevention Week = Oct week containing 9th) */
  weekContainingDay?: { month: number; day: number }
  durationDays?: number
  signals: string[]
  category: string
  priority: "urgent" | "recommended_today" | "plan_ahead"
}

const OBSERVANCES: CalendarEntry[] = [
  {
    id: "vehicle-theft-month",
    label: "Vehicle Theft Prevention Month",
    month: 7,
    signals: ["vehicle_theft", "vehicle_security", "9pm_routine"],
    category: "crime_prevention",
    priority: "plan_ahead",
  },
  {
    id: "national-preparedness",
    label: "National Preparedness Month",
    month: 9,
    signals: ["emergency_preparedness", "disaster_kit"],
    category: "emergency_preparedness",
    priority: "plan_ahead",
  },
  {
    id: "fire-prevention-week",
    label: "Fire Prevention Week",
    month: 10,
    weekContainingDay: { month: 10, day: 9 },
    durationDays: 7,
    signals: ["fire_safety", "smoke_alarm", "escape_plan"],
    category: "fire_prevention",
    priority: "recommended_today",
  },
  {
    id: "distracted-driving",
    label: "Distracted Driving Awareness Month",
    month: 4,
    signals: ["distracted_driving", "traffic_safety"],
    category: "traffic_safety",
    priority: "plan_ahead",
  },
  {
    id: "ems-week",
    label: "EMS Week",
    month: 5,
    weekContainingDay: { month: 5, day: 21 },
    durationDays: 7,
    signals: ["ems", "emergency_medical"],
    category: "community",
    priority: "plan_ahead",
  },
  {
    id: "police-week",
    label: "National Police Week",
    month: 5,
    weekContainingDay: { month: 5, day: 15 },
    durationDays: 7,
    signals: ["police_week", "community_engagement"],
    category: "community",
    priority: "plan_ahead",
  },
]

const HOLIDAYS: CalendarEntry[] = [
  { id: "new-years", label: "New Year's Eve/Day", month: 1, day: 1, signals: ["impaired_driving", "celebration_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "valentines-day", label: "Valentine's Day", month: 2, day: 14, signals: ["romance_scams", "online_scams"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "presidents-day", label: "Presidents' Day", month: 2, day: 17, signals: ["travel_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "easter", label: "Easter", month: 4, day: 20, signals: ["travel_safety", "pedestrian_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "mothers-day", label: "Mother's Day", month: 5, day: 11, signals: ["community_engagement"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "memorial-day", label: "Memorial Day travel", month: 5, day: 26, signals: ["travel_safety", "impaired_driving", "seatbelts"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "fathers-day", label: "Father's Day", month: 6, day: 15, signals: ["community_engagement"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "july-fourth", label: "Independence Day", month: 7, day: 4, signals: ["fireworks_safety", "impaired_driving", "water_safety"], category: "holiday_safety", priority: "recommended_today" },
  { id: "labor-day", label: "Labor Day travel", month: 9, day: 1, signals: ["travel_safety", "impaired_driving"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "halloween", label: "Halloween", month: 10, day: 31, signals: ["pedestrian_safety", "costume_safety", "candy_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "veterans-day", label: "Veterans Day", month: 11, day: 11, signals: ["community_engagement"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "thanksgiving", label: "Thanksgiving cooking safety", month: 11, day: 27, signals: ["cooking_safety", "travel_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "hanukkah", label: "Hanukkah", month: 12, day: 15, signals: ["candle_safety", "heating_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "holiday-shopping", label: "Holiday shopping season", month: 12, day: 1, signals: ["package_theft", "scams", "parking_lot_safety"], category: "crime_prevention", priority: "recommended_today" },
  { id: "christmas", label: "Christmas", month: 12, day: 25, signals: ["carbon_monoxide", "heating_safety", "travel_safety"], category: "holiday_safety", priority: "plan_ahead" },
  { id: "kwanzaa", label: "Kwanzaa", month: 12, day: 26, signals: ["candle_safety", "community_engagement"], category: "holiday_safety", priority: "plan_ahead" },
]

const SEASONAL: CalendarEntry[] = [
  { id: "winter-storms", label: "Winter storm season", month: 1, signals: ["winter_weather", "cold_exposure", "ice_safety"], category: "weather", priority: "plan_ahead" },
  { id: "spring-flooding", label: "Spring flooding season", month: 3, signals: ["flooding", "flood_safety"], category: "weather", priority: "plan_ahead" },
  { id: "severe-weather", label: "Severe weather season", month: 4, signals: ["severe_storms", "tornado_preparedness"], category: "weather", priority: "plan_ahead" },
  { id: "motorcycle-season", label: "Motorcycle season", month: 5, signals: ["motorcycle_safety", "traffic_safety"], category: "traffic_safety", priority: "plan_ahead" },
  { id: "pool-season", label: "Pool and water safety season", month: 6, signals: ["water_safety", "drowning_prevention"], category: "water_safety", priority: "recommended_today" },
  { id: "extreme-heat", label: "Extreme heat season", month: 7, signals: ["extreme_heat", "heat_illness", "hot_vehicle"], category: "weather", priority: "recommended_today" },
  { id: "hurricane-season", label: "Hurricane season", month: 6, signals: ["hurricane", "tropical_weather", "emergency_preparedness"], category: "weather", priority: "plan_ahead" },
  { id: "back-to-school", label: "Back-to-school", month: 8, signals: ["school_safety", "school_bus", "school_zone"], category: "school_safety", priority: "recommended_today" },
  { id: "fireworks-season", label: "Fireworks season", month: 6, signals: ["fireworks_safety"], category: "fire_prevention", priority: "plan_ahead" },
]

function weekStart(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  const day = copy.getDay()
  copy.setDate(copy.getDate() - day)
  return copy
}

function isInWeekContaining(date: Date, month: number, day: number): boolean {
  const target = new Date(date.getFullYear(), month - 1, day)
  const ws = weekStart(target)
  const we = new Date(ws)
  we.setDate(we.getDate() + 6)
  return date >= ws && date <= we
}

function isNear(date: Date, month: number, day: number, windowDays = 14): boolean {
  const year = date.getFullYear()
  const target = new Date(year, month - 1, day)
  const daysUntil = (target.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  // Recommend in advance and on the observance—not for two weeks afterward.
  return daysUntil >= -1 && daysUntil <= windowDays
}

export function getSeason(month: number): "winter" | "spring" | "summer" | "fall" {
  if (month === 12 || month <= 2) return "winter"
  if (month <= 5) return "spring"
  if (month <= 8) return "summer"
  return "fall"
}

export function getActiveCalendarEntries(date: Date): CalendarEntry[] {
  const month = date.getMonth() + 1
  const all = [...OBSERVANCES, ...HOLIDAYS, ...SEASONAL]
  return all.filter((entry) => {
    if (entry.weekContainingDay) {
      const { month: m, day: d } = entry.weekContainingDay
      return isInWeekContaining(date, m, d)
    }
    if (entry.month && entry.day) {
      const windowDays =
        entry.category === "holiday_safety" && entry.day ? 7 : entry.durationDays ? 21 : 14
      return isNear(date, entry.month, entry.day, windowDays)
    }
    if (entry.month) {
      return entry.month === month
    }
    return false
  })
}

export function getSeasonalSignals(month: number): string[] {
  const season = getSeason(month)
  const base: Record<string, string[]> = {
    winter: ["cold_exposure", "heating_safety", "carbon_monoxide", "ice_safety", "winter_weather"],
    spring: ["flooding", "severe_storms", "tornado_preparedness"],
    summer: ["extreme_heat", "heat_illness", "hot_vehicle", "water_safety", "fireworks_safety"],
    fall: ["fire_safety", "smoke_alarm", "school_safety", "holiday_safety"],
  }
  return base[season] ?? []
}
