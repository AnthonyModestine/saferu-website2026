/**
 * Persist Press Center agency settings per member (service area, logo, contacts).
 * localStorage remains the fast client cache; this is the account-backed source of truth.
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "agency-settings.json")

export type ServiceAreaType = "city" | "county" | "state"

export type StoredAgencySettings = {
  agencyName: string
  agencyType: string
  agencyTypeOther: string
  serviceAreaType: ServiceAreaType
  city: string
  county: string
  state: string
  serviceZips: string
  boilerplate: string
  logoUrl: string | null
  contactName: string
  contactPhone: string
  contactPhone2: string
  contactEmail: string
  updatedAt: string
}

type FileStore = Record<string, StoredAgencySettings>

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as FileStore
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

function normalize(input: Partial<StoredAgencySettings>): StoredAgencySettings {
  const area = String(input.serviceAreaType || "city")
  const serviceAreaType: ServiceAreaType =
    area === "county" || area === "state" || area === "city" ? area : "city"
  return {
    agencyName: String(input.agencyName || "").trim().slice(0, 120),
    agencyType: String(input.agencyType || "").trim().slice(0, 40),
    agencyTypeOther: String(input.agencyTypeOther || "").trim().slice(0, 80),
    serviceAreaType,
    city: String(input.city || "").trim().slice(0, 80),
    county: String(input.county || "").trim().slice(0, 80),
    state: String(input.state || "").trim().slice(0, 40),
    serviceZips: String(input.serviceZips || "").trim().slice(0, 200),
    boilerplate: String(input.boilerplate || "").trim().slice(0, 4000),
    logoUrl:
      typeof input.logoUrl === "string" && input.logoUrl.startsWith("data:")
        ? input.logoUrl.slice(0, 900_000)
        : typeof input.logoUrl === "string" && input.logoUrl.startsWith("/")
          ? input.logoUrl.slice(0, 300)
          : null,
    contactName: String(input.contactName || "").trim().slice(0, 80),
    contactPhone: String(input.contactPhone || "").trim().slice(0, 40),
    contactPhone2: String(input.contactPhone2 || "").trim().slice(0, 40),
    contactEmail: String(input.contactEmail || "").trim().slice(0, 120),
    updatedAt: new Date().toISOString(),
  }
}

export async function getStoredAgencySettings(
  memberId: string
): Promise<StoredAgencySettings | null> {
  if (!memberId.trim()) return null

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT data FROM agency_settings_profiles
      WHERE member_id = ${memberId}
      LIMIT 1
    `
    const row = (rows as Array<{ data: unknown }>)[0]
    if (!row?.data) return null
    return normalize(row.data as Partial<StoredAgencySettings>)
  }

  const store = await readFileStore()
  return store[memberId] ? normalize(store[memberId]) : null
}

export async function saveStoredAgencySettings(
  memberId: string,
  input: Partial<StoredAgencySettings>
): Promise<StoredAgencySettings> {
  const settings = normalize(input)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await db`
      INSERT INTO agency_settings_profiles (member_id, data, updated_at)
      VALUES (${memberId}, ${JSON.stringify(settings)}::jsonb, ${Date.now()})
      ON CONFLICT (member_id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `
    return settings
  }

  const store = await readFileStore()
  store[memberId] = settings
  await writeFileStore(store)
  return settings
}

