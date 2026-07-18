import type { ExternalOpportunityInput } from "./types"
import { resolveServiceAreaLocations } from "./geo-utils"
import { parseRssDate, parseRssItems } from "./rss-utils"

const IC3_RSS_URL = "https://www.ic3.gov/rss.xml"
const NIFC_INCIDENTS_URL =
  "https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations/FeatureServer/0/query"
const NCMEC_POSTER_API = "https://posterapi.ncmec.org"

type NifcFeature = {
  attributes?: {
    IncidentName?: string
    DiscoveryAcres?: number | null
    FireDiscoveryDateTime?: number
    POOState?: string
    POOCounty?: string
    PercentContained?: number | null
  }
}

type NcmecPoster = {
  organizationCode?: string
  caseNumber?: string
  child?: {
    firstName?: string
    lastName?: string
    sex?: string
    age?: number
  }
  missingDate?: string
  missingCity?: string
  missingCounty?: string
  missingState?: string
  caseType?: string
  posterDescription?: { headline?: string; synopsis?: string }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml, application/json",
        "User-Agent": "SaferU Press Center (https://saferu.com)",
      },
      next: { revalidate: 60 * 30 },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "User-Agent": "SaferU Press Center (https://saferu.com)",
        ...(init?.headers ?? {}),
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

function stateToUsPrefix(state: string): string {
  const code = state.trim().toUpperCase()
  return code.startsWith("US-") ? code : `US-${code}`
}

/** FBI IC3 scam and fraud PSAs (RSS). National campaigns PIOs can share locally. */
export async function scanFbiIc3ScamAlerts(maxItems = 2): Promise<ExternalOpportunityInput[]> {
  const xml = await fetchText(IC3_RSS_URL)
  if (!xml) return []

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const items = parseRssItems(xml)
    .map((item) => ({ item, date: parseRssDate(item.pubDate) }))
    .filter(({ date }) => !date || date.getTime() >= cutoff)
    .slice(0, maxItems)

  return items.map(({ item, date }, index) => {
    const eventDay = date?.toISOString().slice(0, 10) ?? daysAgoIso(0)
    return {
      id: `ic3-scam-${item.guid || index}-${eventDay}`,
      title: item.title,
      summary: `The FBI Internet Crime Complaint Center (IC3) issued a new public alert: ${item.title}.`,
      category: "scams",
      sourceLabel: "Current Local Opportunity",
      whyItMatters:
        "FBI IC3 alerts highlight scams actively targeting the public. Sharing verified warnings helps residents recognize fraud before they lose money or personal information.",
      recommendedAction:
        "Share the IC3 warning with a short, practical tip on how residents can verify requests and report suspected fraud.",
      recommendedPostTiming: "Post this week while the alert is current.",
      priority: "recommended_today",
      signals: ["scams", "fraud", "cyber_security", "fbi_alert"],
      sourceName: "FBI Internet Crime Complaint Center (IC3)",
      sourceUrl: item.link,
      eventStart: eventDay,
      eventEnd: eventDay,
      verifiedFacts: [
        `FBI IC3 published "${item.title}" on ${eventDay}.`,
        "The alert is available on ic3.gov.",
      ],
      publicCallToAction: [
        "Verify unexpected calls, texts, and emails before sending money or personal information.",
        "Report suspected internet crime at ic3.gov.",
      ],
      doNotClaim: [
        "Do not claim a specific local victim count unless confirmed.",
        "Do not add scam details not stated in the IC3 alert.",
      ],
      confidenceLevel: "high",
    } satisfies ExternalOpportunityInput
  })
}

