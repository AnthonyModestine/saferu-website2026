import "server-only"

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { getStoredAgencySettings } from "@/lib/agency-settings-store"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import type { GraphicStudioSource } from "@/lib/pio-graphic-studio-types"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "graphic-studio-generations.json")
const MAX_RECORDS = 400

export type GraphicStudioRecord = {
  graphic_id: string
  agency_id: string
  user_id: string
  graphic_type: "safety"
  category: string
  audience: string
  original_user_request: string
  approved_headline: string
  approved_supporting_line: string
  approved_body_copy: string
  approved_emergency_message: string
  visual_style: string
  research_json: unknown
  source_records: GraphicStudioSource[]
  image_prompt: string
  agency_logo_used: boolean
  generation_model: string
  generated_at: string
  revision_count: number
  status: "draft" | "generated" | "revised" | "saved"
  /** Public URL for the graphic image (Blob or local) — set on generate for admin review. */
  image_url?: string | null
  social_caption?: string
  saved_at?: string | null
  feedback?: GraphicStudioFeedback | null
}

export type GraphicStudioFeedback = {
  rating: "positive" | "negative"
  reason?: string
  comment?: string
  submitted_at: string
}

export type SavedGraphicSummary = {
  graphicId: string
  headline: string
  message: string
  caption: string
  category: string
  topic: string
  imageUrl: string
  savedAt: string
  generatedAt: string
  generationModel: string
}

export type AdminGraphicSummary = {
  graphicId: string
  userEmail: string
  agencyName: string
  headline: string
  message: string
  caption: string
  category: string
  topic: string
  imageUrl: string
  status: GraphicStudioRecord["status"]
  savedAt: string | null
  generatedAt: string
  generationModel: string
  revisionCount: number
  feedback: GraphicStudioFeedback | null
}

type FileStore = { records: GraphicStudioRecord[] }

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function captionFromRecord(record: GraphicStudioRecord): string {
  if (typeof record.social_caption === "string" && record.social_caption.trim()) {
    return record.social_caption.trim()
  }
  const research = record.research_json
  if (research && typeof research === "object" && !Array.isArray(research)) {
    const caption = (research as { social_caption?: unknown }).social_caption
    if (typeof caption === "string") return caption.trim()
  }
  return ""
}

function toSavedSummary(record: GraphicStudioRecord): SavedGraphicSummary | null {
  if (!record.image_url || !record.saved_at) return null
  return {
    graphicId: record.graphic_id,
    headline: record.approved_headline,
    message: record.approved_body_copy,
    caption: captionFromRecord(record),
    category: record.category,
    topic: record.original_user_request,
    imageUrl: record.image_url,
    savedAt: record.saved_at,
    generatedAt: record.generated_at,
    generationModel: record.generation_model,
  }
}

function toAdminSummary(record: GraphicStudioRecord): AdminGraphicSummary | null {
  if (!record.image_url) return null
  return {
    graphicId: record.graphic_id,
    userEmail: record.user_id,
    agencyName: record.agency_id,
    headline: record.approved_headline,
    message: record.approved_body_copy,
    caption: captionFromRecord(record),
    category: record.category,
    topic: record.original_user_request,
    imageUrl: record.image_url,
    status: record.status,
    savedAt: record.saved_at ?? null,
    generatedAt: record.generated_at,
    generationModel: record.generation_model,
    revisionCount: record.revision_count,
    feedback: record.feedback ?? null,
  }
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as FileStore
    return Array.isArray(parsed.records) ? parsed : { records: [] }
  } catch {
    return { records: [] }
  }
}

async function writeFileStore(store: FileStore): Promise<boolean> {
  try {
    await mkdir(DATA_DIR, { recursive: true })
    const records = store.records.slice(-MAX_RECORDS)
    await writeFile(STORE_PATH, JSON.stringify({ records }, null, 2), "utf-8")
    return true
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio-store] Could not persist generation record:", detail)
    return false
  }
}

