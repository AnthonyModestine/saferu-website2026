/**
 * Press Center generation analytics — sessions, actions, feedback.
 * Postgres when configured; otherwise data/pio-analytics.json.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { formatDepartmentLabel } from "@/lib/department-types"
import { getFreeMembers } from "@/lib/members-store"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "pio-analytics.json")

export type GenerationType = "new_press_release" | "video_request"
export type InvestigationStatus = "ongoing" | "resolved"
export type MemberPlan = "paid" | "free" | "trial"
export type AgencyType =
  | "police"
  | "fire"
  | "ems"
  | "emergency_management"
  | "municipality"
  | "other"

export type GenerationActionType =
  | "press_release_copied"
  | "press_release_downloaded"
  | "facebook_copied"
  | "spanish_generated"
  | "spanish_copied"
  | "x_copied"
  | "talking_points_downloaded"
  | "video_request_copied"
  | "video_request_downloaded"

export type FeedbackRating = "positive" | "negative"
export type FeedbackReason =
  | "missing_information"
  | "too_long"
  | "too_short"
  | "wrong_tone"
  | "formatting_issue"
  | "other"

export interface GenerationSession {
  id: string
  agencyId: string
  userId: string
  memberEmail: string
  agencyName?: string
  agencyType?: string
  departmentOther?: string
  memberPlan: MemberPlan
  generationType: GenerationType
  incidentType?: string
  investigationStatus?: InvestigationStatus
  createdAt: number
}

export interface GenerationAction {
  id: string
  generationSessionId: string
  actionType: GenerationActionType
  createdAt: number
}

export interface GenerationFeedback {
  id: string
  generationSessionId: string
  rating: FeedbackRating
  reason?: FeedbackReason
  comment?: string
  createdAt: number
}

interface AnalyticsStore {
  sessions: GenerationSession[]
  actions: GenerationAction[]
  feedback: GenerationFeedback[]
}

export type DatePreset = "7d" | "30d" | "90d" | "year" | "custom"

export interface DateRange {
  startMs: number
  endMs: number
  preset: DatePreset
}

export interface PressCenterDashboard {
  range: DateRange
  summary: {
    totalAgencies: number
    activeAgencies: number
    newSignups: number
    newPressReleaseSessions: number
    videoRequestSessions: number
    totalSessions: number
    pressReleaseDownloads: number
    talkingPointDownloads: number
    spanishTranslationsGenerated: number
    totalCopyActions: number
    paidAgencies: number
    freeAgencies: number
  }
  usageOverTime: {
    period: string
    newPressReleaseSessions: number
    videoRequestSessions: number
  }[]
  incidentTypes: { type: string; count: number }[]
  departmentSignups: { type: string; count: number }[]
  signupsOverTime: { period: string; count: number }[]
  agencyTypeBreakdown: {
    type: string
    signups: number
    agencies: number
    activeAgencies: number
    totalSessions: number
    downloads: number
    copies: number
    positiveFeedback: number
    negativeFeedback: number
  }[]
  planBreakdown: { plan: string; count: number }[]
  feedbackByReason: { reason: string; count: number }[]
  agencyActivity: {
    agencyName: string
    agencyType: string
    plan: string
    lastActive: number
    newPressReleaseSessions: number
    videoRequestSessions: number
    totalSessions: number
    downloads: number
    copies: number
    spanishTranslations: number
    feedbackScore: number | null
  }[]
  assetUtilization: {
    pressReleaseSessions: number
    pressReleaseCopies: number
    pressReleaseDownloads: number
    facebookCopies: number
    spanishGenerated: number
    spanishCopies: number
    xCopies: number
    talkingPointDownloads: number
    videoRequestSessions: number
    videoRequestCopies: number
    videoRequestDownloads: number
  }
  feedback: {
    positiveCount: number
    negativeCount: number
    positivePercent: number
    mostCommonComplaint: string | null
    recent: {
      id: string
      rating: FeedbackRating
      reason: string | null
      comment: string | null
      agencyName: string
      generationType: GenerationType
      createdAt: number
    }[]
  }
}

const COPY_ACTIONS: GenerationActionType[] = [
  "press_release_copied",
  "facebook_copied",
  "spanish_copied",
  "x_copied",
  "video_request_copied",
]

const DOWNLOAD_ACTIONS: GenerationActionType[] = [
  "press_release_downloaded",
  "talking_points_downloaded",
  "video_request_downloaded",
]

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

async function readStore(): Promise<AnalyticsStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const data = JSON.parse(raw) as AnalyticsStore
    return {
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
      actions: Array.isArray(data.actions) ? data.actions : [],
      feedback: Array.isArray(data.feedback) ? data.feedback : [],
    }
  } catch {
    return { sessions: [], actions: [], feedback: [] }
  }
}

async function writeStore(store: AnalyticsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

function rowToSession(row: Record<string, unknown>): GenerationSession {
  return {
    id: String(row.id),
    agencyId: String(row.agency_id),
    userId: String(row.user_id),
    memberEmail: String(row.member_email),
    agencyName: row.agency_name ? String(row.agency_name) : undefined,
    agencyType: row.agency_type ? String(row.agency_type) : undefined,
    departmentOther: row.department_other ? String(row.department_other) : undefined,
    memberPlan: (String(row.member_plan || "free") as MemberPlan),
    generationType: String(row.generation_type) as GenerationType,
    incidentType: row.incident_type ? String(row.incident_type) : undefined,
    investigationStatus: row.investigation_status
      ? (String(row.investigation_status) as InvestigationStatus)
      : undefined,
    createdAt: Number(row.created_at),
  }
}

export function parseDateRange(
  preset: string,
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = Date.now()
  const endMs = customEnd ? endOfDay(new Date(customEnd).getTime()) : now
  let startMs: number
  let resolved: DatePreset = "30d"

  switch (preset) {
    case "7d":
      startMs = now - 7 * 24 * 60 * 60 * 1000
      resolved = "7d"
      break
    case "90d":
      startMs = now - 90 * 24 * 60 * 60 * 1000
      resolved = "90d"
      break
    case "year": {
      const y = new Date()
      y.setMonth(0, 1)
      y.setHours(0, 0, 0, 0)
      startMs = y.getTime()
      resolved = "year"
      break
    }
    case "custom":
      startMs = customStart
        ? startOfDay(new Date(customStart).getTime())
        : now - 30 * 24 * 60 * 60 * 1000
      resolved = "custom"
      break
    case "30d":
    default:
      startMs = now - 30 * 24 * 60 * 60 * 1000
      resolved = "30d"
      break
  }

  return { startMs, endMs, preset: resolved }
}

function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function endOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

function toDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function toWeekKey(ms: number): string {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

function toMonthKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 7)
}

export async function createGenerationSession(params: {
  agencyId: string
  userId: string
  memberEmail: string
  agencyName?: string
  agencyType?: string
  departmentOther?: string
  memberPlan: MemberPlan
  generationType: GenerationType
  incidentType?: string
  investigationStatus?: InvestigationStatus
}): Promise<string> {
  const id = newId()
  const createdAt = Date.now()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await db`
      INSERT INTO generation_sessions (
        id, agency_id, user_id, member_email, agency_name, agency_type, department_other,
        member_plan, generation_type, incident_type, investigation_status, created_at
      ) VALUES (
        ${id},
        ${params.agencyId},
        ${params.userId},
        ${params.memberEmail.toLowerCase()},
        ${params.agencyName ?? null},
        ${params.agencyType ?? null},
        ${params.departmentOther ?? null},
        ${params.memberPlan},
        ${params.generationType},
        ${params.incidentType ?? null},
        ${params.investigationStatus ?? null},
        ${createdAt}
      )
    `
    return id
  }

  const store = await readStore()
  store.sessions.push({
    id,
    agencyId: params.agencyId,
    userId: params.userId,
    memberEmail: params.memberEmail.toLowerCase(),
    agencyName: params.agencyName,
    agencyType: params.agencyType,
    departmentOther: params.departmentOther,
    memberPlan: params.memberPlan,
    generationType: params.generationType,
    incidentType: params.incidentType,
    investigationStatus: params.investigationStatus,
    createdAt,
  })
  await writeStore(store)
  return id
}

export async function generationSessionBelongsToMember(
  sessionId: string,
  memberId: string,
  memberEmail: string
): Promise<boolean> {
  const email = memberEmail.toLowerCase()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT id FROM generation_sessions
      WHERE id = ${sessionId}
        AND agency_id = ${memberId}
        AND member_email = ${email}
      LIMIT 1
    `
    return rows.length > 0
  }

  const store = await readStore()
  return store.sessions.some(
    (s) => s.id === sessionId && s.agencyId === memberId && s.memberEmail === email
  )
}

export async function recordGenerationAction(
  generationSessionId: string,
  actionType: GenerationActionType
): Promise<void> {
  const id = newId()
  const createdAt = Date.now()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await db`
      INSERT INTO generation_actions (id, generation_session_id, action_type, created_at)
      VALUES (${id}, ${generationSessionId}, ${actionType}, ${createdAt})
    `
    return
  }

  const store = await readStore()
  store.actions.push({ id, generationSessionId, actionType, createdAt })
  await writeStore(store)
}

export async function recordGenerationFeedback(params: {
  generationSessionId: string
  rating: FeedbackRating
  reason?: FeedbackReason
  comment?: string
}): Promise<void> {
  const id = newId()
  const createdAt = Date.now()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await db`
      INSERT INTO generation_feedback (id, generation_session_id, rating, reason, comment, created_at)
      VALUES (
        ${id},
        ${params.generationSessionId},
        ${params.rating},
        ${params.reason ?? null},
        ${params.comment?.trim().slice(0, 500) ?? null},
        ${createdAt}
      )
    `
    return
  }

  const store = await readStore()
  store.feedback.push({
    id,
    generationSessionId: params.generationSessionId,
    rating: params.rating,
    reason: params.reason,
    comment: params.comment?.trim().slice(0, 500),
    createdAt,
  })
  await writeStore(store)
}

async function loadSessionsInRange(range: DateRange): Promise<GenerationSession[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT * FROM generation_sessions
      WHERE created_at >= ${range.startMs} AND created_at <= ${range.endMs}
      ORDER BY created_at DESC
    `
    return rows.map((r) => rowToSession(r as Record<string, unknown>))
  }

  const store = await readStore()
  return store.sessions.filter(
    (s) => s.createdAt >= range.startMs && s.createdAt <= range.endMs
  )
}

async function loadAllSessions(): Promise<GenerationSession[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`SELECT * FROM generation_sessions ORDER BY created_at DESC`
    return rows.map((r) => rowToSession(r as Record<string, unknown>))
  }
  const store = await readStore()
  return store.sessions
}

async function loadActionsInRange(range: DateRange): Promise<GenerationAction[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT * FROM generation_actions
      WHERE created_at >= ${range.startMs} AND created_at <= ${range.endMs}
    `
    return rows.map((r) => ({
      id: String(r.id),
      generationSessionId: String(r.generation_session_id),
      actionType: String(r.action_type) as GenerationActionType,
      createdAt: Number(r.created_at),
    }))
  }

  const store = await readStore()
  return store.actions.filter(
    (a) => a.createdAt >= range.startMs && a.createdAt <= range.endMs
  )
}

async function loadFeedbackInRange(range: DateRange): Promise<GenerationFeedback[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    const rows = await db`
      SELECT * FROM generation_feedback
      WHERE created_at >= ${range.startMs} AND created_at <= ${range.endMs}
    `
    return rows.map((r) => ({
      id: String(r.id),
      generationSessionId: String(r.generation_session_id),
      rating: String(r.rating) as FeedbackRating,
      reason: r.reason ? (String(r.reason) as FeedbackReason) : undefined,
      comment: r.comment ? String(r.comment) : undefined,
      createdAt: Number(r.created_at),
    }))
  }

  const store = await readStore()
  return store.feedback.filter(
    (f) => f.createdAt >= range.startMs && f.createdAt <= range.endMs
  )
}

function formatAgencyType(type?: string, other?: string): string {
  return formatDepartmentLabel(type, other)
}

function formatPlan(plan: MemberPlan): string {
  if (plan === "paid") return "Paid"
  if (plan === "trial") return "Trial"
  return "Free"
}

function emptyTypeBreakdown() {
  return {
    signups: 0,
    agencies: 0,
    activeAgencies: 0,
    totalSessions: 0,
    downloads: 0,
    copies: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
  }
}

function formatIncidentLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const REASON_LABELS: Record<FeedbackReason, string> = {
  missing_information: "Missing Information",
  too_long: "Too Long",
  too_short: "Too Short",
  wrong_tone: "Wrong Tone",
  formatting_issue: "Formatting Issue",
  other: "Other",
}

export async function getPressCenterDashboard(
  range: DateRange,
  groupBy: "day" | "week" | "month" = "day"
): Promise<PressCenterDashboard> {
  const sessionsInRange = await loadSessionsInRange(range)
  const allSessions = await loadAllSessions()
  const registeredMembers = await getFreeMembers()
  const sessionById = new Map(sessionsInRange.map((s) => [s.id, s]))
  const actions = await loadActionsInRange(range)
  const feedback = await loadFeedbackInRange(range)

  const pressSessions = sessionsInRange.filter((s) => s.generationType === "new_press_release")
  const videoSessions = sessionsInRange.filter((s) => s.generationType === "video_request")

  const actionCounts = (type: GenerationActionType) =>
    actions.filter((a) => a.actionType === type).length

  const totalCopyActions = actions.filter((a) => COPY_ACTIONS.includes(a.actionType)).length

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const activeAgencyIds = new Set(
    allSessions.filter((s) => s.createdAt >= thirtyDaysAgo).map((s) => s.agencyId)
  )
  const sessionAgencyIds = new Set(allSessions.map((s) => s.agencyId))
  const registeredAgencyIds = new Set(registeredMembers.map((m) => m.id))

  const sessionPlanByAgency = new Map<string, MemberPlan>()
  for (const s of allSessions) {
    const cur = sessionPlanByAgency.get(s.agencyId)
    if (!cur || s.memberPlan === "paid" || (s.memberPlan === "trial" && cur === "free")) {
      sessionPlanByAgency.set(s.agencyId, s.memberPlan)
    }
  }

  let paidAgencies = 0
  let freeAgencies = 0
  for (const id of registeredAgencyIds) {
    const plan = sessionPlanByAgency.get(id) ?? "free"
    if (plan === "paid" || plan === "trial") paidAgencies += 1
    else freeAgencies += 1
  }

  const membersInRange = registeredMembers.filter(
    (m) => m.createdAt * 1000 >= range.startMs && m.createdAt * 1000 <= range.endMs
  )
  const membersInRangeIds = new Set(membersInRange.map((m) => m.id))
  const departmentSignupMap = new Map<string, number>()
  for (const m of membersInRange) {
    const label = formatDepartmentLabel(m.departmentType, m.departmentOther)
    departmentSignupMap.set(label, (departmentSignupMap.get(label) ?? 0) + 1)
  }
  const departmentSignups = Array.from(departmentSignupMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const incidentMap = new Map<string, number>()
  for (const s of sessionsInRange) {
    if (!s.incidentType) continue
    incidentMap.set(s.incidentType, (incidentMap.get(s.incidentType) ?? 0) + 1)
  }
  const incidentTypes = Array.from(incidentMap.entries())
    .map(([type, count]) => ({ type: formatIncidentLabel(type), count }))
    .sort((a, b) => b.count - a.count)

  const periodFn =
    groupBy === "week" ? toWeekKey : groupBy === "month" ? toMonthKey : toDayKey

  const signupsMap = new Map<string, number>()
  for (const m of membersInRange) {
    const key = periodFn(m.createdAt * 1000)
    signupsMap.set(key, (signupsMap.get(key) ?? 0) + 1)
  }
  const signupsOverTime = Array.from(signupsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, count]) => ({ period, count }))

  const usageMap = new Map<string, { pr: number; vr: number }>()
  for (const s of sessionsInRange) {
    const key = periodFn(s.createdAt)
    const cur = usageMap.get(key) ?? { pr: 0, vr: 0 }
    if (s.generationType === "new_press_release") cur.pr += 1
    else cur.vr += 1
    usageMap.set(key, cur)
  }
  const usageOverTime = Array.from(usageMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      newPressReleaseSessions: v.pr,
      videoRequestSessions: v.vr,
    }))

  const agencyMap = new Map<
    string,
    {
      agencyId: string
      agencyName: string
      agencyType: string
      plan: MemberPlan
      lastActive: number
      pr: number
      vr: number
      downloads: number
      copies: number
      spanish: number
      positive: number
      negative: number
    }
  >()

  for (const m of membersInRange) {
    const key = m.id
    const createdMs = m.createdAt * 1000
    const plan = sessionPlanByAgency.get(key) ?? "free"
    agencyMap.set(key, {
      agencyId: key,
      agencyName: m.agency || m.name || m.email,
      agencyType: formatDepartmentLabel(m.departmentType, m.departmentOther),
      plan,
      lastActive: createdMs,
      pr: 0,
      vr: 0,
      downloads: 0,
      copies: 0,
      spanish: 0,
      positive: 0,
      negative: 0,
    })
  }

  for (const s of sessionsInRange) {
    const key = s.agencyId
    const cur = agencyMap.get(key) ?? {
      agencyId: key,
      agencyName: s.agencyName || s.memberEmail,
      agencyType: formatAgencyType(s.agencyType, s.departmentOther),
      plan: s.memberPlan,
      lastActive: s.createdAt,
      pr: 0,
      vr: 0,
      downloads: 0,
      copies: 0,
      spanish: 0,
      positive: 0,
      negative: 0,
    }
    if (s.createdAt > cur.lastActive) cur.lastActive = s.createdAt
    if (s.agencyName) cur.agencyName = s.agencyName
    if (s.agencyType) cur.agencyType = formatAgencyType(s.agencyType, s.departmentOther)
    if (s.memberPlan === "paid" || (s.memberPlan === "trial" && cur.plan === "free")) {
      cur.plan = s.memberPlan
    }
    if (s.generationType === "new_press_release") cur.pr += 1
    else cur.vr += 1
    agencyMap.set(key, cur)
  }

  for (const a of actions) {
    const session = sessionById.get(a.generationSessionId)
    if (!session) continue
    const cur = agencyMap.get(session.agencyId)
    if (!cur) continue
    if (DOWNLOAD_ACTIONS.includes(a.actionType)) cur.downloads += 1
    if (COPY_ACTIONS.includes(a.actionType)) cur.copies += 1
    if (a.actionType === "spanish_generated" || a.actionType === "spanish_copied") {
      cur.spanish += 1
    }
  }

  for (const f of feedback) {
    const session = sessionById.get(f.generationSessionId)
    if (!session) continue
    const cur = agencyMap.get(session.agencyId)
    if (!cur) continue
    if (f.rating === "positive") cur.positive += 1
    else cur.negative += 1
  }

  const agencyActivity = Array.from(agencyMap.values())
    .filter((a) => {
      const hasUsage =
        a.pr + a.vr + a.downloads + a.copies + a.spanish + a.positive + a.negative > 0
      return hasUsage || membersInRangeIds.has(a.agencyId)
    })
    .map((a) => ({
      agencyName: a.agencyName,
      agencyType: a.agencyType,
      plan: formatPlan(a.plan),
      lastActive: a.lastActive,
      newPressReleaseSessions: a.pr,
      videoRequestSessions: a.vr,
      totalSessions: a.pr + a.vr,
      downloads: a.downloads,
      copies: a.copies,
      spanishTranslations: a.spanish,
      feedbackScore:
        a.positive + a.negative > 0
          ? Math.round((a.positive / (a.positive + a.negative)) * 100)
          : null,
    }))
    .sort((a, b) => b.lastActive - a.lastActive)

  const typeBreakdownMap = new Map<
    string,
    {
      signups: number
      agencies: number
      activeAgencies: number
      totalSessions: number
      downloads: number
      copies: number
      positiveFeedback: number
      negativeFeedback: number
    }
  >()

  for (const { type, count } of departmentSignups) {
    const cur = typeBreakdownMap.get(type) ?? emptyTypeBreakdown()
    cur.signups = count
    typeBreakdownMap.set(type, cur)
  }

  for (const m of registeredMembers) {
    const label = formatDepartmentLabel(m.departmentType, m.departmentOther)
    const cur = typeBreakdownMap.get(label) ?? emptyTypeBreakdown()
    cur.agencies += 1
    typeBreakdownMap.set(label, cur)
  }

  const activeIdsByType = new Map<string, Set<string>>()
  for (const s of sessionsInRange) {
    const typeLabel = formatAgencyType(s.agencyType, s.departmentOther)
    const cur = typeBreakdownMap.get(typeLabel) ?? emptyTypeBreakdown()
    cur.totalSessions += 1
    typeBreakdownMap.set(typeLabel, cur)
    const ids = activeIdsByType.get(typeLabel) ?? new Set<string>()
    ids.add(s.agencyId)
    activeIdsByType.set(typeLabel, ids)
  }

  for (const a of actions) {
    const session = sessionById.get(a.generationSessionId)
    if (!session) continue
    const typeLabel = formatAgencyType(session.agencyType, session.departmentOther)
    const cur = typeBreakdownMap.get(typeLabel) ?? emptyTypeBreakdown()
    if (DOWNLOAD_ACTIONS.includes(a.actionType)) cur.downloads += 1
    if (COPY_ACTIONS.includes(a.actionType)) cur.copies += 1
    typeBreakdownMap.set(typeLabel, cur)
  }

  for (const [typeLabel, ids] of activeIdsByType) {
    const cur = typeBreakdownMap.get(typeLabel) ?? emptyTypeBreakdown()
    cur.activeAgencies = ids.size
    typeBreakdownMap.set(typeLabel, cur)
  }

  for (const f of feedback) {
    const session = sessionById.get(f.generationSessionId)
    if (!session) continue
    const typeLabel = formatAgencyType(session.agencyType, session.departmentOther)
    const cur = typeBreakdownMap.get(typeLabel) ?? emptyTypeBreakdown()
    if (f.rating === "positive") cur.positiveFeedback += 1
    else cur.negativeFeedback += 1
    typeBreakdownMap.set(typeLabel, cur)
  }

  const agencyTypeBreakdown = Array.from(typeBreakdownMap.entries())
    .map(([type, stats]) => ({ type, ...stats }))
    .sort((a, b) => b.totalSessions + b.signups - (a.totalSessions + a.signups))

  const planBreakdown = [
    { plan: "Paid", count: paidAgencies },
    { plan: "Free", count: freeAgencies },
  ]

  const assetUtilization = {
    pressReleaseSessions: pressSessions.length,
    pressReleaseCopies: actionCounts("press_release_copied"),
    pressReleaseDownloads: actionCounts("press_release_downloaded"),
    facebookCopies: actionCounts("facebook_copied"),
    spanishGenerated: actionCounts("spanish_generated"),
    spanishCopies: actionCounts("spanish_copied"),
    xCopies: actionCounts("x_copied"),
    talkingPointDownloads: actionCounts("talking_points_downloaded"),
    videoRequestSessions: videoSessions.length,
    videoRequestCopies: actionCounts("video_request_copied"),
    videoRequestDownloads: actionCounts("video_request_downloaded"),
  }

  const positiveCount = feedback.filter((f) => f.rating === "positive").length
  const negativeCount = feedback.filter((f) => f.rating === "negative").length
  const totalFb = positiveCount + negativeCount

  const complaintMap = new Map<string, number>()
  for (const f of feedback) {
    if (f.rating === "negative" && f.reason) {
      const label = REASON_LABELS[f.reason] ?? f.reason
      complaintMap.set(label, (complaintMap.get(label) ?? 0) + 1)
    }
  }
  const mostCommonComplaint =
    complaintMap.size > 0
      ? Array.from(complaintMap.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null

  const feedbackByReason = Array.from(complaintMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  const recentFeedback = feedback
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20)
    .map((f) => {
      const session = sessionById.get(f.generationSessionId)
      return {
        id: f.id,
        rating: f.rating,
        reason: f.reason ? REASON_LABELS[f.reason] : null,
        comment: f.comment ?? null,
        agencyName: session?.agencyName || session?.memberEmail || "Unknown",
        generationType: session?.generationType ?? "new_press_release",
        createdAt: f.createdAt,
      }
    })

  return {
    range,
    summary: {
      totalAgencies: registeredAgencyIds.size || sessionAgencyIds.size,
      activeAgencies: activeAgencyIds.size,
      newSignups: membersInRange.length,
      newPressReleaseSessions: pressSessions.length,
      videoRequestSessions: videoSessions.length,
      totalSessions: sessionsInRange.length,
      pressReleaseDownloads: actionCounts("press_release_downloaded"),
      talkingPointDownloads: actionCounts("talking_points_downloaded"),
      spanishTranslationsGenerated: actionCounts("spanish_generated"),
      totalCopyActions,
      paidAgencies,
      freeAgencies,
    },
    usageOverTime,
    incidentTypes,
    departmentSignups,
    signupsOverTime,
    agencyTypeBreakdown,
    planBreakdown,
    feedbackByReason,
    agencyActivity,
    assetUtilization,
    feedback: {
      positiveCount,
      negativeCount,
      positivePercent: totalFb > 0 ? Math.round((positiveCount / totalFb) * 100) : 0,
      mostCommonComplaint,
      recent: recentFeedback,
    },
  }
}

export async function resolveMemberPlan(
  email: string,
  stripePaid: boolean,
  trialActive: boolean
): Promise<MemberPlan> {
  if (stripePaid) return "paid"
  if (trialActive) return "trial"
  return "free"
}
