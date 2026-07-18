import type { ExternalOpportunityInput } from "./types"
import {
  resolveServiceAreaLocations,
  type ServiceAreaLocation,
} from "./geo-utils"

type UsgsFeature = {
  properties?: {
    mag?: number
    place?: string
    time?: number
    url?: string
    title?: string
  }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SaferU Press Center (https://saferu.com)",
      },
      next: { revalidate: 60 * 15 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

function daysAgoIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function locationKey(location: ServiceAreaLocation): string {
  return (
    location.zip ||
    [location.city, location.county, location.state]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") ||
    `${location.latitude.toFixed(2)}-${location.longitude.toFixed(2)}`
  )
}

async function scanEarthquakes(location: ServiceAreaLocation): Promise<ExternalOpportunityInput | null> {
  const start = daysAgoIso(3)
  const url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
    `&latitude=${location.latitude}&longitude=${location.longitude}` +
    `&maxradiuskm=120&starttime=${start}&minmagnitude=3.0&orderby=time&limit=3`

  const data = await fetchJson<{ features?: UsgsFeature[] }>(url)
  const feature = data?.features?.[0]
  const props = feature?.properties
  if (!props?.mag || !props.place) return null

  const mag = props.mag
  const place = props.place
  const eventUrl = props.url || "https://earthquake.usgs.gov/"
  const eventDay = props.time ? new Date(props.time).toISOString().slice(0, 10) : daysAgoIso(0)

  return {
    id: `usgs-quake-${locationKey(location)}-${mag}`,
    title: `Earthquake reported near ${place}`,
    summary: `USGS recorded a magnitude ${mag} earthquake near ${place}, which may affect residents in the broader region.`,
    category: "earthquake",
    sourceLabel: "Current Local Opportunity",
    whyItMatters:
      "Even distant earthquakes can unsettle residents and prompt questions about preparedness. A brief, factual update with preparedness steps helps the community.",
    recommendedAction:
      "Share USGS-confirmed magnitude and location, plus basic drop-cover-hold and aftershock awareness.",
    recommendedPostTiming: "Post today while residents are asking questions.",
    priority: mag >= 4.5 ? "recommended_today" : "plan_ahead",
    signals: ["earthquake", "emergency_preparedness"],
    sourceName: "U.S. Geological Survey",
    sourceUrl: eventUrl,
    eventStart: eventDay,
    eventEnd: eventDay,
    verifiedFacts: [
      `USGS reported a magnitude ${mag} earthquake near ${place}.`,
      `Event listed on the USGS earthquake catalog for ${eventDay}.`,
    ],
    publicCallToAction: [
      "Drop, cover, and hold on during shaking.",
      "Expect aftershocks and check on neighbors who may need help.",
    ],
    doNotClaim: [
      "Do not claim local damage or injuries unless confirmed by official sources.",
      "Do not cite tsunami risk unless the National Weather Service issues a warning.",
    ],
    confidenceLevel: "high",
  }
}

async function scanAirQuality(location: ServiceAreaLocation): Promise<ExternalOpportunityInput | null> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&current=us_aqi,pm2_5&timezone=auto`

  const data = await fetchJson<{
    current?: { us_aqi?: number; pm2_5?: number; time?: string }
  }>(url)
  const aqi = data?.current?.us_aqi
  if (typeof aqi !== "number" || aqi < 100) return null

  const label = location.label || [location.city, location.state].filter(Boolean).join(", ") || "service area"
  const level =
    aqi >= 200 ? "very unhealthy" : aqi >= 150 ? "unhealthy" : aqi >= 100 ? "unhealthy for sensitive groups" : "moderate"

  return {
    id: `air-quality-${locationKey(location)}-${aqi}`,
    title: `Elevated air quality index near ${label}`,
    summary: `Current air quality near ${label} is in the ${level} range (US AQI ${aqi}). Sensitive residents may need to limit outdoor activity.`,
    category: "air_quality",
    sourceLabel: "Current Local Opportunity",
    whyItMatters:
      "Poor air quality affects children, older adults, and people with respiratory conditions. A timely awareness post helps residents plan outdoor activities and monitor symptoms.",
    recommendedAction:
      "Share the current AQI level and practical steps for sensitive groups to reduce exposure.",
    recommendedPostTiming: "Post this morning before peak outdoor activity.",
    priority: aqi >= 150 ? "recommended_today" : "plan_ahead",
    signals: ["air_quality", "public_health", "respiratory_health"],
    sourceName: "Open-Meteo air quality (US AQI model)",
    sourceUrl: "https://www.airnow.gov/",
    eventStart: data?.current?.time?.slice(0, 10),
    verifiedFacts: [
      `Modeled US AQI near ${label} is ${aqi} (${level}).`,
      typeof data?.current?.pm2_5 === "number"
        ? `Modeled PM2.5 near ${label} is ${data.current.pm2_5} µg/m³.`
        : `Air quality is elevated enough to warrant a public awareness reminder.`,
    ],
    publicCallToAction: [
      "Sensitive groups should limit prolonged outdoor exertion.",
      "Check official AirNow.gov guidance for your area.",
      "Keep windows closed if smoke or pollution is present.",
    ],
    doNotClaim: [
      "Do not attribute the pollution source unless confirmed by EPA, state environmental, or fire officials.",
      "Do not declare a health emergency unless an official agency has done so.",
    ],
    confidenceLevel: "medium",
  }
}

/** Federal / environmental API feeds near the configured service area (USGS, air quality). */
export async function scanFederalHazards(opts: {
  serviceAreaType?: string
  city?: string
  county?: string
  state: string
  serviceZips?: string[]
}): Promise<ExternalOpportunityInput[]> {
  const locations = await resolveServiceAreaLocations(opts)
  const results = await Promise.all(
    locations.flatMap((location) => [
      scanEarthquakes(location),
      scanAirQuality(location),
    ])
  )

  const seen = new Set<string>()
  return results.filter((opp): opp is ExternalOpportunityInput => {
    if (!opp) return false
    const key = `${opp.category}:${opp.title}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
