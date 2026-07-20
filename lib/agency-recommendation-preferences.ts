/**
 * Per-agency recommendation preferences for Post Generator learning.
 * Professional actions: endorse / decline / published.
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "agency-recommendation-preferences.json")

export type RecommendationPreferenceAction = "endorse" | "decline" | "published"

export type RecommendationPreferenceRecord = {
  id: string
  memberId: string
  agencyName: string
  action: RecommendationPreferenceAction
  opportunityId: string
  title: string
  category: string
  topicKey: string
  sourceLabel: string
  signals: string[]
  createdAt: string
}

type FileStore = {
  records: RecommendationPreferenceRecord[]
}

export type AgencyPreferenceProfile = {
  endorsedTopicKeys: string[]
  declinedTopicKeys: string[]
  publishedTopicKeys: string[]
  endorsedCategories: string[]
  declinedCategories: string[]
  recentActions: RecommendationPreferenceRecord[]
}

function emptyProfile(): AgencyPreferenceProfile {
  return {
    endorsedTopicKeys: [],
    declinedTopicKeys: [],
    publishedTopicKeys: [],
    endorsedCategories: [],
    declinedCategories: [],
    recentActions: [],
  }
}

function uniq(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))]
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as FileStore
    return { records: Array.isArray(parsed.records) ? parsed.records : [] }
  } catch {
    return { records: [] }
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function recordRecommendationPreference(input: {
  memberId: string
  agencyName?: string
  action: RecommendationPreferenceAction
  opportunityId: string
  title?: string
  category?: string
  topicKey?: string
  sourceLabel?: string
  signals?: string[]
}): Promise<RecommendationPreferenceRecord> {
  const record: RecommendationPreferenceRecord = {
    id: `pref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    memberId: input.memberId,
    agencyName: (input.agencyName || "").trim().slice(0, 120),
    action: input.action,
    opportunityId: input.opportunityId.slice(0, 160),
    title: (input.title || "").trim().slice(0, 200),
    category: (input.category || "").trim().slice(0, 80),
    topicKey: (input.topicKey || "").trim().slice(0, 80),
    sourceLabel: (input.sourceLabel || "").trim().slice(0, 80),
    signals: (input.signals || []).map(String).slice(0, 12),
    createdAt: new Date().toISOString(),
  }

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await db`
      INSERT INTO agency_recommendation_preferences (
        id, member_id, agency_name, action, opportunity_id, title, category,
        topic_key, source_label, signals, created_at
      ) VALUES (
        ${record.id},
        ${record.memberId},
        ${record.agencyName || null},
        ${record.action},
        ${record.opportunityId},
        ${record.title || null},
        ${record.category || null},
        ${record.topicKey || null},
        ${record.sourceLabel || null},
        ${JSON.stringify(record.signals)},
        ${record.createdAt}
      )
    `
    return record
  }

  const store = await readFileStore()
  store.records = [record, ...store.records].slice(0, 2000)
  await writeFileStore(store)
  return record
}

export async function getAgencyPreferenceProfile(
  memberId: string
): Promise<AgencyPreferenceProfile> {
  if (!memberId.trim()) return emptyProfile()

  let records: RecommendationPreferenceRecord[] = []

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT id, member_id, agency_name, action, opportunity_id, title, category,
             topic_key, source_label, signals, created_at
      FROM agency_recommendation_preferences
      WHERE member_id = ${memberId}
      ORDER BY created_at DESC
      LIMIT 200
    `
    records = (rows as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      memberId: String(row.member_id),
      agencyName: row.agency_name ? String(row.agency_name) : "",
      action: row.action as RecommendationPreferenceAction,
      opportunityId: String(row.opportunity_id),
      title: row.title ? String(row.title) : "",
      category: row.category ? String(row.category) : "",
      topicKey: row.topic_key ? String(row.topic_key) : "",
      sourceLabel: row.source_label ? String(row.source_label) : "",
      signals: Array.isArray(row.signals)
        ? row.signals.map(String)
        : typeof row.signals === "string"
          ? (JSON.parse(row.signals) as string[])
          : [],
      createdAt: String(row.created_at),
    }))
  } else {
    const store = await readFileStore()
    records = store.records.filter((r) => r.memberId === memberId).slice(0, 200)
  }

  const endorsed = records.filter((r) => r.action === "endorse")
  const declined = records.filter((r) => r.action === "decline")
  const published = records.filter((r) => r.action === "published")

  return {
    endorsedTopicKeys: uniq(endorsed.map((r) => r.topicKey)),
    declinedTopicKeys: uniq(declined.map((r) => r.topicKey)),
    publishedTopicKeys: uniq(published.map((r) => r.topicKey)),
    endorsedCategories: uniq(endorsed.map((r) => r.category)),
    declinedCategories: uniq(declined.map((r) => r.category)),
    recentActions: records.slice(0, 40),
  }
}

export function preferenceBriefForPrompts(profile: AgencyPreferenceProfile): string {
  if (
    !profile.endorsedTopicKeys.length &&
    !profile.declinedTopicKeys.length &&
    !profile.publishedTopicKeys.length
  ) {
    return ""
  }
  return [
    "AGENCY COMMUNICATION PREFERENCES (learned from prior PIO decisions):",
    profile.endorsedTopicKeys.length
      ? `- Topics this agency has endorsed as a strong fit: ${profile.endorsedTopicKeys.slice(0, 12).join(", ")}`
      : "",
    profile.declinedTopicKeys.length
      ? `- Topics this agency declined as not relevant: ${profile.declinedTopicKeys.slice(0, 12).join(", ")}`
      : "",
    profile.publishedTopicKeys.length
      ? `- Topics recently published by this agency (avoid near-duplicates): ${profile.publishedTopicKeys.slice(0, 12).join(", ")}`
      : "",
    "- Prefer endorsed topic families when equally timely; de-prioritize declined families unless facts are newly urgent.",
  ]
    .filter(Boolean)
    .join("\n")
}