async function upsertDbRecord(record: GraphicStudioRecord): Promise<void> {
  await ensureSchema()
  const db = getSql()
  const email = normalizeEmail(record.user_id)
  const savedAtMs = record.saved_at ? Date.parse(record.saved_at) : null
  const updatedAt = Date.now()
  await db`
    INSERT INTO graphic_studio_records (graphic_id, user_email, data, saved_at, updated_at)
    VALUES (
      ${record.graphic_id},
      ${email},
      ${JSON.stringify(record)}::jsonb,
      ${Number.isFinite(savedAtMs) ? savedAtMs : null},
      ${updatedAt}
    )
    ON CONFLICT (graphic_id) DO UPDATE SET
      user_email = EXCLUDED.user_email,
      data = EXCLUDED.data,
      saved_at = EXCLUDED.saved_at,
      updated_at = EXCLUDED.updated_at
  `
}

export async function saveGraphicStudioRecord(record: GraphicStudioRecord): Promise<boolean> {
  try {
    if (isDatabaseConfigured()) {
      await upsertDbRecord(record)
      return true
    }
    const store = await readFileStore()
    const idx = store.records.findIndex((item) => item.graphic_id === record.graphic_id)
    if (idx >= 0) store.records[idx] = record
    else store.records.push(record)
    return await writeFileStore(store)
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio-store] save failed:", detail)
    return false
  }
}

export async function getGraphicStudioRecord(
  graphicId: string
): Promise<GraphicStudioRecord | null> {
  if (!graphicId.trim()) return null

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT data FROM graphic_studio_records
      WHERE graphic_id = ${graphicId}
      LIMIT 1
    `
    const row = (rows as Array<{ data: unknown }>)[0]
    return row?.data ? (row.data as GraphicStudioRecord) : null
  }

  const store = await readFileStore()
  return store.records.find((item) => item.graphic_id === graphicId) ?? null
}

export async function listSavedGraphicsForUser(email: string): Promise<SavedGraphicSummary[]> {
  const key = normalizeEmail(email)
  if (!key) return []

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT data FROM graphic_studio_records
      WHERE user_email = ${key}
        AND saved_at IS NOT NULL
      ORDER BY saved_at DESC
      LIMIT 100
    `
    return (rows as Array<{ data: unknown }>)
      .map((row) => toSavedSummary(row.data as GraphicStudioRecord))
      .filter((item): item is SavedGraphicSummary => Boolean(item))
  }

  const store = await readFileStore()
  return store.records
    .filter((item) => normalizeEmail(item.user_id) === key && item.saved_at && item.image_url)
    .map((item) => toSavedSummary(item))
    .filter((item): item is SavedGraphicSummary => Boolean(item))
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
    .slice(0, 100)
}

export async function markGraphicSaved(opts: {
  graphicId: string
  userEmail: string
  imageUrl: string
  headline?: string
  message?: string
  caption?: string
  topic?: string
  category?: string
  style?: string
}): Promise<GraphicStudioRecord | null> {
  const existing = await getGraphicStudioRecord(opts.graphicId)
  const now = new Date().toISOString()
  const email = normalizeEmail(opts.userEmail)

  const record: GraphicStudioRecord = existing
    ? {
        ...existing,
        user_id: email || existing.user_id,
        approved_headline: opts.headline?.trim() || existing.approved_headline,
        approved_body_copy: opts.message?.trim() || existing.approved_body_copy,
        original_user_request: opts.topic?.trim() || existing.original_user_request,
        category: opts.category?.trim() || existing.category,
        visual_style: opts.style?.trim() || existing.visual_style,
        social_caption: opts.caption?.trim() || captionFromRecord(existing),
        image_url: opts.imageUrl,
        saved_at: now,
        status: "saved",
      }
    : {
        graphic_id: opts.graphicId,
        agency_id: email,
        user_id: email,
        graphic_type: "safety",
        category: opts.category?.trim() || "Other / Custom",
        audience: "General Community",
        original_user_request: opts.topic?.trim() || "",
        approved_headline: opts.headline?.trim() || "Saved graphic",
        approved_supporting_line: "",
        approved_body_copy: opts.message?.trim() || "",
        approved_emergency_message: "",
        visual_style: opts.style?.trim() || "Let SaferU Decide",
        research_json: {},
        source_records: [],
        image_prompt: "",
        agency_logo_used: false,
        generation_model: "saved",
        generated_at: now,
        revision_count: 0,
        status: "saved",
        image_url: opts.imageUrl,
        social_caption: opts.caption?.trim() || "",
        saved_at: now,
      }

  const ok = await saveGraphicStudioRecord(record)
  return ok ? record : null
}

