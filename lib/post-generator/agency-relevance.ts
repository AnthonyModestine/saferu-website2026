import type { DepartmentType } from "@/lib/department-types"
import { formatDepartmentLabel } from "@/lib/department-types"

/**
 * Agency-specific communication profile for the Post Idea Generator.
 * Same event can score differently — and get different messaging — by agency type.
 */

export type AgencyCommunicationProfile = {
  preferredSignals: string[]
  adjacentSignals: string[]
  avoidSignals: string[]
  /** Role-specific angle used when drafting messages for a shared topic. */
  messagingAngles: Record<string, string>
}

const POLICE_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "crime_prevention",
    "vehicle_theft",
    "vehicle_security",
    "9pm_routine",
    "scams",
    "fraud",
    "burglary",
    "package_theft",
    "traffic_safety",
    "road_closure",
    "travel_delay",
    "pedestrian_safety",
    "impaired_driving",
    "community_engagement",
    "local_event",
    "event_promotion",
    "missing_person",
    "amber_alert",
    "school_safety",
    "school_zone",
  ],
  adjacentSignals: [
    "extreme_heat",
    "hot_vehicle",
    "severe_storms",
    "flooding",
    "weather_safety",
    "emergency_preparedness",
  ],
  avoidSignals: ["outdoor_burning", "wildfire", "smoke_alarm", "cooking_safety", "cpr"],
  messagingAngles: {
    extreme_heat:
      "Frame around community welfare checks, vehicle heat risk, and looking out for vulnerable neighbors.",
    hot_vehicle: "Lead with never leaving children or pets in vehicles; mention welfare-check awareness.",
    flooding: "Focus on avoiding flooded roads, turn-around-dont-drown, and travel safety.",
    severe_storms: "Focus on travel impacts, staying off roads, and watching for downed wires as traffic hazards.",
    community_engagement: "Speak as the host or public-safety partner inviting residents to meet officers.",
    scams: "Warn residents of the scam pattern and how to verify callers before sharing money or data.",
    road_closure: "Give clear avoid/detour guidance for motorists and emergency-access awareness.",
  },
}

const FIRE_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "fire_safety",
    "smoke_alarm",
    "escape_plan",
    "cooking_safety",
    "wildfire",
    "fire_weather",
    "outdoor_burning",
    "burn_ban",
    "extreme_heat",
    "heat_illness",
    "severe_storms",
    "flooding",
    "weather_safety",
    "emergency_preparedness",
    "community_engagement",
    "local_event",
  ],
  adjacentSignals: ["hot_vehicle", "power_outage", "high_winds", "water_safety"],
  avoidSignals: ["vehicle_theft", "9pm_routine", "package_theft", "scams", "fraud"],
  messagingAngles: {
    extreme_heat:
      "Frame around outdoor fire danger, hydration for crews/residents, and avoiding outdoor burning when heat/dry.",
    hot_vehicle: "Tie to heat illness risk outdoors and checking vehicles for children/pets during hot weather.",
    flooding: "Focus on floodwater hazards, electrical safety near water, and staying off flooded roads.",
    severe_storms: "Focus on structure/fire risks, generator safety, and watching for downed power lines.",
    community_engagement: "Invite residents to station events, safety demos, or fire-prevention education.",
    fire_safety: "Lead with prevention actions residents can take today (alarms, escape plans, cooking safety).",
  },
}

const EMS_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "heat_illness",
    "extreme_heat",
    "hot_vehicle",
    "weather_safety",
    "severe_storms",
    "flooding",
    "winter_weather",
    "cold_exposure",
    "cpr",
    "cardiac",
    "public_health",
    "senior_safety",
    "child_safety",
    "emergency_preparedness",
    "community_engagement",
  ],
  adjacentSignals: ["water_safety", "road_closure", "impaired_driving", "local_event"],
  avoidSignals: ["vehicle_theft", "package_theft", "burn_ban", "wildfire", "outdoor_burning"],
  messagingAngles: {
    extreme_heat:
      "Frame around heat stroke/exhaustion symptoms, hydration, and when to call 911.",
    hot_vehicle: "Lead with medical risk of heat illness in vehicles; urge immediate 911 for distress.",
    flooding: "Focus on medical risks of floodwater exposure and avoiding stranded-vehicle situations.",
    severe_storms: "Focus on injury prevention, emergency medical readiness, and calling 911 only for true emergencies.",
    community_engagement: "Invite residents to CPR awareness, health screenings, or EMS education events.",
  },
}

const EMERGENCY_MGMT_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "emergency_preparedness",
    "extreme_heat",
    "heat_illness",
    "cooling_center",
    "severe_storms",
    "flooding",
    "flood_safety",
    "winter_weather",
    "power_outage",
    "high_winds",
    "wildfire",
    "weather_safety",
    "road_closure",
    "community_engagement",
    "local_event",
  ],
  adjacentSignals: ["hot_vehicle", "school_safety", "senior_safety"],
  avoidSignals: ["vehicle_theft", "9pm_routine", "package_theft", "scams"],
  messagingAngles: {
    extreme_heat:
      "Frame around cooling centers, emergency alerts, and household preparedness for extreme heat.",
    hot_vehicle: "Include as part of broader extreme-heat preparedness messaging.",
    flooding: "Lead with watches/warnings, evacuation readiness, and official alert channels.",
    severe_storms: "Lead with shelter-in-place prep, kits, and monitoring official alerts.",
    community_engagement: "Promote preparedness events and official emergency notification signup.",
  },
}