/** Active wildland fires near the service area via NIFC WFIGS (Watch Duty–class data). */
export async function scanNearbyWildfires(opts: {
  serviceAreaType?: string
  city?: string
  county?: string
  state: string
  serviceZips?: string[]
}): Promise<ExternalOpportunityInput[]> {
  const locations = await resolveServiceAreaLocations(opts)
  if (!locations.length) return []
  const state = opts.state

  const since = daysAgoIso(10)
  const statePrefix = stateToUsPrefix(state)
  const seen = new Set<string>()
  const opportunities: ExternalOpportunityInput[] = []

  for (const location of locations) {
    const params = new URLSearchParams({
      geometry: `${location.longitude},${location.latitude}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      distance: "200",
      units: "esriSRUnit_Kilometer",
      where: `FireDiscoveryDateTime >= TIMESTAMP '${since} 00:00:00' AND POOState = '${statePrefix}'`,
      outFields:
        "IncidentName,DiscoveryAcres,FireDiscoveryDateTime,POOCounty,PercentContained,POOState",
      resultRecordCount: "10",
      f: "json",
    })

    const data = await fetchJson<{ features?: NifcFeature[] }>(`${NIFC_INCIDENTS_URL}?${params}`)
    for (const feature of data?.features ?? []) {
      const attrs = feature.attributes
      const name = attrs?.IncidentName?.trim()
      if (!name || seen.has(name)) continue

      const contained = attrs?.PercentContained
      const acres = attrs?.DiscoveryAcres ?? 0
      const isActive = contained == null || contained < 100
      if (!isActive && acres < 100) continue

      seen.add(name)
      const county = attrs?.POOCounty || "the area"
      const eventDay = attrs?.FireDiscoveryDateTime
        ? new Date(attrs.FireDiscoveryDateTime).toISOString().slice(0, 10)
        : daysAgoIso(0)
      const acresText =
        typeof acres === "number" && acres > 0 ? ` (~${Math.round(acres)} acres)` : ""

      opportunities.push({
        id: `wildfire-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        title: isActive
          ? `Wildfire activity: ${name} in ${county} County`
          : `Recent wildfire: ${name} in ${county} County`,
        summary: `NIFC reports ${name}${acresText} in ${county} County, ${state}. ${
          isActive ? "The incident may affect air quality, travel, and outdoor activity nearby." : "Residents should stay aware of smoke and changing conditions."
        }`,
        category: "wildfire",
        sourceLabel: "Current Local Opportunity",
        whyItMatters:
          "Wildfire activity near the service area can affect air quality, road travel, and evacuation readiness. A timely PIO update helps residents monitor official sources and prepare.",
        recommendedAction:
          "Share the incident name, county, and direct residents to official fire agency and NIFC/Watch Duty updates for evacuation and air-quality guidance.",
        recommendedPostTiming: isActive ? "Post as soon as possible." : "Post today.",
        priority: isActive && acres >= 100 ? "urgent" : "recommended_today",
        signals: ["wildfire", "fire_weather", "air_quality", "evacuation_ready"],
        sourceName: "National Interagency Fire Center / InciWeb",
        sourceUrl: "https://inciweb.wildfire.gov/",
        eventStart: eventDay,
        eventEnd: eventDay,
        verifiedFacts: [
          `NIFC lists active wildland fire incident "${name}" in ${county} County, ${state}${acresText}.`,
          isActive
            ? `Containment was reported at ${contained ?? 0}% or is not yet fully contained.`
            : "The incident is listed in federal wildland fire tracking data.",
        ],
        publicCallToAction: [
          "Monitor official local fire and emergency management channels.",
          "Be ready to leave quickly if evacuation orders are issued.",
          "Limit outdoor exertion if smoke is visible in your area.",
        ],
        doNotClaim: [
          "Do not state evacuation orders unless issued by local officials.",
          "Do not cite Watch Duty or social media rumors as official fact.",
        ],
        confidenceLevel: "high",
      })
      if (opportunities.length >= 2) break
    }
    if (opportunities.length >= 2) break
  }

  return opportunities
}

