import type { ExternalOpportunityInput } from "./types"
import { scanFederalHazards } from "./federal-scanner"
import { scanNationalSafetyAlerts } from "./national-alerts-scanner"
import {
  resolveServiceAreaLocations,
  type ServiceAreaLocation,
} from "./geo-utils"

type NwsPeriod = {
  name?: string
  startTime?: string
  endTime?: string
  temperature?: number
  temperatureUnit?: string
  shortForecast?: string
  detailedForecast?: string
  isDaytime?: boolean
}

type NwsAlertFeature = {
  properties?: {
    event?: string
    headline?: string
    description?: string
    instruction?: string
    effective?: string
    ends?: string
    expires?: string
    severity?: string
    urgency?: string
    areaDesc?: string
    uri?: string
  }
}

export type RoadImpactInput = {
  id?: string
  roadName: string
  description: string
  startDate?: string
  endDate?: string
  detour?: string
  sourceName?: string
  sourceUrl?: string
}

function compact<T>(items: Array<T | null | undefined>): T[] {
  return items.filter((item): item is T => Boolean(item))
}

function sentenceList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SaferU Press Center (https://saferu.com)",
      },
      next: { revalidate: 60 * 30 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function heatSignals(maxTemp: number, forecastText: string): string[] {
  const signals = ["extreme_heat", "heat_illness", "hot_vehicle"]
  if (/humid|heat index/i.test(forecastText)) signals.push("hydration")
  return signals
}

function buildHeatOpportunity(
  locationKey: string,
  locationLabel: string,
  hotPeriods: NwsPeriod[],
  forecastUrl?: string
): ExternalOpportunityInput | null {
  if (hotPeriods.length === 0) return null
  const maxTemp = Math.max(...hotPeriods.map((p) => p.temperature ?? 0))
  if (maxTemp < 95) return null

  const days = hotPeriods
    .slice(0, 3)
    .map((p) => p.name || (p.startTime ? new Date(p.startTime).toLocaleDateString("en-US") : "an upcoming day"))
  const dayText = sentenceList([...new Set(days)])
  const forecastText = hotPeriods
    .map((p) => p.shortForecast || p.detailedForecast || "")
    .join(" ")

  return {
    id: `weather-heat-${locationKey}`,
    title: `High heat expected ${dayText}`,
    summary: `Forecast highs near ${maxTemp} degrees are expected in ${locationLabel}.`,
    category: "extreme_heat",
    sourceLabel: "Weather Alert",
    whyItMatters: `Forecast highs near ${maxTemp} degrees can create heat illness and hot-vehicle risks. This is a strong opportunity to remind residents to check on each other, hydrate, limit time outdoors, and never leave children or pets in vehicles.`,
    recommendedAction:
      "Share a location-specific heat-safety message before the hottest conditions arrive.",
    recommendedPostTiming: "Post this morning or early afternoon, before peak heat.",
    priority: "recommended_today",
    signals: heatSignals(maxTemp, forecastText),
    sourceName: "National Weather Service forecast",
    sourceUrl: forecastUrl || "https://api.weather.gov/",
    eventStart: hotPeriods[0]?.startTime,
    eventEnd: hotPeriods[hotPeriods.length - 1]?.endTime,
    verifiedFacts: [
      `Forecast high temperatures near ${maxTemp} degrees for ${locationLabel}.`,
      `Hot period identified for ${dayText}.`,
    ],
    publicCallToAction: [
      "Drink water before you feel thirsty.",
      "Check on older adults, neighbors, outdoor workers, children, and pets.",
      "Never leave children or animals in parked vehicles.",
    ],
    doNotClaim: [
      "Do not say a local heat emergency has been declared unless confirmed.",
      "Do not say cooling centers are open unless confirmed.",
    ],
    confidenceLevel: "high",
  }
}

function buildWeatherAlertOpportunity(
  alert: NwsAlertFeature,
  locationKey: string
): ExternalOpportunityInput | null {
  const props = alert.properties
  const event = props?.event?.trim()
  if (!event) return null

  const eventLower = event.toLowerCase()
  const severeSignals =
    eventLower.includes("heat")
      ? ["extreme_heat", "heat_illness", "hot_vehicle"]
      : eventLower.includes("flood")
        ? ["flooding", "flood_safety"]
        : eventLower.includes("storm") || eventLower.includes("tornado")
          ? ["severe_storms", "tornado_preparedness"]
          : eventLower.includes("wind")
            ? ["high_winds", "power_outage"]
            : eventLower.includes("snow") || eventLower.includes("ice")
              ? ["winter_weather", "ice_safety"]
              : ["weather_safety"]

  const priority = /warning|tornado|flash flood/i.test(event) ? "urgent" : "recommended_today"
  return {
    id: `weather-alert-${locationKey}-${eventLower.replace(/[^a-z0-9]+/g, "-")}`,
    title: event,
    summary: props?.headline || `${event} is active for part of the service area.`,
    category: severeSignals[0] ?? "weather",
    sourceLabel: "Weather Alert",
    whyItMatters:
      props?.headline ||
      `${event} may affect residents in your service area. A clear public safety reminder can help people prepare and avoid unnecessary travel or exposure.`,
    recommendedAction: "Share official timing, expected impacts, and practical safety steps.",
    recommendedPostTiming: priority === "urgent" ? "Post as soon as possible." : "Post today.",
    priority,
    signals: severeSignals,
    sourceName: "National Weather Service alert",
    sourceUrl: props?.uri || "https://alerts.weather.gov/",
    eventStart: props?.effective,
    eventEnd: props?.ends || props?.expires,
    expiresAt: props?.expires,
    verifiedFacts: compact([props?.headline, props?.areaDesc ? `Affected area: ${props.areaDesc}` : null]),
    publicCallToAction: props?.instruction ? [props.instruction] : undefined,
    doNotClaim: [
      "Do not add shelter, evacuation, or road-closure details unless confirmed by an official source.",
    ],
    confidenceLevel: "high",
  }
}

async function scanWeatherForLocation(
  location: ServiceAreaLocation
): Promise<ExternalOpportunityInput[]> {
  const locationKey =
    location.zip ||
    [location.city, location.county, location.state].filter(Boolean).join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
    `${location.latitude.toFixed(2)}-${location.longitude.toFixed(2)}`

  const point = await fetchJson<{
    properties?: {
      forecast?: string
      forecastHourly?: string
    }
  }>(
    `https://api.weather.gov/points/${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`
  )

  const forecastUrl = point?.properties?.forecast
  const forecast = forecastUrl
    ? await fetchJson<{ properties?: { periods?: NwsPeriod[] } }>(forecastUrl)
    : null
  const periods = forecast?.properties?.periods ?? []
  const daytimePeriods = periods
    .filter((p) => p.isDaytime !== false)
    .slice(0, 6)
  const hotPeriods = daytimePeriods.filter(
    (p) => p.temperatureUnit === "F" && typeof p.temperature === "number" && p.temperature >= 95
  )

  const locationLabel = location.label
  const heat = buildHeatOpportunity(locationKey, locationLabel, hotPeriods, forecastUrl)

  const alerts = await fetchJson<{ features?: NwsAlertFeature[] }>(
    `https://api.weather.gov/alerts/active?point=${location.latitude},${location.longitude}`
  )
  const alertOpps = (alerts?.features ?? [])
    .map((feature) => buildWeatherAlertOpportunity(feature, locationKey))
    .filter((opp): opp is ExternalOpportunityInput => Boolean(opp))
    .slice(0, 3)

  return compact([...alertOpps, heat]).sort((a, b) => {
    const priorityScore = { urgent: 3, recommended_today: 2, plan_ahead: 1, optional: 0 }
    return priorityScore[b.priority] - priorityScore[a.priority]
  })
}

function roadImpactToOpportunity(impact: RoadImpactInput): ExternalOpportunityInput {
  const title = `${impact.roadName} road closure`
  const timing =
    impact.startDate && impact.endDate
      ? `Post before ${impact.startDate}; keep the reminder visible through ${impact.endDate}.`
      : impact.startDate
        ? `Post before ${impact.startDate}.`
        : "Post before the closure begins."

  return {
    id: impact.id || `road-${impact.roadName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`,
    title,
    summary: impact.description,
    category: "road_closure",
    sourceLabel: "Current Local Opportunity",
    whyItMatters: `${impact.roadName} may affect travel times and emergency access. Residents should know when the closure starts, where it is located, and what route to use instead.`,
    recommendedAction: impact.detour
      ? `Tell residents to use ${impact.detour} and allow extra travel time.`
      : "Tell residents to avoid the area and allow extra travel time.",
    recommendedPostTiming: timing,
    priority: impact.startDate ? "recommended_today" : "plan_ahead",
    signals: ["road_closure", "traffic_safety", "travel_delay"],
    sourceName: impact.sourceName,
    sourceUrl: impact.sourceUrl,
    eventStart: impact.startDate,
    eventEnd: impact.endDate,
    verifiedFacts: compact([
      `${impact.roadName}: ${impact.description}`,
      impact.startDate ? `Start date: ${impact.startDate}` : null,
      impact.endDate ? `End date: ${impact.endDate}` : null,
      impact.detour ? `Suggested detour: ${impact.detour}` : null,
    ]),
    publicCallToAction: compact([
      impact.detour ? `Use ${impact.detour}.` : "Use an alternate route.",
      "Give yourself extra travel time.",
      "Watch for crews, cones, and changing traffic patterns.",
    ]),
    doNotClaim: [
      "Do not invent detours, closure times, or reopening estimates.",
      "Do not imply police/fire involvement unless confirmed.",
    ],
    suggestedMessage: `Community traffic update: ${impact.roadName} is affected by ${impact.description} ${
      impact.detour
        ? `Please use ${impact.detour} as the alternate route`
        : "Please use an alternate route"
    } and allow extra travel time. Watch for crews, cones, and changing traffic patterns.`,
    confidenceLevel: "high",
  }
}

export async function scanExternalOpportunities({
  serviceZips = [],
  roadImpacts = [],
  state = "",
  city = "",
  county = "",
  serviceAreaType,
}: {
  serviceZips?: string[]
  roadImpacts?: RoadImpactInput[]
  state?: string
  city?: string
  county?: string
  serviceAreaType?: string
}): Promise<ExternalOpportunityInput[]> {
  const locations = await resolveServiceAreaLocations({
    serviceAreaType,
    city,
    county,
    state,
    serviceZips,
  })
  const [weatherResults, federal, national] = await Promise.all([
    Promise.all(locations.map((location) => scanWeatherForLocation(location))),
    scanFederalHazards({ serviceAreaType, city, county, state, serviceZips }),
    state
      ? scanNationalSafetyAlerts({ serviceAreaType, city, county, state, serviceZips })
      : Promise.resolve([]),
  ])
  const weather = weatherResults.flat()
  const roads = roadImpacts.map(roadImpactToOpportunity)

  const seen = new Set<string>()
  return [...weather, ...federal, ...national, ...roads].filter((opp) => {
    const key = `${opp.category}:${opp.title}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function demoWeatherAlert(
  partial: Pick<
    ExternalOpportunityInput,
    | "id"
    | "title"
    | "summary"
    | "category"
    | "whyItMatters"
    | "recommendedAction"
    | "recommendedPostTiming"
    | "priority"
    | "signals"
    | "verifiedFacts"
    | "publicCallToAction"
    | "doNotClaim"
    | "suggestedMessage"
  >
): ExternalOpportunityInput {
  return {
    sourceLabel: "Weather Alert",
    sourceName: "National Weather Service alert",
    sourceUrl: "https://alerts.weather.gov/",
    confidenceLevel: "high",
    ...partial,
  }
}

function demoHolidayOpportunity(
  partial: Pick<
    ExternalOpportunityInput,
    | "id"
    | "title"
    | "summary"
    | "category"
    | "whyItMatters"
    | "recommendedAction"
    | "recommendedPostTiming"
    | "priority"
    | "signals"
    | "verifiedFacts"
    | "publicCallToAction"
    | "doNotClaim"
    | "suggestedMessage"
  >
): ExternalOpportunityInput {
  return {
    sourceLabel: "Seasonal Recommendation",
    sourceName: "Seasonal calendar",
    confidenceLevel: "high",
    ...partial,
  }
}

export function demoExternalOpportunities(_serviceZips: string[] = []): ExternalOpportunityInput[] {
  const opportunities: ExternalOpportunityInput[] = [
    demoWeatherAlert({
      id: "demo-tornado-warning",
      title: "Tornado Warning",
      summary: "A tornado warning is in effect for parts of the service area until further notice.",
      category: "severe_storms",
      whyItMatters:
        "A tornado warning means a tornado has been sighted or indicated by radar. Residents need to move to an interior room on the lowest floor immediately.",
      recommendedAction:
        "Tell residents to shelter now in a basement or interior room away from windows. Avoid mobile homes and vehicles.",
      recommendedPostTiming: "Post immediately.",
      priority: "urgent",
      signals: ["severe_storms", "tornado_preparedness"],
      verifiedFacts: ["A tornado warning is active for part of the service area."],
      publicCallToAction: [
        "Move to a basement or interior room on the lowest floor.",
        "Stay away from windows.",
        "Do not try to outrun a tornado in a vehicle.",
      ],
      doNotClaim: ["Do not state a specific touchdown location unless confirmed by NWS."],
      suggestedMessage:
        "TORNADO WARNING: A tornado warning is in effect for our area. Move to a basement or interior room on the lowest floor, away from windows. If you are in a mobile home or vehicle, seek sturdy shelter immediately. Continue monitoring official National Weather Service updates.",
    }),
    demoWeatherAlert({
      id: "demo-tornado-watch",
      title: "Tornado Watch",
      summary: "Conditions are favorable for tornadoes to develop this afternoon and evening.",
      category: "severe_storms",
      whyItMatters:
        "A tornado watch means severe storms capable of producing tornadoes may develop. Residents should review their shelter plan before storms arrive.",
      recommendedAction:
        "Remind residents to identify their safe room, charge devices, and stay tuned for warnings.",
      recommendedPostTiming: "Post before storms develop.",
      priority: "recommended_today",
      signals: ["severe_storms", "tornado_preparedness"],
      verifiedFacts: ["A tornado watch is in effect for the area this afternoon and evening."],
      publicCallToAction: [
        "Know where you will shelter if a warning is issued.",
        "Charge phones and weather radios.",
        "Stay tuned for official warnings.",
      ],
      doNotClaim: ["Do not say a tornado warning is active unless one is issued."],
      suggestedMessage:
        "Weather update: a tornado watch is in effect for our area this afternoon and evening. Conditions may allow tornadoes to develop. Review your shelter plan now, charge your devices, and stay tuned for warnings. Move indoors immediately if a tornado warning is issued.",
    }),
    demoWeatherAlert({
      id: "demo-severe-thunderstorm-warning",
      title: "Severe Thunderstorm Warning",
      summary: "Damaging winds and large hail are possible with storms moving through the area.",
      category: "severe_storms",
      whyItMatters:
        "A severe thunderstorm warning means dangerous storms are occurring or imminent. Outdoor events and travel may be unsafe.",
      recommendedAction:
        "Tell residents to move indoors, stay away from windows, and avoid flooded roads.",
      recommendedPostTiming: "Post as soon as possible.",
      priority: "urgent",
      signals: ["severe_storms", "high_winds", "flooding"],
      verifiedFacts: ["A severe thunderstorm warning is active for part of the service area."],
      publicCallToAction: [
        "Move indoors and away from windows.",
        "Secure outdoor items if it is safe to do so quickly.",
        "Avoid travel until the storm passes.",
      ],
      doNotClaim: ["Do not claim a tornado warning unless NWS issues one."],
      suggestedMessage:
        "SEVERE THUNDERSTORM WARNING: Damaging winds and large hail are possible as storms move through our area. Move indoors, stay away from windows, and avoid travel until the storm passes. Follow official National Weather Service updates.",
    }),
    demoWeatherAlert({
      id: "demo-severe-thunderstorm-watch",
      title: "Severe Thunderstorm Watch",
      summary:
        "Strong storms may bring damaging winds, frequent lightning, and heavy rain to the area.",
      category: "severe_storms",
      whyItMatters:
        "Residents may be traveling or spending time outdoors when storms arrive. An early reminder gives people time to secure outdoor items, charge devices, and know where to receive official warnings.",
      recommendedAction:
        "Share the official watch timing and preparedness steps so residents can prepare before storms arrive.",
      recommendedPostTiming: "Post now, before storms reach the area.",
      priority: "recommended_today",
      signals: ["severe_storms", "high_winds", "power_outage"],
      verifiedFacts: ["A severe thunderstorm watch is in effect for the area this afternoon."],
      publicCallToAction: [
        "Secure loose outdoor items.",
        "Charge phones and weather radios.",
        "Be ready to move indoors when warnings are issued.",
      ],
      doNotClaim: [
        "Do not say a tornado warning is active unless the National Weather Service issues one.",
      ],
      suggestedMessage:
        "Weather update: a severe thunderstorm watch is in effect for our area this afternoon. Strong storms may bring damaging winds, frequent lightning, and heavy rain. Secure loose outdoor items, charge your devices, and be ready to move indoors if a warning is issued.",
    }),
    demoWeatherAlert({
      id: "demo-winter-storm-warning",
      title: "Winter Storm Warning",
      summary: "Heavy snow and ice may make travel dangerous through tomorrow morning.",
      category: "winter_weather",
      whyItMatters:
        "Winter storm warnings signal significant snow, sleet, or ice that can make roads impassable and increase cold-weather safety risks.",
      recommendedAction:
        "Tell residents to limit travel, dress in layers, and check on neighbors who may need help.",
      recommendedPostTiming: "Post before the evening commute.",
      priority: "urgent",
      signals: ["winter_weather", "ice_safety", "travel_delay"],
      verifiedFacts: ["A winter storm warning is in effect through tomorrow morning."],
      publicCallToAction: [
        "Avoid unnecessary travel.",
        "Keep an emergency kit in your vehicle if you must drive.",
        "Check on older adults and neighbors.",
      ],
      doNotClaim: ["Do not state specific snow totals unless confirmed by NWS."],
      suggestedMessage:
        "WINTER STORM WARNING: Heavy snow and ice may make travel dangerous through tomorrow morning. Avoid unnecessary travel, dress in layers, and check on neighbors who may need assistance. If you must drive, slow down and allow extra time.",
    }),
    demoWeatherAlert({
      id: "demo-winter-weather-advisory",
      title: "Winter Weather Advisory",
      summary: "Light snow and freezing drizzle may create slick roads tonight.",
      category: "winter_weather",
      whyItMatters:
        "Even lighter winter weather can create hazardous bridges, overpasses, and untreated roads.",
      recommendedAction:
        "Remind residents to slow down, allow extra travel time, and watch for changing road conditions.",
      recommendedPostTiming: "Post before the evening commute.",
      priority: "recommended_today",
      signals: ["winter_weather", "ice_safety", "travel_delay"],
      verifiedFacts: ["A winter weather advisory is in effect tonight."],
      publicCallToAction: [
        "Slow down on bridges and overpasses.",
        "Allow extra travel time.",
        "Keep a flashlight and blanket in your vehicle.",
      ],
      doNotClaim: ["Do not claim roads are closed unless confirmed."],
      suggestedMessage:
        "Winter weather advisory: light snow and freezing drizzle may create slick roads tonight. Please slow down, allow extra travel time, and use caution on bridges and overpasses.",
    }),
    demoWeatherAlert({
      id: "demo-flash-flood-warning",
      title: "Flash Flood Warning",
      summary: "Heavy rain may cause rapid flooding of creeks, low-lying roads, and urban areas.",
      category: "flooding",
      whyItMatters:
        "Flash flooding can occur quickly with little warning and is a leading cause of weather-related deaths.",
      recommendedAction:
        "Tell residents to avoid flooded roads and move to higher ground if water rises near them.",
      recommendedPostTiming: "Post immediately.",
      priority: "urgent",
      signals: ["flooding", "flood_safety"],
      verifiedFacts: ["A flash flood warning is active for part of the service area."],
      publicCallToAction: [
        "Turn around, don't drown — never drive through flooded roads.",
        "Move to higher ground if water rises near you.",
        "Avoid creeks, arroyos, and low-lying areas.",
      ],
      doNotClaim: ["Do not state specific road closures unless confirmed."],
      suggestedMessage:
        "FLASH FLOOD WARNING: Heavy rain may cause rapid flooding of creeks, low-lying roads, and urban areas. Never drive through flooded roads — turn around, don't drown. Move to higher ground if water rises near you.",
    }),
    demoWeatherAlert({
      id: "demo-weather-heat",
      title: "High heat expected today through Thursday",
      summary: "Forecast highs in the upper 90s can create heat illness and hot-vehicle risks.",
      category: "extreme_heat",
      whyItMatters:
        "Forecast highs in the upper 90s are expected today, tomorrow, and Thursday. This is a strong opportunity to remind the community to stay hydrated, check on each other, limit outdoor activity, and never leave children or pets in vehicles.",
      recommendedAction:
        "Share a location-specific heat-safety message before peak temperatures.",
      recommendedPostTiming: "Post this morning or early afternoon before peak heat.",
      priority: "recommended_today",
      signals: ["extreme_heat", "heat_illness", "hot_vehicle"],
      verifiedFacts: [
        "Forecast highs are expected to reach the upper 90s today, tomorrow, and Thursday.",
      ],
      publicCallToAction: [
        "Check on neighbors and older adults.",
        "Drink water and limit strenuous outdoor activity.",
        "Never leave children or pets in parked vehicles.",
      ],
      doNotClaim: [
        "Do not say a local heat emergency has been declared unless confirmed.",
        "Do not say cooling centers are open unless confirmed.",
      ],
      suggestedMessage:
        "Community heat reminder: temperatures are expected to reach the upper 90s today through Thursday. Stay hydrated, limit strenuous outdoor activity, and check on older adults, neighbors, children, outdoor workers, and pets. Never leave a child or animal in a parked vehicle.",
    }),
    {
      id: "demo-road-closure",
      title: "Main Street closure starts today",
      summary: "Main Street is closed between Oak Avenue and Pine Road for utility work.",
      category: "road_closure",
      sourceLabel: "Current Local Opportunity",
      whyItMatters:
        "A road closure starting today may affect school pickup, commuter traffic, and emergency access. Residents should know the closure limits and use the posted detour.",
      recommendedAction:
        "Tell residents Main Street is closed between Oak Avenue and Pine Road and to use Elm Street as the detour.",
      recommendedPostTiming: "Post before the morning or afternoon commute.",
      priority: "recommended_today",
      signals: ["road_closure", "traffic_safety", "travel_delay"],
      sourceName: "Demo township road notice",
      verifiedFacts: [
        "Main Street is closed between Oak Avenue and Pine Road.",
        "Elm Street is the posted detour.",
      ],
      publicCallToAction: [
        "Use Elm Street as the detour.",
        "Give yourself extra travel time.",
        "Watch for crews and changing traffic patterns.",
      ],
      doNotClaim: ["Do not invent reopening times or additional detours."],
      suggestedMessage:
        "Community traffic update: Main Street is closed between Oak Avenue and Pine Road starting today. Please use Elm Street as the posted detour, allow extra travel time, and watch for crews and changing traffic patterns.",
      confidenceLevel: "high",
    },
    {
      id: "demo-boil-water-advisory",
      title: "Boil water advisory in effect",
      summary:
        "A boil water advisory has been issued for affected neighborhoods after a drop in water pressure.",
      category: "boil_water",
      sourceLabel: "Current Local Opportunity",
      whyItMatters:
        "A boil water advisory means tap water may be unsafe to drink without boiling. Residents need clear instructions to protect their health until the advisory is lifted.",
      recommendedAction:
        "Tell residents to boil tap water for one minute before drinking, cooking, or brushing teeth until the advisory is lifted.",
      recommendedPostTiming: "Post immediately and update when the advisory is lifted.",
      priority: "urgent",
      signals: ["boil_water", "public_health", "water_safety"],
      sourceName: "Demo township water department",
      verifiedFacts: [
        "A boil water advisory is in effect for affected neighborhoods.",
        "The advisory follows a loss of water pressure in the system.",
      ],
      publicCallToAction: [
        "Boil tap water for at least one minute before use.",
        "Use bottled water if boiling is not possible.",
        "Watch for official updates on when the advisory is lifted.",
      ],
      doNotClaim: [
        "Do not state a specific lift time unless confirmed by the water department.",
        "Do not claim the water is contaminated with a specific substance unless confirmed.",
      ],
      suggestedMessage:
        "BOIL WATER ADVISORY: A boil water advisory is in effect for affected neighborhoods. Until it is lifted, boil tap water for at least one minute before drinking, cooking, or brushing your teeth, or use bottled water. We will share an update as soon as the advisory is lifted.",
      confidenceLevel: "high",
    },
    {
      id: "demo-water-main-break",
      title: "Water main break affecting service",
      summary:
        "Crews are responding to a water main break that may cause low pressure or temporary outages.",
      category: "water_main",
      sourceLabel: "Current Local Opportunity",
      whyItMatters:
        "A water main break can interrupt service, reduce pressure, and briefly affect water quality. Residents should know what to expect while crews make repairs.",
      recommendedAction:
        "Let residents know crews are on scene, what areas are affected, and to store water if needed until repairs are complete.",
      recommendedPostTiming: "Post as soon as the affected area is known.",
      priority: "recommended_today",
      signals: ["water_main", "utility", "water_safety"],
      sourceName: "Demo township water department",
      verifiedFacts: [
        "Crews are responding to a water main break.",
        "Some customers may experience low pressure or a temporary outage.",
      ],
      publicCallToAction: [
        "Store water for essential needs during repairs.",
        "Expect low pressure or a brief outage in the affected area.",
        "Watch for updates on restoration.",
      ],
      doNotClaim: [
        "Do not give a specific restoration time unless confirmed.",
        "Do not list affected streets unless confirmed by the water department.",
      ],
      suggestedMessage:
        "Service update: crews are responding to a water main break that may cause low pressure or a temporary outage in the affected area. Please store water for essential needs during repairs. We will share updates as service is restored.",
      confidenceLevel: "high",
    },
    {
      id: "demo-community-event",
      title: "Community safety night this Saturday",
      summary:
        "A free community safety night is scheduled Saturday at the municipal park with public-safety demonstrations and family activities.",
      category: "community_event",
      sourceLabel: "Upcoming Event",
      whyItMatters:
        "Residents in the service area can meet local public-safety teams, learn practical safety information, and take part in a timely community event.",
      recommendedAction:
        "Share the confirmed date, location, activities, and a reminder for families to attend.",
      recommendedPostTiming: "Post today and share a short reminder Friday.",
      priority: "recommended_today",
      signals: ["community_engagement", "event_promotion", "family_safety"],
      sourceName: "Demo township events calendar",
      verifiedFacts: [
        "Community safety night is scheduled for Saturday.",
        "The event is planned at the municipal park.",
        "Admission is free.",
      ],
      publicCallToAction: [
        "Save the date.",
        "Invite family and neighbors.",
        "Watch agency channels for final event details.",
      ],
      doNotClaim: ["Do not add vendors, times, or demonstrations unless confirmed."],
      suggestedMessage:
        "Join us Saturday for a free Community Safety Night at the municipal park. Meet local public-safety teams, explore family-friendly activities, and pick up practical safety information. Save the date and watch our page for final event details.",
      confidenceLevel: "high",
    },
    demoHolidayOpportunity({
      id: "demo-july-fourth",
      title: "Independence Day",
      summary: "Fourth of July celebrations bring fireworks, travel, and outdoor gatherings.",
      category: "holiday_safety",
      whyItMatters:
        "Independence Day is a peak time for fireworks injuries, impaired driving, and water-related incidents. A timely reminder helps residents celebrate safely.",
      recommendedAction:
        "Share fireworks safety, designated-driver reminders, and water safety tips before weekend celebrations.",
      recommendedPostTiming: "Post in the days leading up to July 4th.",
      priority: "recommended_today",
      signals: ["fireworks_safety", "impaired_driving", "water_safety"],
      verifiedFacts: ["Independence Day celebrations are planned across the community this week."],
      publicCallToAction: [
        "Leave fireworks to the professionals.",
        "Plan a sober ride if celebrating away from home.",
        "Supervise children around water.",
      ],
      doNotClaim: ["Do not list specific public fireworks events unless confirmed."],
      suggestedMessage:
        "Happy 4th of July! As our community celebrates, please leave fireworks to the professionals, plan a sober ride if you are celebrating away from home, and supervise children around water. We hope everyone has a safe and enjoyable holiday.",
    }),
    demoHolidayOpportunity({
      id: "demo-christmas",
      title: "Winter holidays",
      summary: "Winter holiday gatherings increase travel, cooking, and heating-related risks.",
      category: "holiday_safety",
      whyItMatters:
        "The winter holidays are a good time to remind residents about carbon monoxide safety, cooking fire prevention, and safe travel.",
      recommendedAction:
        "Share a warm holiday greeting paired with practical winter safety reminders.",
      recommendedPostTiming: "Post the week before Christmas.",
      priority: "plan_ahead",
      signals: ["carbon_monoxide", "heating_safety", "travel_safety"],
      verifiedFacts: ["Winter holiday gatherings are expected across the community."],
      publicCallToAction: [
        "Test smoke and carbon monoxide alarms.",
        "Stay in the kitchen when cooking.",
        "Allow extra travel time in winter weather.",
      ],
      doNotClaim: ["Do not claim specific event cancellations unless confirmed."],
      suggestedMessage:
        "Merry Christmas from our team! As you gather with family and friends, please test your smoke and carbon monoxide alarms, stay in the kitchen when cooking, and allow extra travel time if winter weather is in the forecast.",
    }),
    demoHolidayOpportunity({
      id: "demo-new-years",
      title: "New Year's Eve/Day",
      summary: "New Year's celebrations often involve late-night travel and impaired driving risks.",
      category: "holiday_safety",
      whyItMatters:
        "Impaired driving and celebratory gunfire are common concerns on New Year's Eve. An early reminder encourages safer choices.",
      recommendedAction:
        "Pair a Happy New Year greeting with a designated-driver and noise-safety reminder.",
      recommendedPostTiming: "Post December 30–31.",
      priority: "recommended_today",
      signals: ["impaired_driving", "celebration_safety"],
      verifiedFacts: ["New Year's Eve celebrations are expected across the community."],
      publicCallToAction: [
        "Plan a sober ride before you go out.",
        "Do not fire guns into the air.",
        "Check on neighbors celebrating responsibly.",
      ],
      doNotClaim: ["Do not reference specific enforcement operations unless confirmed."],
      suggestedMessage:
        "Happy New Year! Please plan a sober ride before heading out to celebrate, never fire guns into the air, and look out for one another. We wish our community a safe and happy start to the new year.",
    }),
    demoHolidayOpportunity({
      id: "demo-thanksgiving",
      title: "Thanksgiving cooking safety",
      summary: "Thanksgiving is the peak day for home cooking fires in the United States.",
      category: "holiday_safety",
      whyItMatters:
        "Unattended cooking is the leading cause of home fires on Thanksgiving. A short reminder can prevent tragedies during holiday meal prep.",
      recommendedAction:
        "Share cooking safety tips with a warm Thanksgiving greeting.",
      recommendedPostTiming: "Post the week of Thanksgiving.",
      priority: "plan_ahead",
      signals: ["cooking_safety", "travel_safety"],
      verifiedFacts: ["Thanksgiving gatherings are expected across the community."],
      publicCallToAction: [
        "Stay in the kitchen when frying or grilling.",
        "Keep children away from the stove.",
        "Allow extra travel time on busy roads.",
      ],
      doNotClaim: ["Do not claim specific road closures unless confirmed."],
      suggestedMessage:
        "Happy Thanksgiving! Please stay in the kitchen when cooking, keep children away from hot surfaces, and allow extra travel time on busy roads. We are thankful for our community and wish everyone a safe holiday.",
    }),
    demoHolidayOpportunity({
      id: "demo-halloween",
      title: "Halloween",
      summary: "Halloween brings increased pedestrian traffic and visibility concerns after dark.",
      category: "holiday_safety",
      whyItMatters: "Children walking between houses at dusk need drivers and parents to stay alert.",
      recommendedAction: "Share pedestrian, costume, and candy safety tips with a Halloween greeting.",
      recommendedPostTiming: "Post the week of Halloween.",
      priority: "plan_ahead",
      signals: ["pedestrian_safety", "costume_safety"],
      verifiedFacts: ["Halloween trick-or-treating is expected across the community."],
      publicCallToAction: ["Use reflective costumes.", "Cross streets at corners.", "Inspect candy before eating."],
      doNotClaim: ["Do not list specific event times unless confirmed."],
      suggestedMessage:
        "Happy Halloween! Please use reflective costumes, cross at corners, and inspect candy before children eat it. Drivers, slow down and watch for trick-or-treaters after dark.",
    }),
    demoHolidayOpportunity({
      id: "demo-valentines",
      title: "Valentine's Day",
      summary: "Romance scams spike around Valentine's Day.",
      category: "holiday_safety",
      whyItMatters: "Residents may receive fraudulent messages from people they have not met in person.",
      recommendedAction: "Pair a Valentine's greeting with a brief online scam reminder.",
      recommendedPostTiming: "Post the week of Valentine's Day.",
      priority: "plan_ahead",
      signals: ["romance_scams", "online_scams"],
      verifiedFacts: ["Valentine's Day is observed across the community."],
      publicCallToAction: ["Never send money to someone you have not met.", "Verify unexpected messages."],
      doNotClaim: ["Do not reference specific scam cases unless confirmed."],
      suggestedMessage:
        "Happy Valentine's Day! If someone you have never met asks for money or gift cards, it may be a scam. Verify unexpected messages and report fraud to local authorities.",
    }),
    demoHolidayOpportunity({
      id: "demo-veterans-day",
      title: "Veterans Day",
      summary: "A day to honor those who have served in the U.S. Armed Forces.",
      category: "holiday_safety",
      whyItMatters: "Community recognition strengthens ties with veterans and military families.",
      recommendedAction: "Share a Veterans Day greeting and local remembrance resources.",
      recommendedPostTiming: "Post November 10–11.",
      priority: "plan_ahead",
      signals: ["community_engagement"],
      verifiedFacts: ["Veterans Day is observed nationwide on November 11."],
      publicCallToAction: ["Thank a veteran.", "Attend a local remembrance event."],
      doNotClaim: ["Do not list specific events unless confirmed."],
      suggestedMessage:
        "Happy Veterans Day! We are grateful to all who have served our country. Thank you to the veterans and military families in our community.",
    }),
    demoHolidayOpportunity({
      id: "demo-easter",
      title: "Easter",
      summary: "Easter weekend brings family gatherings and increased road traffic.",
      category: "holiday_safety",
      whyItMatters: "Holiday travel and distracted driving are common concerns.",
      recommendedAction: "Share an Easter greeting with travel and pedestrian safety tips.",
      recommendedPostTiming: "Post the week of Easter.",
      priority: "plan_ahead",
      signals: ["travel_safety", "pedestrian_safety"],
      verifiedFacts: ["Easter is observed across the community."],
      publicCallToAction: ["Buckle up.", "Allow extra travel time.", "Watch for children outdoors."],
      doNotClaim: ["Do not list specific event cancellations unless confirmed."],
      suggestedMessage:
        "Happy Easter! Please buckle up, allow extra travel time, and watch for children playing outdoors. We wish our community a safe and joyful holiday.",
    }),
  ]

  // Keep the localhost briefing representative of production: only a handful
  // of timely items, including one holiday for testing the OpenAI graphic flow.
  return opportunities.filter((opp) =>
    [
      "demo-weather-heat",
      "demo-road-closure",
      "demo-community-event",
      "demo-july-fourth",
    ].includes(opp.id)
  )
}
