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
    "utility",
    "water_main",
    "boil_water",
  ],
  adjacentSignals: [
    "extreme_heat",
    "hot_vehicle",
    "severe_storms",
    "flooding",
    "weather_safety",
    "emergency_preparedness",
    "air_quality",
    "power_outage",
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
    utility:
      "Public-safety awareness angle: crews will be working in neighborhoods/yards — expect activity, verify workers if asked, and call the department with concerns about suspicious people claiming to be utility workers.",
    water_main:
      "Community awareness: service crews will be active; remind residents to expect workers in the area and contact police if something looks off.",
    boil_water:
      "Share as a community health/safety heads-up and direct residents to official utility guidance — not as if police own the water system.",
    power_outage:
      "Focus on dark streets, traffic signals, generator theft/scam awareness, and calling 911 only for emergencies.",
    air_quality:
      "Community welfare angle: sensitive residents, outdoor activity, and checking on neighbors — not a medical advisory lecture.",
    school_safety:
      "Traffic and pedestrian awareness around schools; slow down and watch for kids.",
    missing_person: "Ask the public for tips, share only verified details, and direct calls to the official tip line.",
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
    utility:
      "If relevant to fire/EMS access or outdoor burning restrictions, mention access for emergency vehicles; otherwise keep it as community awareness about crews in the area.",
    power_outage: "Generator safety, candle/fire risk, and CO awareness while power is out.",
    air_quality: "Smoke/fire-related air quality and limiting outdoor exertion when smoke is present.",
    wildfire: "Evacuation readiness, defensible space awareness, and following official fire updates.",
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
    air_quality:
      "Health-impact angle for sensitive groups; when symptoms worsen, seek medical care / call 911 for severe distress.",
    utility:
      "If utility work affects access for ambulances or creates hazards, mention access/awareness; otherwise community heads-up only.",
    boil_water: "Public-health framing: follow official boil guidance to protect health until lifted.",
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
    utility:
      "Service disruption / preparedness angle: alternate plans, alert channels, and what residents should expect.",
    boil_water: "Official public advisory framing with clear next steps until the advisory is lifted.",
    air_quality: "Protective-action guidance and monitoring official air-quality updates.",
    wildfire: "Evacuation readiness, alert signup, and official information sources.",
    road_closure: "Travel impacts during emergencies and how residents can stay informed.",
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
    utility:
      "Service update voice: what is happening, where, what residents should expect at their property, and who to contact.",
    water_main: "Explain service impact, repair work in the area, and how residents can stay updated.",
    boil_water: "Clear municipal health/service advisory with steps until lifted.",
    power_outage: "Service restoration awareness and where to get updates.",
    air_quality: "Community advisory with outdoor-activity guidance for residents.",
  },
}

const PUBLIC_WORKS_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "road_closure",
    "travel_delay",
    "traffic_safety",
    "utility",
    "water_main",
    "power_outage",
    "flooding",
    "winter_weather",
    "snow",
    "storm_drain",
    "infrastructure",
  ],
  adjacentSignals: ["severe_storms", "emergency_preparedness", "community_engagement"],
  avoidSignals: ["crime_prevention", "missing_person", "cpr", "fire_safety"],
  messagingAngles: {
    road_closure: "Explain the work area, traffic pattern, expected duration, and safest alternate route.",
    utility: "Explain what crews are doing, what residents may notice, service impacts, and the correct contact.",
    water_main: "Explain affected service, crew activity, restoration expectations, and official updates.",
    flooding: "Focus on drainage, closed roads, debris reporting, and what public works crews are addressing.",
    winter_weather: "Focus on plowing priorities, parking restrictions, road treatment, and safe travel expectations.",
  },
}

const PARKS_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "parks",
    "recreation",
    "trail",
    "pool_safety",
    "water_safety",
    "extreme_heat",
    "air_quality",
    "facility_closure",
    "community_engagement",
    "local_event",
  ],
  adjacentSignals: ["severe_storms", "flooding", "wildfire", "public_health"],
  avoidSignals: ["crime_prevention", "scams", "road_closure", "utility"],
  messagingAngles: {
    extreme_heat: "Explain impacts to outdoor programs and facilities, hydration, shade, and schedule changes.",
    air_quality: "Explain whether outdoor programs or facilities are affected and who should limit activity.",
    flooding: "Address trail, field, park, or water-access closures and when conditions will be reassessed.",
    community_engagement: "Recommend only verified agency-run programs with practical participation details.",
  },
}