export async function unsaveGraphicForUser(
  graphicId: string,
  userEmail: string
): Promise<boolean> {
  const record = await getGraphicStudioRecord(graphicId)
  if (!record) return false
  if (normalizeEmail(record.user_id) !== normalizeEmail(userEmail)) return false

  const next: GraphicStudioRecord = {
    ...record,
    saved_at: null,
    status: record.revision_count > 0 ? "revised" : "generated",
  }
  return saveGraphicStudioRecord(next)
}

export async function listGraphicsForAdmin(limit = 200): Promise<AdminGraphicSummary[]> {
  const cap = Math.min(500, Math.max(1, Math.floor(limit)))

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT data FROM graphic_studio_records
      ORDER BY updated_at DESC
      LIMIT ${cap}
    `
    return (rows as Array<{ data: unknown }>)
      .map((row) => toAdminSummary(row.data as GraphicStudioRecord))
      .filter((item): item is AdminGraphicSummary => Boolean(item))
  }

  const store = await readFileStore()
  return store.records
    .map((item) => toAdminSummary(item))
    .filter((item): item is AdminGraphicSummary => Boolean(item))
    .sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt))
    .slice(0, cap)
}

export async function updateGraphicImage(opts: {
  graphicId: string
  userEmail: string
  imageUrl: string
  status?: GraphicStudioRecord["status"]
  revisionCount?: number
  generationModel?: string
  clearFeedback?: boolean
}): Promise<boolean> {
  const record = await getGraphicStudioRecord(opts.graphicId)
  if (!record) return false
  if (normalizeEmail(record.user_id) !== normalizeEmail(opts.userEmail)) return false

  const next: GraphicStudioRecord = {
    ...record,
    image_url: opts.imageUrl,
    status: opts.status ?? record.status,
    revision_count:
      typeof opts.revisionCount === "number" ? opts.revisionCount : record.revision_count,
    generation_model: opts.generationModel?.trim() || record.generation_model,
    feedback: opts.clearFeedback ? null : record.feedback,
  }
  return saveGraphicStudioRecord(next)
}

export async function submitGraphicStudioFeedback(opts: {
  graphicId: string
  userEmail: string
  rating: "positive" | "negative"
  reason?: string
  comment?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const record = await getGraphicStudioRecord(opts.graphicId)
  if (!record) return { ok: false, error: "Graphic not found." }
  if (normalizeEmail(record.user_id) !== normalizeEmail(opts.userEmail)) {
    return { ok: false, error: "You can only rate your own graphics." }
  }
  if (record.feedback) {
    return { ok: false, error: "Feedback already submitted for this graphic." }
  }
  if (opts.rating === "negative" && !String(opts.reason || "").trim()) {
    return { ok: false, error: "Please tell us what could be improved." }
  }

  const next: GraphicStudioRecord = {
    ...record,
    feedback: {
      rating: opts.rating,
      reason: opts.rating === "negative" ? String(opts.reason || "").trim() : undefined,
      comment: String(opts.comment || "").trim() || undefined,
      submitted_at: new Date().toISOString(),
    },
  }
  const ok = await saveGraphicStudioRecord(next)
  return ok ? { ok: true } : { ok: false, error: "Could not save feedback." }
}

export async function resolveMemberAgencyLogo(
  memberId: string,
  fallback?: string | null
): Promise<string | null> {
  const stored = await getStoredAgencySettings(memberId)
  if (stored?.logoUrl) return stored.logoUrl
  if (typeof fallback === "string" && fallback.startsWith("/")) return fallback.slice(0, 300)
  if (
    typeof fallback === "string" &&
    (fallback.startsWith("http://") || fallback.startsWith("https://"))
  ) {
    return fallback.slice(0, 400)
  }
  if (typeof fallback === "string" && fallback.startsWith("data:") && fallback.length < 400_000) {
    return fallback
  }
  return null
}