const MUNICIPALITY_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "road_closure",
    "travel_delay",
    "traffic_safety",
    "power_outage",
    "utility",
    "community_engagement",
    "local_event",
    "event_promotion",
    "extreme_heat",
    "flooding",
    "severe_storms",
    "weather_safety",
    "emergency_preparedness",
    "public_health",
  ],
  adjacentSignals: [
    "scams",
    "crime_prevention",
    "fire_safety",
    "school_safety",
    "hot_vehicle",
  ],
  avoidSignals: [],
  messagingAngles: {
    extreme_heat:
      "Frame as a community service update: cooling resources, outdoor event adjustments, and looking out for neighbors.",
    flooding: "Focus on local road impacts, service disruptions, and official municipal guidance.",
    severe_storms: "Share service impacts, facility closures, and where residents can get updates.",
    community_engagement: "Promote civic events and municipal services in a welcoming local-government voice.",
    road_closure: "Give clear local travel guidance tied to municipal/public works operations.",
  },
}

const OTHER_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "community_engagement",
    "local_event",
    "weather_safety",
    "emergency_preparedness",
    "extreme_heat",
    "road_closure",
    "public_health",
  ],
  adjacentSignals: [
    "crime_prevention",
    "fire_safety",
    "heat_illness",
    "flooding",
    "scams",
  ],
  avoidSignals: [],
  messagingAngles: {
    extreme_heat: "Share practical heat-safety steps residents can act on today.",
    community_engagement: "Invite participation and keep the tone helpful and local.",
  },
}

const PROFILES: Record<DepartmentType, AgencyCommunicationProfile> = {
  police: POLICE_PROFILE,
  sheriff: POLICE_PROFILE,
  state_police: POLICE_PROFILE,
  fire: FIRE_PROFILE,
  ems: EMS_PROFILE,
  emergency_management: EMERGENCY_MGMT_PROFILE,
  municipality: MUNICIPALITY_PROFILE,
  other: OTHER_PROFILE,
}

export function getAgencyProfile(agencyType?: string | null): AgencyCommunicationProfile {
  if (agencyType && agencyType in PROFILES) {
    return PROFILES[agencyType as DepartmentType]
  }
  return OTHER_PROFILE
}

export function agencyTypeLabel(agencyType?: string | null, agencyTypeOther?: string | null): string {
  return formatDepartmentLabel(agencyType, agencyTypeOther)
}

/** Score 0–100 for how well this opportunity fits the agency's communication role. */
export function scoreAgencyRelevance(
  signals: string[],
  category: string,
  agencyType?: string | null
): { score: number; reason: string } {
  const profile = getAgencyProfile(agencyType)
  const tags = new Set(
    [...signals, category]
      .map((s) => s.toLowerCase().replace(/\s+/g, "_"))
      .filter(Boolean)
  )

  let preferredHits = 0
  let adjacentHits = 0
  let avoidHits = 0
  for (const tag of tags) {
    if (profile.preferredSignals.some((s) => tag.includes(s) || s.includes(tag))) preferredHits++
    else if (profile.adjacentSignals.some((s) => tag.includes(s) || s.includes(tag))) adjacentHits++
    if (profile.avoidSignals.some((s) => tag.includes(s) || s.includes(tag))) avoidHits++
  }

  if (preferredHits === 0 && adjacentHits === 0 && avoidHits > 0) {
    return { score: 15, reason: "Outside this agency's typical communication role." }
  }
  if (preferredHits === 0 && adjacentHits === 0) {
    return { score: 45, reason: "Weak agency-role fit; only surface if strongly local and actionable." }
  }
  if (preferredHits === 0 && adjacentHits > 0) {
    return { score: 62, reason: "Adjacent to this agency's mission; keep role-specific framing." }
  }
  if (avoidHits > 0 && preferredHits > 0) {
    return { score: 70, reason: "Relevant to this agency with some off-mission elements." }
  }
  if (preferredHits >= 2) {
    return { score: 95, reason: "Strong match for this agency's communication responsibilities." }
  }
  return { score: 82, reason: "Fits this agency's communication responsibilities." }
}

export function messagingAngleForOpportunity(
  signals: string[],
  category: string,
  agencyType?: string | null
): string | undefined {
  const profile = getAgencyProfile(agencyType)
  const tags = [category, ...signals].map((s) => s.toLowerCase().replace(/\s+/g, "_"))
  for (const tag of tags) {
    for (const [key, angle] of Object.entries(profile.messagingAngles)) {
      if (tag.includes(key) || key.includes(tag)) return angle
    }
  }
  return undefined
}