const UTILITIES_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "utility",
    "water_main",
    "boil_water",
    "power_outage",
    "service_outage",
    "meter",
    "conservation",
    "infrastructure",
  ],
  adjacentSignals: ["extreme_heat", "winter_weather", "flooding", "severe_storms"],
  avoidSignals: ["crime_prevention", "missing_person", "local_event"],
  messagingAngles: {
    utility: "Give a precise service update: affected area, crew activity, customer impact, verification, and contact.",
    water_main: "Explain the repair, affected customers, restoration estimate if verified, and flushing guidance.",
    boil_water: "State who is affected, exactly what precautions to take, and where the official lift notice will appear.",
    power_outage: "Share affected service, restoration information if verified, downed-line safety, and outage reporting.",
  },
}

const HEALTH_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "public_health",
    "health_advisory",
    "air_quality",
    "extreme_heat",
    "heat_illness",
    "boil_water",
    "disease_prevention",
    "food_safety",
    "senior_safety",
  ],
  adjacentSignals: ["emergency_preparedness", "water_safety", "community_engagement"],
  avoidSignals: ["crime_prevention", "road_closure", "fire_safety"],
  messagingAngles: {
    extreme_heat: "Explain health risks, who is most vulnerable, cooling resources, and when to seek care.",
    air_quality: "Identify affected groups, recommended activity changes, symptoms, and the official AQI source.",
    boil_water: "Give exact health precautions, safe uses of water, and how residents will know when it is lifted.",
    community_engagement: "Recommend only verified health-department clinics, screenings, or prevention programs.",
  },
}

