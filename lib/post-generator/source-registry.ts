import {
  STATE_DOT_URLS,
  STATE_EMA_URLS,
  STATE_POLICE_URLS,
} from "@/lib/post-generator/source-catalog"
import type {
  AgencySourceCatalog,
  SourceClass,
  SourceRegistryRecord,
} from "@/lib/post-generator/pipeline-types"

const ALL_AGENCIES = [
  "police",
  "sheriff",
  "state_police",
  "fire",
  "ems",
  "emergency_management",
  "local_government",
  "other",
]

function source(
  id: string,
  name: string,
  domainPatterns: string[],
  sourceCategory: string,
  sourceClass: SourceClass,
  options: Partial<SourceRegistryRecord> = {}
): SourceRegistryRecord {
  return {
    id,
    name,
    domainPatterns,
    sourceCategory,
    sourceClass,
    usageModes: ["trigger_recommendation", "verify_facts"],
    agencyTypes: ALL_AGENCIES,
    geographicCoverage: "national",
    requiresOriginalAuthorityAttribution: sourceClass !== "official_operational_authority",
    canIndependentlySurfaceCandidate:
      sourceClass === "official_operational_authority" ||
      sourceClass === "trusted_operational_intelligence",
    requiresSecondaryConfirmation: sourceClass === "authoritative_data",
    conflictPriority:
      sourceClass === "official_operational_authority"
        ? 100
        : sourceClass === "trusted_operational_intelligence"
          ? 85
          : sourceClass === "authoritative_data"
            ? 75
            : 60,
    active: true,
    ...options,
  }
}

/** Stable source records used for trust, attribution, and agency-catalog construction. */
export const MASTER_SOURCE_REGISTRY: SourceRegistryRecord[] = [
  source("nws", "National Weather Service", ["weather.gov", "api.weather.gov"], "weather", "official_operational_authority"),
  source("noaa", "NOAA", ["noaa.gov", "spc.noaa.gov", "wpc.ncep.noaa.gov", "nhc.noaa.gov", "water.noaa.gov"], "weather", "official_operational_authority"),
  source("fema", "FEMA", ["fema.gov"], "emergency_management", "official_operational_authority"),
  source("ready_gov", "Ready.gov", ["ready.gov"], "preparedness", "official_guidance", {
    canIndependentlySurfaceCandidate: false,
    usageModes: ["education", "supporting_context"],
  }),
  source("watch_duty", "Watch Duty", ["watchduty.org"], "wildfire", "trusted_operational_intelligence", {
    geographicCoverage: "supported_regions",
    requiresSecondaryConfirmation: false,
    conflictPriority: 85,
  }),
  source("nifc", "National Interagency Fire Center", ["nifc.gov"], "wildfire", "official_operational_authority"),
  source("inciweb", "InciWeb", ["inciweb.wildfire.gov"], "wildfire", "official_operational_authority"),
  source("wildfire_gov", "Wildfire.gov", ["wildfire.gov"], "wildfire", "official_operational_authority"),
  source("nasa_firms", "NASA FIRMS", ["firms.modaps.eosdis.nasa.gov"], "wildfire_detection", "authoritative_data", {
    usageModes: ["trigger_recommendation", "verify_facts", "geospatial_context"],
  }),
  source("usgs", "U.S. Geological Survey", ["usgs.gov", "earthquake.usgs.gov"], "geological_hazards", "authoritative_data"),
  source("airnow", "EPA AirNow", ["airnow.gov"], "air_quality", "authoritative_data"),
  source("epa", "U.S. Environmental Protection Agency", ["epa.gov"], "environment", "official_operational_authority"),
  source("arcgis", "ArcGIS", ["arcgis.com", "esri.com"], "geospatial", "authoritative_data", {
    usageModes: ["geospatial_context", "supporting_context"],
    canIndependentlySurfaceCandidate: false,
  }),
  source("poweroutage_us", "PowerOutage.us", ["poweroutage.us"], "utility_outage", "trusted_operational_intelligence", {
    requiresOriginalAuthorityAttribution: true,
  }),
  source("cdc", "Centers for Disease Control and Prevention", ["cdc.gov"], "public_health", "official_guidance"),
  source("fda", "U.S. Food and Drug Administration", ["fda.gov"], "recalls_health", "official_operational_authority"),
  source("usda_fsis", "USDA Food Safety and Inspection Service", ["fsis.usda.gov"], "food_recall", "official_operational_authority"),
  source("cpsc", "Consumer Product Safety Commission", ["cpsc.gov"], "product_recall", "official_operational_authority"),
  source("nhtsa", "National Highway Traffic Safety Administration", ["nhtsa.gov"], "traffic_safety", "official_operational_authority"),
  source("recalls_gov", "Recalls.gov", ["recalls.gov"], "product_recall", "official_operational_authority"),
  source("fbi", "Federal Bureau of Investigation", ["fbi.gov"], "law_enforcement", "official_operational_authority"),
  source("ic3", "FBI Internet Crime Complaint Center", ["ic3.gov"], "scam_cyber", "official_operational_authority"),
  source("ftc", "Federal Trade Commission", ["ftc.gov", "consumer.ftc.gov"], "consumer_scam", "official_operational_authority"),
  source("cisa", "Cybersecurity and Infrastructure Security Agency", ["cisa.gov"], "cybersecurity", "official_operational_authority"),
  source("uspis", "U.S. Postal Inspection Service", ["uspis.gov"], "mail_scam", "official_operational_authority"),
  source("ncmec", "National Center for Missing & Exploited Children", ["missingkids.org"], "missing_person", "official_operational_authority"),
  source("amber_alert", "AMBER Alert", ["amberalert.gov"], "missing_person", "official_operational_authority"),
  source("justice", "U.S. Department of Justice", ["justice.gov"], "law_enforcement", "official_operational_authority"),
  source("dea", "Drug Enforcement Administration", ["dea.gov"], "drug_safety", "official_operational_authority"),
  source("atf", "Bureau of Alcohol, Tobacco, Firearms and Explosives", ["atf.gov"], "law_enforcement", "official_operational_authority"),
  source("usfa", "U.S. Fire Administration", ["usfa.fema.gov"], "fire_safety", "official_guidance"),
  source("nfpa", "National Fire Protection Association", ["nfpa.org"], "fire_safety", "official_guidance"),
  source("nvfc", "National Volunteer Fire Council", ["nvfc.org"], "fire_safety", "official_guidance"),
  source("firewise", "Firewise USA", ["firewise.org"], "wildfire_prevention", "official_guidance"),
  source("hhs", "U.S. Department of Health and Human Services", ["hhs.gov"], "public_health", "official_guidance"),
  source("poison_control", "Poison Control", ["poison.org"], "poison_safety", "official_guidance"),
  source("heart_association", "American Heart Association", ["heart.org"], "ems_education", "official_guidance"),
  source("red_cross", "American Red Cross", ["redcross.org"], "preparedness", "official_guidance"),
  source("fcc", "Federal Communications Commission", ["fcc.gov"], "communications_outage", "official_operational_authority"),
  source("census", "U.S. Census Bureau", ["census.gov"], "geospatial", "authoritative_data", {
    usageModes: ["geospatial_context", "supporting_context"],
    canIndependentlySurfaceCandidate: false,
  }),
  source("openstreetmap", "OpenStreetMap", ["openstreetmap.org"], "geospatial", "authoritative_data", {
    usageModes: ["geospatial_context", "supporting_context"],
    canIndependentlySurfaceCandidate: false,
    requiresSecondaryConfirmation: true,
  }),
]

