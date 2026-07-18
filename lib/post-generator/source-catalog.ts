/**
 * Authoritative source catalog for the Post Idea Generator.
 * Keep in sync with trusted-sources.ts.
 */

export type SourceCatalogSection = {
  title: string
  urls: string[]
  notes?: string
}

/** National sources — always included in AI discovery prompts. */
export const NATIONAL_SOURCE_SECTIONS: SourceCatalogSection[] = [
  {
    title: "National Weather",
    urls: [
      "https://www.weather.gov",
      "https://forecast.weather.gov",
      "https://alerts.weather.gov",
      "https://www.spc.noaa.gov",
      "https://www.wpc.ncep.noaa.gov",
      "https://www.nhc.noaa.gov",
      "https://water.noaa.gov",
      "https://www.noaa.gov",
      "https://www.tropicaltidbits.com",
    ],
    notes:
      "Tropical Tidbits is a secondary analysis/model source. Confirm alerts and actionable claims with NWS/NHC.",
  },
  {
    title: "Emergency Management",
    urls: ["https://www.ready.gov", "https://www.fema.gov", "https://www.cisa.gov"],
  },
  {
    title: "Wildfires",
    urls: [
      "https://inciweb.wildfire.gov",
      "https://www.nifc.gov",
      "https://www.fire.ca.gov/incidents",
      "https://www.fs.usda.gov",
    ],
  },
  {
    title: "Air Quality",
    urls: ["https://www.airnow.gov"],
  },
  {
    title: "Earthquakes",
    urls: ["https://earthquake.usgs.gov"],
  },
  {
    title: "Public Health",
    urls: ["https://www.cdc.gov"],
  },
  {
    title: "Scams / Cyber",
    urls: ["https://consumer.ftc.gov", "https://www.ic3.gov", "https://www.cisa.gov"],
  },
  {
    title: "Fire Safety",
    urls: ["https://www.usfa.fema.gov", "https://www.nfpa.org"],
  },
  {
    title: "Traffic (National)",
    urls: ["https://ops.fhwa.dot.gov/511"],
    notes: "Also search the state DOT for the agency's state.",
  },
  {
    title: "Missing Persons",
    urls: ["https://www.missingkids.org", "https://www.amberalert.gov"],
  },
]

/** State DOT websites — keyed by USPS state code. */
export const STATE_DOT_URLS: Record<string, string> = {
  PA: "https://www.penndot.pa.gov",
  CA: "https://dot.ca.gov",
  TX: "https://www.txdot.gov",
  FL: "https://www.fdot.gov",
  NY: "https://www.dot.ny.gov",
  OH: "https://www.transportation.ohio.gov",
  IL: "https://idot.illinois.gov",
  GA: "https://www.dot.ga.gov",
  NC: "https://www.ncdot.gov",
  MI: "https://www.michigan.gov/mdot",
  NJ: "https://www.nj.gov/transportation",
  VA: "https://www.vdot.virginia.gov",
  WA: "https://wsdot.wa.gov",
  AZ: "https://azdot.gov",
  MA: "https://www.mass.gov/orgs/massachusetts-department-of-transportation",
  TN: "https://www.tn.gov/tdot",
  IN: "https://www.in.gov/indot",
  MO: "https://www.modot.org",
  MD: "https://roads.maryland.gov",
  WI: "https://wisconsindot.gov",
  CO: "https://www.codot.gov",
  MN: "https://www.dot.state.mn.us",
  SC: "https://www.scdot.org",
  AL: "https://www.dot.state.al.us",
  LA: "https://www.dotd.la.gov",
  KY: "https://transportation.ky.gov",
  OR: "https://www.oregon.gov/odot",
  OK: "https://www.ok.gov/odot",
  CT: "https://portal.ct.gov/dot",
  UT: "https://www.udot.utah.gov",
  IA: "https://iowadot.gov",
  NV: "https://www.dot.nv.gov",
  AR: "https://www.ardot.gov",
  MS: "https://mdot.ms.gov",
  KS: "https://www.ksdot.gov",
  NM: "https://www.dot.nm.gov",
  NE: "https://dot.nebraska.gov",
  WV: "https://transportation.wv.gov",
  ID: "https://itd.idaho.gov",
  HI: "https://hidot.hawaii.gov",
  NH: "https://www.dot.nh.gov",
  ME: "https://www.maine.gov/mdot",
  MT: "https://www.mdt.mt.gov",
  RI: "https://www.dot.ri.gov",
  DE: "https://www.deldot.gov",
  SD: "https://www.sddot.com",
  ND: "https://www.dot.nd.gov",
  AK: "https://dot.alaska.gov",
  VT: "https://vtrans.vermont.gov",
  WY: "https://www.dot.state.wy.us",
}

