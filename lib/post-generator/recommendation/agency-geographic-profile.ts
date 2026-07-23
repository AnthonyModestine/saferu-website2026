import type { PipelineAgencyContext } from "@/lib/post-generator/pipeline-types"

export interface AgencyGeographicProfile {
  agencyName: string
  agencyType: string
  primaryCity: string
  county: string
  state: string
  stateAbbreviation: string
  zipCodes: string[]
  jurisdictionNames: string[]
  neighboringCommunities: string[]
  serviceAreaDescription: string
  timezone: string
}

function stateAbbreviation(state: string): string {
  const trimmed = state.trim()
  if (trimmed.length === 2) return trimmed.toUpperCase()
  return trimmed.slice(0, 2).toUpperCase()
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

export function buildAgencyGeographicProfile(
  context: PipelineAgencyContext
): AgencyGeographicProfile {
  const jurisdictionNames = uniqueStrings([
    context.city,
    context.county ? `${context.county} County` : undefined,
    context.county,
    context.agencyName,
  ])

  const serviceAreaDescription = [context.city, context.county, context.state]
    .filter(Boolean)
    .join(", ")

  return {
    agencyName: context.agencyName,
    agencyType: context.agencyType,
    primaryCity: context.city || "",
    county: context.county || "",
    state: context.state,
    stateAbbreviation: stateAbbreviation(context.state),
    zipCodes: context.serviceZips ?? [],
    jurisdictionNames,
    neighboringCommunities: [],
    serviceAreaDescription,
    timezone: context.timezone || "America/New_York",
  }
}