function hostnameFor(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function findSourceRecord(url: string): SourceRegistryRecord | undefined {
  const hostname = hostnameFor(url)
  if (!hostname) return undefined
  return MASTER_SOURCE_REGISTRY.flatMap((record) =>
    record.active
      ? record.domainPatterns.map((pattern) => ({
          record,
          pattern: pattern.toLowerCase().replace(/^www\./, ""),
        }))
      : []
  )
    .filter(({ pattern }) => hostname === pattern || hostname.endsWith(`.${pattern}`))
    .sort((a, b) => b.pattern.length - a.pattern.length)[0]?.record
}

function stateRecord(
  id: string,
  name: string,
  url: string,
  category: string
): SourceRegistryRecord | null {
  const hostname = hostnameFor(url)
  if (!hostname) return null
  return source(id, name, [hostname], category, "official_operational_authority", {
    geographicCoverage: "state",
  })
}

export function buildAgencySourceCatalog(input: {
  state: string
  agencyName?: string
  agencyOfficialUrls?: string[]
}): AgencySourceCatalog {
  const state = input.state.trim().toUpperCase()
  const stateSources = [
    STATE_DOT_URLS[state]
      ? stateRecord(`${state.toLowerCase()}_dot`, `${state} Department of Transportation`, STATE_DOT_URLS[state], "transportation")
      : null,
    STATE_EMA_URLS[state]
      ? stateRecord(`${state.toLowerCase()}_ema`, `${state} Emergency Management`, STATE_EMA_URLS[state], "emergency_management")
      : null,
    STATE_POLICE_URLS[state]
      ? stateRecord(`${state.toLowerCase()}_police`, `${state} State Police`, STATE_POLICE_URLS[state], "law_enforcement")
      : null,
  ].filter((record): record is SourceRegistryRecord => Boolean(record))

  const agencyOfficialSources = (input.agencyOfficialUrls ?? [])
    .map((url, index) =>
      stateRecord(
        `agency_official_${index + 1}`,
        input.agencyName || "Agency official source",
        url,
        "agency_official"
      )
    )
    .filter((record): record is SourceRegistryRecord => Boolean(record))
    .map((record) => ({ ...record, geographicCoverage: "local" as const }))

  const nationalSources = [...MASTER_SOURCE_REGISTRY]
  return {
    agencyOfficialSources,
    municipalSources: [],
    countySources: [],
    stateSources,
    emergencyManagementSources: stateSources.filter(
      (record) => record.sourceCategory === "emergency_management"
    ),
    transportationSources: stateSources.filter(
      (record) => record.sourceCategory === "transportation"
    ),
    utilitySources: nationalSources.filter((record) => record.id === "poweroutage_us"),
    schoolSources: [],
    publicHealthSources: nationalSources.filter((record) =>
      ["public_health", "recalls_health"].includes(record.sourceCategory)
    ),
    wildfireSources: nationalSources.filter((record) =>
      ["wildfire", "wildfire_detection"].includes(record.sourceCategory)
    ),
    localMediaSources: [],
    gisSources: nationalSources.filter((record) => record.sourceCategory === "geospatial"),
    nationalSources,
  }
}
