/**
 * Per-member Press Center voice memory.
 * Learns from revision directions, caption adjustments, and thumbs feedback,
 * then compiles a short brief injected into generation prompts.
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { getStoredAgencySettings } from "@/lib/agency-settings-store"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "agency-voice-memory.json")
const MAX_SIGNALS = 80

export type VoiceSignalKind =
  | "revision_direction"
  | "caption_adjust"
  | "feedback_positive"
  | "feedback_negative"
  | "manual_note"
  | "saved_example"

export type VoiceSignal = {
  id: string
  kind: VoiceSignalKind
  detail: string
  meta?: string
  createdAt: string
}

export type AgencyVoiceMemory = {
  memberId: string
  manualNotes: string
  signals: VoiceSignal[]
  updatedAt: string
}

type FileStore = Record<string, AgencyVoiceMemory>

const CAPTION_MODE_LABELS: Record<string, string> = {
  shorter: "prefers shorter captions",
  longer: "prefers slightly longer captions with more context",
  more_urgent: "prefers more urgent, direct language",
  calmer: "prefers calmer, reassuring tone",
  more_formal: "prefers formal, official government tone",
  stronger_cta: "prefers strong, clear calls to action",
}

const FEEDBACK_LABELS: Record<string, string> = {
  wrong_tone: "previous drafts missed preferred tone",
  too_long: "prefers shorter drafts",
  too_short: "prefers more detail / longer drafts",
  missing_information: "wants fuller factual coverage when facts allow",
  formatting_issue: "cares about clean formatting",
  other: "flagged quality issues for revision",
}

function emptyMemory(memberId: string): AgencyVoiceMemory {
  return {
    memberId,
    manualNotes: "",
    signals: [],
    updatedAt: new Date().toISOString(),
  }
}

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

function normalizeMemory(memberId: string, raw: Partial<AgencyVoiceMemory> | null): AgencyVoiceMemory {
  const signals = Array.isArray(raw?.signals)
    ? raw!.signals
        .filter((s) => s && typeof s === "object" && typeof s.detail === "string")
        .map((s) => ({
          id: String(s.id || `vs_${Date.now().toString(36)}`),
          kind: s.kind as VoiceSignalKind,
          detail: String(s.detail || "").trim().slice(0, 1000),
          meta: s.meta ? String(s.meta).trim().slice(0, 120) : undefined,
          createdAt: String(s.createdAt || new Date().toISOString()),
        }))
        .filter((s) => s.detail && s.kind)
        .slice(0, MAX_SIGNALS)
    : []
  return {
    memberId,
    manualNotes: String(raw?.manualNotes || "").trim().slice(0, 2000),
    signals,
    updatedAt: String(raw?.updatedAt || new Date().toISOString()),
  }
}

export async function getAgencyVoiceMemory(memberId: string): Promise<AgencyVoiceMemory> {
  const id = memberId.trim()
  if (!id) return emptyMemory("")

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT data FROM agency_voice_memory
      WHERE member_id = ${id}
      LIMIT 1
    `
    const row = (rows as Array<{ data: unknown }>)[0]
    if (!row?.data) return emptyMemory(id)
    return normalizeMemory(id, row.data as Partial<AgencyVoiceMemory>)
  }

  const store = await readFileStore()
  return store[id] ? normalizeMemory(id, store[id]) : emptyMemory(id)
}

async function saveAgencyVoiceMemory(memory: AgencyVoiceMemory): Promise<AgencyVoiceMemory> {
  const next = normalizeMemory(memory.memberId, {
    ...memory,
    updatedAt: new Date().toISOString(),
  })

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO agency_voice_memory (member_id, data, updated_at)
      VALUES (${next.memberId}, ${JSON.stringify(next)}, ${Date.now()})
      ON CONFLICT (member_id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `
    return next
  }

  const store = await readFileStore()
  store[next.memberId] = next
  await writeFileStore(store)
  return next
}

export async function setVoiceManualNotes(memberId: string, notes: string): Promise<AgencyVoiceMemory> {
  const current = await getAgencyVoiceMemory(memberId)
  return saveAgencyVoiceMemory({
    ...current,
    manualNotes: notes.trim().slice(0, 2000),
  })
}

export async function recordVoiceSignal(input: {
  memberId: string
  kind: VoiceSignalKind
  detail: string
  meta?: string
}): Promise<AgencyVoiceMemory | null> {
  const memberId = input.memberId.trim()
  const detail = input.detail.trim().slice(0, 1000)
  if (!memberId || !detail) return null

  const current = await getAgencyVoiceMemory(memberId)
  const signal: VoiceSignal = {
    id: `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    kind: input.kind,
    detail,
    meta: input.meta?.trim().slice(0, 120),
    createdAt: new Date().toISOString(),
  }

  // Dedupe near-identical consecutive signals
  const last = current.signals[0]
  if (
    last &&
    last.kind === signal.kind &&
    last.detail.toLowerCase() === signal.detail.toLowerCase()
  ) {
    return current
  }

  return saveAgencyVoiceMemory({
    ...current,
    signals: [signal, ...current.signals].slice(0, MAX_SIGNALS),
  })
}

function topCounts(items: string[], limit = 4): string[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = item.trim().toLowerCase()
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key)
}

/** Compile a prompt-ready brief from signals + agency settings. No extra AI call. */
export function compileAgencyVoiceBrief(
  memory: AgencyVoiceMemory,
  opts?: { agencyName?: string; boilerplate?: string }
): string {
  const lines: string[] = []
  const agency = opts?.agencyName?.trim()
  if (agency) lines.push(`Agency: ${agency}`)

  if (memory.manualNotes.trim()) {
    lines.push(`PIO voice notes (explicit): ${memory.manualNotes.trim()}`)
  }

  const adjusts = memory.signals
    .filter((s) => s.kind === "caption_adjust")
    .map((s) => CAPTION_MODE_LABELS[s.detail] || s.detail)
  const adjustPrefs = topCounts(adjusts, 3)
  if (adjustPrefs.length) {
    lines.push(`Caption / social preferences: ${adjustPrefs.join("; ")}`)
  }

  const revisions = memory.signals
    .filter((s) => s.kind === "revision_direction")
    .map((s) => s.detail)
    .slice(0, 5)
  if (revisions.length) {
    lines.push(`Recent revision requests (follow these patterns):`)
    for (const r of revisions) lines.push(`- ${r}`)
  }

  const neg = memory.signals
    .filter((s) => s.kind === "feedback_negative")
    .map((s) => FEEDBACK_LABELS[s.detail] || s.detail)
  const negPrefs = topCounts(neg, 3)
  if (negPrefs.length) {
    lines.push(`Avoid repeating: ${negPrefs.join("; ")}`)
  }

  const posCount = memory.signals.filter((s) => s.kind === "feedback_positive").length
  if (posCount >= 3) {
    lines.push(`This PIO often accepts first drafts — keep voice consistent with recent accepted style.`)
  }

  const examples = memory.signals
    .filter((s) => s.kind === "saved_example")
    .map((s) => s.detail)
    .slice(0, 2)
  if (examples.length) {
    lines.push(`Recent accepted language samples (match tone, do not copy facts):`)
    for (const ex of examples) lines.push(`- ${ex.slice(0, 280)}`)
  }

  if (opts?.boilerplate?.trim()) {
    lines.push(
      `Boilerplate style hint: match the formality of this agency about text when closing or describing the department.`
    )
  }

  if (lines.length <= (agency ? 1 : 0)) return ""

  return [
    "AGENCY VOICE MEMORY (learned from this PIO — prioritize so first drafts match their voice):",
    ...lines,
    "Follow SaferU accuracy rules first; never invent facts to satisfy voice preferences.",
  ].join("\n")
}

export async function getAgencyVoiceBrief(memberId: string): Promise<string> {
  if (!memberId.trim()) return ""
  const [memory, settings] = await Promise.all([
    getAgencyVoiceMemory(memberId),
    getStoredAgencySettings(memberId),
  ])
  return compileAgencyVoiceBrief(memory, {
    agencyName: settings?.agencyName,
    boilerplate: settings?.boilerplate,
  })
}

export function voiceMemoryStatus(memory: AgencyVoiceMemory): {
  signalCount: number
  learning: "new" | "learning" | "strong"
  summary: string
} {
  const signalCount = memory.signals.length + (memory.manualNotes.trim() ? 2 : 0)
  const learning = signalCount >= 12 ? "strong" : signalCount >= 3 ? "learning" : "new"
  const summary =
    learning === "strong"
      ? "SaferU has a strong read on this agency's voice."
      : learning === "learning"
        ? "SaferU is learning this agency's voice from edits and feedback."
        : "Use Press Center a few times — revise, adjust captions, or rate drafts — and SaferU will learn this voice."
  return { signalCount: memory.signals.length, learning, summary }
}