/** State emergency management agencies. */
export const STATE_EMA_URLS: Record<string, string> = {
  PA: "https://www.pa.gov/agencies/pema",
  CA: "https://www.caloes.ca.gov",
  TX: "https://tdem.texas.gov",
  FL: "https://www.floridadisaster.org",
  NY: "https://www.dhses.ny.gov",
  OH: "https://ema.ohio.gov",
  IL: "https://www2.illinois.gov/sites/readyillinois",
  GA: "https://gema.georgia.gov",
  NC: "https://www.ncdps.gov/our-organization/emergency-management",
  MI: "https://www.michigan.gov/michiganprepares",
  NJ: "https://www.nj.gov/njoem",
  VA: "https://www.vaemergency.gov",
  WA: "https://www.mil.wa.gov/emergency-management-division",
  AZ: "https://azdema.gov",
  MA: "https://www.mass.gov/orgs/massachusetts-emergency-management-agency",
  TN: "https://www.tn.gov/tema",
  CO: "https://dhsem.colorado.gov",
}

/** State police / highway patrol (examples + common states). */
export const STATE_POLICE_URLS: Record<string, string> = {
  PA: "https://www.psp.pa.gov",
  CA: "https://www.chp.ca.gov",
  TX: "https://www.dps.texas.gov",
  FL: "https://www.flhsmv.gov/florida-highway-patrol",
  NY: "https://troopers.ny.gov",
  OH: "https://www.statepatrol.ohio.gov",
  IL: "https://isp.illinois.gov",
  GA: "https://dps.georgia.gov/divisions/georgia-state-patrol",
  NC: "https://www.ncdps.gov/our-organization/highway-patrol",
  MI: "https://www.michigan.gov/msp",
  NJ: "https://www.njsp.org",
  VA: "https://www.vsp.virginia.gov",
  WA: "https://www.wsp.wa.gov",
  AZ: "https://www.azdps.gov",
  MA: "https://www.mass.gov/orgs/massachusetts-state-police",
  TN: "https://www.tn.gov/safety/tnhp",
  CO: "https://csp.colorado.gov",
}

/** Local URL patterns — AI substitutes {city} and {county}. */
export const LOCAL_SOURCE_PATTERNS: SourceCatalogSection[] = [
  {
    title: "City Government",
    urls: [
      "https://{city}.gov/news",
      "https://{city}.gov/calendar",
      "https://{city}.gov/events",
      "https://www.cityof{city}.gov/news",
    ],
  },
  {
    title: "County Government",
    urls: [
      "https://{county}county.gov/news",
      "https://{county}county.gov/emergency-management",
      "https://{county}county.gov/public-works",
      "https://{county}county.gov/road-closures",
      "https://www.co.{county}.{state}.us",
    ],
  },
  {
    title: "Local Public Safety",
    urls: [
      "https://police.{city}.gov",
      "https://fire.{city}.gov",
      "https://www.{city}police.gov",
      "https://www.{city}fire.gov",
    ],
  },
  {
    title: "Schools",
    urls: [
      "https://{district}.k12.{state}.us/calendar",
      "https://{district}.org/calendar",
      "https://{district}.org/news",
    ],
    notes: "Discover the school district(s) serving the ZIP and check closure/delay notices.",
  },
  {
    title: "Utilities",
    urls: [],
    notes:
      "Electric utility outage maps, gas utility alerts, water authority advisories, and boil-water notices for the service area.",
  },
  {
    title: "Parks & Recreation",
    urls: [],
    notes: "Municipal and county parks calendars — closures, event cancellations, burn bans.",
  },
]

export function normalizeStateCode(state: string): string {
  return state.trim().toUpperCase().replace(/^US-/, "").slice(0, 2)
}

export function getStateDotUrl(state: string): string | undefined {
  return STATE_DOT_URLS[normalizeStateCode(state)]
}

export function getStateEmaUrl(state: string): string | undefined {
  return STATE_EMA_URLS[normalizeStateCode(state)]
}

export function getStatePoliceUrl(state: string): string | undefined {
  return STATE_POLICE_URLS[normalizeStateCode(state)]
}

