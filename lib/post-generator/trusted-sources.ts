/**
 * Trusted-source allowlist for Post Idea Generator discovery.
 * Untrusted sources are rejected or heavily penalized before recommendations appear.
 */

const TRUSTED_HOST_SUFFIXES = [
  "weather.gov",
  "alerts.weather.gov",
  "noaa.gov",
  "fema.gov",
  "ready.gov",
  "cdc.gov",
  "fbi.gov",
  "ic3.gov",
  "nhtsa.gov",
  "ncmec.org",
  "missingkids.org",
  "dot.gov",
  "usgs.gov",
  "redcross.org",
  "saferu.com",
  "citizen.com",
  "airnow.gov",
  "epa.gov",
  "nifc.gov",
  "watchduty.com",
  "accuweather.com",
  "weather.com",
  "inciweb.wildfire.gov",
  "fire.ca.gov",
  "fs.usda.gov",
  "cisa.gov",
  "consumer.ftc.gov",
  "ftc.gov",
  "nfpa.org",
  "usfa.fema.gov",
  "amberalert.gov",
  "spc.noaa.gov",
  "nhc.noaa.gov",
]

/** Useful for weather discovery/analysis, but not an issuing authority. */
const SECONDARY_WEATHER_HOST_SUFFIXES = ["tropicaltidbits.com"]

/** Known national campaigns / institutions that can score well without local distance. */
const NATIONAL_VALUE_HOST_SUFFIXES = [
  "cdc.gov",
  "fbi.gov",
  "ic3.gov",
  "consumer.ftc.gov",
  "ftc.gov",
  "cisa.gov",
  "nhtsa.gov",
  "ncmec.org",
  "missingkids.org",
  "amberalert.gov",
  "fema.gov",
  "ready.gov",
  "nifc.gov",
  "inciweb.wildfire.gov",
  "usfa.fema.gov",
]

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "")
}

function hostMatches(hostname: string, suffix: string): boolean {
  const host = normalizeHost(hostname)
  return host === suffix || host.endsWith(`.${suffix}`)
}

export function extractHostname(url?: string | null): string | null {
  if (!url?.trim()) return null
  try {
    return normalizeHost(new URL(url).hostname)
  } catch {
    return null
  }
}

export function isTrustedSourceUrl(url?: string | null, sourceName?: string | null): boolean {
  const host = extractHostname(url)
  if (host) {
    if (host.endsWith(".gov") || host.endsWith(".mil")) return true
    if (TRUSTED_HOST_SUFFIXES.some((suffix) => hostMatches(host, suffix))) return true
    if (SECONDARY_WEATHER_HOST_SUFFIXES.some((suffix) => hostMatches(host, suffix))) return true
    // Municipal/county school/utility sites are often .org or civic domains with official names.
    if (/\.(us)$/i.test(host)) return true
  }

  const name = (sourceName || "").toLowerCase()
  if (!name) return false
  const trustedNameHints = [
    "national weather service",
    "nws",
    "noaa",
    "fema",
    "cdc",
    "fbi",
    "ic3",
    "internet crime complaint",
    "nhtsa",
    "ncmec",
    "missing and exploited children",
    "missing kids",
    "amber alert",
    "watch duty",
    "nifc",
    "interagency fire",
    "department of transportation",
    "dot",
    "dot traffic",
    "511",
    "county",
    "city of",
    "township",
    "borough",
    "police",
    "sheriff",
    "fire department",
    "emergency management",
    "public works",
    "utility",
    "power outage",
    "boil water",
    "school district",
    "health department",
    "transit",
    "red cross",
    "saferu",
    "citizen app",
    "citizen.com",
    "airnow",
    "environmental protection",
    "geological survey",
    "usgs",
    "accuweather",
    "weather.com",
    "tropical tidbits",
    "fox weather",
    "fox 26",
    "fox 29",
    "abc13",
    "abc 13",
    "nbc weather",
    "cbs weather",
    "meteorologist",
    "weather team",
    "local forecast",
    "ftc",
    "consumer protection",
    "cisa",
    "usfa",
    "nfpa",
    "inciweb",
    "forest service",
    "penndot",
    "txdot",
    "caltrans",
    "state patrol",
    "highway patrol",
  ]
  return trustedNameHints.some((hint) => name.includes(hint))
}

export function isNationalValueSource(url?: string | null, sourceName?: string | null): boolean {
  const host = extractHostname(url)
  if (host && NATIONAL_VALUE_HOST_SUFFIXES.some((suffix) => hostMatches(host, suffix))) {
    return true
  }
  const name = (sourceName || "").toLowerCase()
  return /\b(fbi|ic3|cdc|ftc|cisa|nhtsa|ncmec|fema|ready\.gov|missing children|amber alert|nifc|inciweb|usfa)\b/i.test(name)
}

/** 0–100 source reliability based on allowlist + named institution quality. */
export function scoreSourceTrust(sourceUrl?: string | null, sourceName?: string | null): number {
  const host = extractHostname(sourceUrl)
  if (host?.endsWith(".gov") || host?.endsWith(".mil")) return 98
  if (host && SECONDARY_WEATHER_HOST_SUFFIXES.some((suffix) => hostMatches(host, suffix))) {
    return 78
  }
  if (host && TRUSTED_HOST_SUFFIXES.some((suffix) => hostMatches(host, suffix))) return 95
  if (isTrustedSourceUrl(sourceUrl, sourceName)) {
    if (host?.endsWith(".org")) return 78
    return 82
  }
  // Named official source without a URL still gets partial credit (e.g. NWS forecasts).
  if ((sourceName || "").trim()) return 55
  return 20
}
