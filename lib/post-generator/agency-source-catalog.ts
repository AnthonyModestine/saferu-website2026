import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { buildAgencySourceCatalog } from "@/lib/post-generator/source-registry"
import type { AgencySourceCatalog } from "@/lib/post-generator/pipeline-types"

export async function buildAndSaveAgencySourceCatalog(input: {
  memberEmail: string
  agencyName: string
  state: string
  city: string
  county: string
  serviceAreaType: string
  agencyOfficialUrls?: string[]
}): Promise<AgencySourceCatalog> {
  const catalog = buildAgencySourceCatalog({
    state: input.state,
    agencyName: input.agencyName,
    agencyOfficialUrls: input.agencyOfficialUrls,
  })

  if (!isDatabaseConfigured()) return catalog
  try {
    await ensureSchema()
    const db = getSql()
    const serviceAreaKey = [
      input.serviceAreaType,
      input.city.trim().toLowerCase(),
      input.county.trim().toLowerCase(),
      input.state.trim().toUpperCase(),
    ].join(":")
    await db`
      INSERT INTO agency_source_catalogs (
        member_email,
        agency_name,
        state,
        service_area_key,
        data,
        updated_at
      )
      VALUES (
        ${input.memberEmail.toLowerCase()},
        ${input.agencyName},
        ${input.state.toUpperCase()},
        ${serviceAreaKey},
        ${JSON.stringify(catalog)}::jsonb,
        ${Date.now()}
      )
      ON CONFLICT (member_email)
      DO UPDATE SET
        agency_name = EXCLUDED.agency_name,
        state = EXCLUDED.state,
        service_area_key = EXCLUDED.service_area_key,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `
  } catch (error) {
    // Catalog persistence must not prevent an urgent recommendation run.
    console.error("[agency-source-catalog] Unable to persist catalog:", error)
  }
  return catalog
}
