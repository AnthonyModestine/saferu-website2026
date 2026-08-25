import "server-only"

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import type { GraphicStudioSource } from "@/lib/pio-graphic-studio-types"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "graphic-studio-generations.json")
const MAX_RECORDS = 400

export type GraphicStudioRecord = {
  graphic_id: string
  agency_id: string
  user_id: string
  graphic_type: "safety" | "event"
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
  status: "draft" | "generated" | "revised"
}

type FileStore = { records: GraphicStudioRecord[] }

async function readStore(): Promise<FileStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as FileStore
    return Array.isArray(parsed.records) ? parsed : { records: [] }
  } catch {
    return { records: [] }
  }
}

async function writeStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const records = store.records.slice(-MAX_RECORDS)
  await writeFile(STORE_PATH, JSON.stringify({ records }, null, 2), "utf-8")
}

export async function saveGraphicStudioRecord(
  record: GraphicStudioRecord
): Promise<void> {
  const store = await readStore()
  const idx = store.records.findIndex((item) => item.graphic_id === record.graphic_id)
  if (idx >= 0) store.records[idx] = record
  else store.records.push(record)
  await writeStore(store)
}

export async function getGraphicStudioRecord(
  graphicId: string
): Promise<GraphicStudioRecord | null> {
  const store = await readStore()
  return store.records.find((item) => item.graphic_id === graphicId) ?? null
}
