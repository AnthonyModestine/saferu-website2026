/** Shared service-area readiness checks (safe for client + server). */

export function isAgencyLocationReady(settings: {
  agencyType?: string | null
  state?: string | null
  serviceAreaType?: string | null
  city?: string | null
  county?: string | null
}): boolean {
  const state = (settings.state || "").trim()
  const agencyType = (settings.agencyType || "").trim()
  if (!agencyType || !state) return false
  const area = settings.serviceAreaType || "city"
  if (area === "state") return true
  if (area === "county") return Boolean((settings.county || "").trim())
  // City / township: city + state is enough; county improves accuracy but is optional.
  return Boolean((settings.city || "").trim())
}

export function agencyLocationMissing(settings: {
  agencyType?: string | null
  state?: string | null
  serviceAreaType?: string | null
  city?: string | null
  county?: string | null
}): string[] {
  const missing: string[] = []
  if (!(settings.agencyType || "").trim()) missing.push("agency type")
  if (!(settings.state || "").trim()) missing.push("state")
  const area = settings.serviceAreaType || "city"
  if (area === "county" && !(settings.county || "").trim()) missing.push("county")
  if (area === "city" && !(settings.city || "").trim()) missing.push("city / township")
  return missing
}
