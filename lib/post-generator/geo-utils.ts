export type ZipLocation = {
  zip: string
  city?: string
  state?: string
  latitude: number
  longitude: number
}

/** Resolved point for jurisdiction-based discovery (city/county/state). */
export type ServiceAreaLocation = {
  label: string
  city?: string
  county?: string
  state?: string
  latitude: number
  longitude: number
  zip?: string
}

export async function resolveZipLocation(zip: string): Promise<ZipLocation | null> {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 24 * 60 * 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      places?: Array<{
        "place name"?: string
        "state abbreviation"?: string
        latitude?: string
        longitude?: string
      }>
    }
    const place = data.places?.[0]
    if (!place?.latitude || !place.longitude) return null
    return {
      zip,
      city: place["place name"],
      state: place["state abbreviation"],
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    }
  } catch {
    return null
  }
}

export async function resolveZipLocations(zips: string[]): Promise<ZipLocation[]> {
  const unique = [...new Set(zips)].slice(0, 3)
  const results = await Promise.all(unique.map((zip) => resolveZipLocation(zip)))
  return results.filter((item): item is ZipLocation => Boolean(item))
}

export function formatZipLabel(locations: ZipLocation[], fallbackZips: string[]): string {
  if (locations.length) {
    return locations
      .map((item) =>
        [item.city, item.state].filter(Boolean).length
          ? `${item.zip} = ${[item.city, item.state].filter(Boolean).join(", ")}`
          : `ZIP ${item.zip}`
      )
      .join("; ")
  }
  return `ZIP codes ${fallbackZips.join(", ")}`
}

function normalizePlaceQuery(value: string): string {
  return value.replace(/\bcounty\b/gi, "").replace(/\s+/g, " ").trim()
}

const US_STATE_NAMES: Record<string, string> = {
  al: "alabama",
  ak: "alaska",
  az: "arizona",
  ar: "arkansas",
  ca: "california",
  co: "colorado",
  ct: "connecticut",
  de: "delaware",
  fl: "florida",
  ga: "georgia",
  hi: "hawaii",
  id: "idaho",
  il: "illinois",
  in: "indiana",
  ia: "iowa",
  ks: "kansas",
  ky: "kentucky",
  la: "louisiana",
  me: "maine",
  md: "maryland",
  ma: "massachusetts",
  mi: "michigan",
  mn: "minnesota",
  ms: "mississippi",
  mo: "missouri",
  mt: "montana",
  ne: "nebraska",
  nv: "nevada",
  nh: "new hampshire",
  nj: "new jersey",
  nm: "new mexico",
  ny: "new york",
  nc: "north carolina",
  nd: "north dakota",
  oh: "ohio",
  ok: "oklahoma",
  or: "oregon",
  pa: "pennsylvania",
  ri: "rhode island",
  sc: "south carolina",
  sd: "south dakota",
  tn: "tennessee",
  tx: "texas",
  ut: "utah",
  vt: "vermont",
  va: "virginia",
  wa: "washington",
  wv: "west virginia",
  wi: "wisconsin",
  wy: "wyoming",
  dc: "district of columbia",
}

function stateMatchesAdmin1(state: string, admin1: string): boolean {
  const stateNorm = state.trim().toLowerCase()
  const adminNorm = admin1.trim().toLowerCase()
  if (!stateNorm || !adminNorm) return false
  if (adminNorm === stateNorm || adminNorm.includes(stateNorm)) return true
  const fullName = US_STATE_NAMES[stateNorm]
  return Boolean(fullName && (adminNorm === fullName || adminNorm.includes(fullName)))
}

/**
 * Resolve service-area coordinates from city/county/state (preferred) or optional ZIPs.
 * Uses Open-Meteo geocoding so discovery no longer depends on ZIP codes.
 */
export async function resolveServiceAreaLocations(opts: {
  serviceAreaType?: string
  city?: string
  county?: string
  state: string
  serviceZips?: string[]
}): Promise<ServiceAreaLocation[]> {
  const zips = opts.serviceZips?.filter(Boolean) ?? []
  if (zips.length) {
    const fromZips = await resolveZipLocations(zips)
    if (fromZips.length) {
      return fromZips.map((item) => ({
        label: [item.city, item.state].filter(Boolean).join(", ") || `ZIP ${item.zip}`,
        city: item.city,
        state: item.state,
        latitude: item.latitude,
        longitude: item.longitude,
        zip: item.zip,
      }))
    }
  }

  const state = opts.state.trim()
  if (!state) return []

  const type = opts.serviceAreaType || (opts.county && !opts.city ? "county" : "city")
  const queries: string[] = []

  const stateFull = US_STATE_NAMES[state.toLowerCase()] || state

  if (type === "state") {
    queries.push(stateFull)
    if (stateFull !== state) queries.push(state)
  } else if (type === "county") {
    const county = opts.county?.trim()
    if (county) {
      queries.push(`${county}, ${stateFull}`)
      queries.push(`${normalizePlaceQuery(county)} County, ${stateFull}`)
      if (stateFull !== state) {
        queries.push(`${county}, ${state}`)
        queries.push(`${normalizePlaceQuery(county)} County, ${state}`)
      }
    }
  } else {
    const city = opts.city?.trim()
    const county = opts.county?.trim()
    if (city && county) {
      queries.push(`${city}, ${normalizePlaceQuery(county)} County, ${stateFull}`)
      if (stateFull !== state) {
        queries.push(`${city}, ${normalizePlaceQuery(county)} County, ${state}`)
      }
    }
    if (city) {
      queries.push(`${city}, ${stateFull}`)
      if (stateFull !== state) queries.push(`${city}, ${state}`)
    }
    if (county) {
      queries.push(`${county}, ${stateFull}`)
      if (stateFull !== state) queries.push(`${county}, ${state}`)
    }
  }

  for (const query of queries) {
    const location = await geocodePlace(query, state)
    if (location) return [location]
  }

  return []
}

async function geocodePlace(query: string, state: string): Promise<ServiceAreaLocation | null> {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", query)
    url.searchParams.set("count", "5")
    url.searchParams.set("language", "en")
    url.searchParams.set("format", "json")
    url.searchParams.set("countryCode", "US")

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 24 * 60 * 60 },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      results?: Array<{
        name?: string
        admin1?: string
        admin2?: string
        latitude?: number
        longitude?: number
      }>
    }
    const match =
      data.results?.find(
        (item) =>
          typeof item.latitude === "number" &&
          typeof item.longitude === "number" &&
          stateMatchesAdmin1(state, item.admin1 || "")
      ) ||
      data.results?.find(
        (item) => typeof item.latitude === "number" && typeof item.longitude === "number"
      )

    if (
      !match ||
      typeof match.latitude !== "number" ||
      typeof match.longitude !== "number"
    ) {
      return null
    }

    return {
      label: [match.name, match.admin2, match.admin1 || state].filter(Boolean).join(", "),
      city: match.name,
      county: match.admin2,
      state: match.admin1 || state,
      latitude: match.latitude,
      longitude: match.longitude,
    }
  } catch {
    return null
  }
}

export function formatServiceAreaLabel(
  locations: ServiceAreaLocation[],
  fallback: { city?: string; county?: string; state?: string }
): string {
  if (locations.length) {
    return locations.map((item) => item.label).join("; ")
  }
  return [fallback.city, fallback.county, fallback.state].filter(Boolean).join(", ") || "service area"
}