function slugLocal(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function expandLocalPatterns(city?: string, county?: string, state?: string): string[] {
  const citySlug = slugLocal(city || "")
  const countySlug = slugLocal(county || city || "")
  const stateLower = (state || "").toLowerCase()
  const urls: string[] = []
  for (const section of LOCAL_SOURCE_PATTERNS) {
    for (const pattern of section.urls) {
      urls.push(
        pattern
          .replace(/\{city\}/g, citySlug)
          .replace(/\{county\}/g, countySlug)
          .replace(/\{state\}/g, stateLower)
          .replace(/\{district\}/g, citySlug)
      )
    }
  }
  return urls.filter(Boolean)
}

/** Full catalog text block for AI system/user prompts. */
export function buildSourceCatalogPrompt(opts: {
  state: string
  city?: string
  county?: string
}): string {
  const stateCode = normalizeStateCode(opts.state)
  const lines: string[] = []

  for (const section of NATIONAL_SOURCE_SECTIONS) {
    lines.push(`${section.title}:`)
    for (const url of section.urls) lines.push(`  - ${url}`)
    if (section.notes) lines.push(`  (${section.notes})`)
  }

  lines.push(`State DOT (${stateCode}):`)
  lines.push(`  - ${getStateDotUrl(stateCode) || "Search state DOT / 511 for " + stateCode}`)
  lines.push(`State Emergency Management (${stateCode}):`)
  lines.push(`  - ${getStateEmaUrl(stateCode) || "Search state EMA / emergency management for " + stateCode}`)
  lines.push(`State Police / Highway Patrol (${stateCode}):`)
  lines.push(
    `  - ${getStatePoliceUrl(stateCode) || "Search state police / highway patrol for " + stateCode}`
  )

  if (opts.city) {
    lines.push(`Local patterns for ${opts.city}, ${stateCode} (discover actual URLs):`)
    for (const url of expandLocalPatterns(opts.city, opts.county, stateCode).slice(0, 12)) {
      lines.push(`  - ${url}`)
    }
    for (const section of LOCAL_SOURCE_PATTERNS) {
      if (section.notes) lines.push(`  (${section.title}: ${section.notes})`)
    }
  }

  lines.push(
    "Also search: Citizen app, Watch Duty, local Fox/ABC/NBC/CBS weather, AccuWeather, Tropical Tidbits."
  )

  return lines.join("\n")
}

export const DISCOVERY_SOURCE_SEARCH_HINTS = [
  "site:weather.gov {city} {state} alert OR warning",
  "site:alerts.weather.gov {state}",
  "site:spc.noaa.gov {state} severe",
  "site:inciweb.wildfire.gov {state}",
  "site:nifc.gov {state} wildfire",
  "site:airnow.gov {city} {state}",
  "site:earthquake.usgs.gov {state}",
  "site:ic3.gov OR site:consumer.ftc.gov scam alert",
  "site:missingkids.org OR site:amberalert.gov {state}",
  "site:ready.gov OR site:fema.gov {state}",
  "511 {state} road closure OR construction",
  "{state} DOT road closure OR construction",
  "{city} boil water advisory OR utility outage",
  "{city} school district closure OR delay",
  "{city} county emergency management alert",
  "site:.gov {city} {state} public safety OR road closure",
  "{city} {state} police OR sheriff press release",
  "{city} {state} fire department alert",
  "{city} parks closure OR event cancellation",
  "Citizen app alerts {city}",
  "Watch Duty wildfire {state} OR {city}",
  "{city} {state} Fox OR ABC OR NBC OR CBS weather forecast",
  "AccuWeather {city} {state} forecast",
  "site:tropicaltidbits.com tropical weather model analysis {state}",
] as const

/** Flat list for DISCOVERY_SOURCE_CATEGORIES compatibility. */
export const DISCOVERY_SOURCE_CATEGORIES = [
  ...NATIONAL_SOURCE_SECTIONS.map((s) => `${s.title}: ${s.urls.join(", ")}`),
  "State DOT websites (511 + state-specific DOT)",
  "State emergency management agencies",
  "State police / highway patrol",
  "City and county .gov news, calendar, events, emergency management, public works, road closures",
  "Local police, fire, and EMS department sites",
  "School district calendars and news",
  "Utility outage maps and boil-water advisories",
  "Municipal and county parks calendars",
  "Citizen app (citizen.com)",
  "Watch Duty (watchduty.com)",
  "Local Fox, ABC, NBC, CBS affiliate weather",
  "AccuWeather and Weather.com local forecasts",
  "Tropical Tidbits tropical analysis and forecast-model guidance (secondary source)",
] as const

export function getDiscoverySearchHints(state: string, city?: string, county?: string): string[] {
  const stateCode = normalizeStateCode(state)
  const cityLabel = city || stateCode
  const countyLabel = county || city || stateCode
  return DISCOVERY_SOURCE_SEARCH_HINTS.map((hint) =>
    hint
      .replace(/\{state\}/g, stateCode)
      .replace(/\{city\}/g, cityLabel)
      .replace(/\{county\}/g, countyLabel)
  )
}