const ANIMAL_SERVICES_PROFILE: AgencyCommunicationProfile = {
  preferredSignals: [
    "animal_control",
    "animal_services",
    "pet_safety",
    "lost_pet",
    "rabies",
    "wildlife",
    "extreme_heat",
    "cold_exposure",
    "disaster_preparedness",
    "community_engagement",
  ],
  adjacentSignals: ["air_quality", "flooding", "severe_storms", "public_health"],
  avoidSignals: ["road_closure", "utility", "crime_prevention", "fire_safety"],
  messagingAngles: {
    extreme_heat:
      "Explain specific heat risks for pets, safe outdoor limits, hot-vehicle danger, and when veterinary help may be needed.",
    cold_exposure:
      "Explain safe shelter and outdoor-time precautions for pets and how to report animals at risk.",
    wildlife:
      "Explain the verified wildlife concern, how residents should avoid contact, and the correct reporting channel.",
    rabies:
      "Share evidence-based exposure prevention, vaccination guidance, and who residents should contact after a possible exposure.",
    disaster_preparedness:
      "Include pets in evacuation or shelter planning, identification, carriers, medications, and official animal-shelter guidance.",
    community_engagement:
      "Recommend only verified animal-services programs such as clinics, adoption events, or licensing outreach.",
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
  public_works: PUBLIC_WORKS_PROFILE,
  parks_recreation: PARKS_PROFILE,
  utilities: UTILITIES_PROFILE,
  animal_services: ANIMAL_SERVICES_PROFILE,
  health_department: HEALTH_PROFILE,
  local_government: MUNICIPALITY_PROFILE,
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
  agencyType?: string | null,
  topicText?: string
): string | undefined {
  const profile = getAgencyProfile(agencyType)
  const tags = [category, ...signals, ...(topicText ? [topicText] : [])]
    .map((s) => s.toLowerCase().replace(/\s+/g, "_"))
  // Keyword → angle key so sparse AI tags still get the right agency framing
  // (e.g. "meter replacements" → utility → police yard-activity / verify-workers angle).
  const keywordHints: Array<{ re: RegExp; key: string }> = [
    { re: /\b(meter|utility|water[_ ]?main|crew|contractor|gas[_ ]?line)\b/, key: "utility" },
    { re: /\bboil[_ ]?water\b/, key: "boil_water" },
    { re: /\b(power[_ ]?outage|blackout)\b/, key: "power_outage" },
    { re: /\b(air[_ ]?quality|smoke|aqi)\b/, key: "air_quality" },
    { re: /\b(road[_ ]?clos|detour|lane[_ ]?clos)\b/, key: "road_closure" },
  ]
  const haystack = tags.join(" ")
  for (const { re, key } of keywordHints) {
    if (re.test(haystack) && profile.messagingAngles[key]) {
      return profile.messagingAngles[key]
    }
  }
  for (const tag of tags) {
    for (const [key, angle] of Object.entries(profile.messagingAngles)) {
      if (tag.includes(key) || key.includes(tag)) return angle
    }
  }
  return defaultAgencyMessagingAngle(agencyType)
}

/**
 * Fallback when no topic-specific angle matches: still explain why THIS agency type would post.
 */
export function defaultAgencyMessagingAngle(agencyType?: string | null): string {
  switch (agencyType) {
    case "police":
    case "sheriff":
    case "state_police":
      return "Police/public-safety framing: why residents may notice unusual activity, what to expect, how to verify workers/callers, and when to contact the department with concerns — not a bare utility or news announcement."
    case "fire":
      return "Fire-service framing: hazards, access for emergency response, prevention, or community safety awareness tied to this agency's role."
    case "ems":
      return "EMS/health framing: resident wellness, medical risk awareness, and when to seek help — not a generic news blurb."
    case "emergency_management":
      return "Emergency-management framing: preparedness, official channels, and what residents should do or expect."
    case "public_works":
      return "Public-works framing: infrastructure impacts, crew activity, travel/service expectations, and reporting channels."
    case "parks_recreation":
      return "Parks-and-recreation framing: facility or program impacts, outdoor safety, access, and verified agency activities."
    case "utilities":
      return "Utility-provider framing: affected service, crew activity, customer action, restoration information, and official contact channels."
    case "animal_services":
      return "Animal-services framing: pet and wildlife safety, responsible ownership, verified animal-health risks, and the correct reporting or assistance channel."
    case "health_department":
      return "Public-health framing: who is affected, evidence-based protective action, symptoms or risk, and trusted health guidance."
    case "local_government":
    case "municipality":
      return "Municipal service framing: what the community should expect, service impacts, and who to contact."
    default:
      return "Explain why this agency is sharing the update with its community — not just restating the news headline."
  }
}

/** Short role brief injected into message generation. */
export function agencyRoleBrief(agencyType?: string | null): string {
  switch (agencyType) {
    case "police":
    case "sheriff":
    case "state_police":
      return "Law enforcement posts to keep people safe, reduce crime/scams, manage traffic concerns, and help residents know what activity in the community is expected vs. suspicious."
    case "fire":
      return "Fire departments post about fire/life safety, smoke/wildfire risk, emergency access, and helping residents prevent injuries and property loss."
    case "ems":
      return "EMS posts about medical risk awareness, heat/cold illness, when to call 911, and community health safety."
    case "emergency_management":
      return "Emergency management posts about preparedness, official alerts, evacuations, and where to get trusted updates."
    case "public_works":
      return "Public works posts about roads, infrastructure, drainage, snow operations, construction impacts, and municipal service response."
    case "parks_recreation":
      return "Parks and recreation posts about facility access, outdoor conditions, program changes, recreation safety, and agency-run activities."
    case "utilities":
      return "Utilities post about outages, repairs, water quality, meter or crew activity, conservation, and customer actions."
    case "animal_services":
      return "Animal services posts about pet and wildlife safety, animal-health alerts, lost animals, responsible ownership, and how residents can request help or report concerns."
    case "health_department":
      return "Health departments post about advisories, disease prevention, environmental health, vulnerable groups, and evidence-based protective action."
    case "local_government":
    case "municipality":
      return "Municipal governments post about local services, roads, utilities, community impacts, and official city/township guidance."
    default:
      return "Public safety / local government posts to help residents understand what is happening and what it means for them."
  }
}