async function getNcmecAccessToken(): Promise<string | null> {
  const clientId = process.env.NCMEC_POSTER_CLIENT_ID?.trim()
  const clientSecret = process.env.NCMEC_POSTER_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null

  const data = await fetchJson<{ accessToken?: string; token?: string }>(
    `${NCMEC_POSTER_API}/Auth/Token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    }
  )
  return data?.accessToken || data?.token || null
}

/** NCMEC missing-child posters in the agency state (requires Poster API credentials). */
export async function scanNcmecPostersForState(state: string): Promise<ExternalOpportunityInput[]> {
  const token = await getNcmecAccessToken()
  if (!token) return []

  const stateCode = state.trim().toUpperCase().replace(/^US-/, "")
  const params = new URLSearchParams({
    missingState: stateCode,
    limit: "5",
    sortType: "lastModified",
    sortOrder: "desc",
  })

  const data = await fetchJson<{ posters?: NcmecPoster[]; items?: NcmecPoster[] }>(
    `${NCMEC_POSTER_API}/Posters?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const posters = data?.posters ?? data?.items ?? []
  const opportunities: ExternalOpportunityInput[] = []

  for (const poster of posters.slice(0, 2)) {
    const first = poster.child?.firstName?.trim()
    const last = poster.child?.lastName?.trim()
    const city = poster.missingCity?.trim()
    const county = poster.missingCounty?.trim()
    const caseNumber = poster.caseNumber?.trim()
    const org = poster.organizationCode?.trim() || "NCMEC"
    if (!first || !last || !caseNumber) continue

    const location = [city, county, stateCode].filter(Boolean).join(", ")
    const headline =
      poster.posterDescription?.headline?.trim() ||
      `Help locate missing child: ${first} ${last}`
    const isAmber = /amber/i.test(poster.caseType || "") || /amber/i.test(headline)

    opportunities.push({
      id: `ncmec-${org}-${caseNumber}`,
      title: headline,
      summary: `NCMEC lists an active missing-child case for ${first} ${last}${location ? ` last associated with ${location}` : ""}.`,
      category: isAmber ? "amber_alert" : "missing_person",
      sourceLabel: "Current Local Opportunity",
      whyItMatters:
        "Sharing verified missing-child information from NCMEC can help the community recognize and safely report sightings.",
      recommendedAction:
        "Share only NCMEC-verified details and direct residents to call 1-800-THE-LOST (1-800-843-5678) with tips.",
      recommendedPostTiming: "Post as soon as possible.",
      priority: isAmber ? "urgent" : "recommended_today",
      signals: isAmber
        ? ["amber_alert", "missing_person", "child_safety"]
        : ["missing_person", "child_safety"],
      sourceName: "National Center for Missing & Exploited Children",
      sourceUrl: `https://www.missingkids.org/gethelpnow/search`,
      eventStart: poster.missingDate?.slice(0, 10),
      verifiedFacts: [
        `NCMEC poster case ${caseNumber} lists ${first} ${last} as missing.`,
        location ? `Last known area: ${location}.` : `Case is associated with ${stateCode}.`,
      ],
      publicCallToAction: [
        "If you have information, call 1-800-THE-LOST (1-800-843-5678).",
        "Do not approach anyone based on social media tips alone — contact law enforcement.",
      ],
      doNotClaim: [
        "Do not add clothing, vehicle, or suspect details not on the official NCMEC poster.",
        "Do not imply your agency is the investigating agency unless confirmed.",
      ],
      confidenceLevel: "high",
    })
  }

  return opportunities
}

/** FBI IC3 scams, NIFC wildfires, and optional NCMEC posters for the service area. */
export async function scanNationalSafetyAlerts(opts: {
  serviceAreaType?: string
  city?: string
  county?: string
  state: string
  serviceZips?: string[]
}): Promise<ExternalOpportunityInput[]> {
  const [scams, wildfires, ncmec] = await Promise.all([
    scanFbiIc3ScamAlerts(1),
    scanNearbyWildfires(opts),
    scanNcmecPostersForState(opts.state),
  ])

  const seen = new Set<string>()
  return [...wildfires, ...ncmec, ...scams].filter((opp) => {
    const key = `${opp.category}:${opp.title}`.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
