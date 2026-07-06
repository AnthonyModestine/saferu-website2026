import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import type { DepartmentType } from "@/lib/department-types"
import { MEMBER_FEEDBACK_DAYS_AFTER_SIGNUP } from "@/lib/member-feedback-constants"
import { getFreeMemberByEmail } from "@/lib/members-store"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import type { MemberFeedbackHelpValue } from "@/lib/member-feedback-constants"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "member-feedback.json")
const SECONDS_PER_DAY = 24 * 60 * 60

export interface MemberFeedback {
  id: string
  memberId: string
  email: string
  memberName?: string
  agency?: string
  departmentType?: DepartmentType
  departmentOther?: string
  helpfulnessRating: number
  helpedWith?: MemberFeedbackHelpValue[]
  helpedWithOther?: string
  testimonial?: string
  improvementFeedback?: string
  createdAt: number
}

interface Store {
  feedback: MemberFeedback[]
}

interface FeedbackRow {
  id: string
  member_id: string
  email: string
  member_name: string | null
  agency: string | null
  department_type: string | null
  department_other: string | null
  helpfulness_rating: number
  helped_with: unknown
  helped_with_other: string | null
  testimonial: string | null
  improvement_feedback: string | null
  created_at: string | number
}

function rowToFeedback(row: FeedbackRow): MemberFeedback {
  const helpedWith = Array.isArray(row.helped_with)
    ? (row.helped_with as MemberFeedbackHelpValue[])
    : undefined
  return {
    id: row.id,
    memberId: row.member_id,
    email: row.email,
    memberName: row.member_name ?? undefined,
    agency: row.agency ?? undefined,
    departmentType: row.department_type
      ? (row.department_type as DepartmentType)
      : undefined,
    departmentOther: row.department_other ?? undefined,
    helpfulnessRating: Number(row.helpfulness_rating),
    helpedWith,
    helpedWithOther: row.helped_with_other ?? undefined,
    testimonial: row.testimonial ?? undefined,
    improvementFeedback: row.improvement_feedback ?? undefined,
    createdAt: Number(row.created_at),
  }
}

async function ensureFile(): Promise<Store> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as Store
    return Array.isArray(data.feedback) ? data : { feedback: [] }
  } catch {
    return { feedback: [] }
  }
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function hasMemberSubmittedFeedback(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return false

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT id FROM member_feedback WHERE email = ${normalized} LIMIT 1
    `
    return rows.length > 0
  }

  const store = await ensureFile()
  return store.feedback.some((f) => f.email.toLowerCase() === normalized)
}

export async function getMemberFeedbackEligibility(params: {
  email: string
}): Promise<{ shouldShow: boolean; daysSinceSignup: number | null }> {
  const email = params.email.trim().toLowerCase()
  const [freeMember, stripePaid, trialActive, submitted] = await Promise.all([
    getFreeMemberByEmail(email),
    getIsPaidByEmail(email),
    isOnActiveTrial(email),
    hasMemberSubmittedFeedback(email),
  ])

  if (!freeMember || stripePaid || trialActive || submitted) {
    const now = Math.floor(Date.now() / 1000)
    const daysSinceSignup = freeMember
      ? Math.floor((now - freeMember.createdAt) / SECONDS_PER_DAY)
      : null
    return { shouldShow: false, daysSinceSignup }
  }

  const now = Math.floor(Date.now() / 1000)
  const daysSinceSignup = Math.floor((now - freeMember.createdAt) / SECONDS_PER_DAY)

  return {
    shouldShow: daysSinceSignup >= MEMBER_FEEDBACK_DAYS_AFTER_SIGNUP,
    daysSinceSignup,
  }
}

export async function addMemberFeedback(params: {
  memberId: string
  email: string
  memberName?: string
  agency?: string
  departmentType?: DepartmentType
  departmentOther?: string
  helpfulnessRating: number
  helpedWith?: MemberFeedbackHelpValue[]
  helpedWithOther?: string
  testimonial?: string
  improvementFeedback?: string
}): Promise<{ id: string } | { error: string }> {
  const email = params.email.trim().toLowerCase()
  if (!email) return { error: "Email is required" }

  if (await hasMemberSubmittedFeedback(email)) {
    return { error: "Feedback already submitted" }
  }

  const id = crypto.randomUUID()
  const createdAt = Math.floor(Date.now() / 1000)
  const entry: MemberFeedback = {
    id,
    memberId: params.memberId,
    email,
    memberName: params.memberName?.trim() || undefined,
    agency: params.agency?.trim() || undefined,
    departmentType: params.departmentType,
    departmentOther: params.departmentOther?.trim() || undefined,
    helpfulnessRating: params.helpfulnessRating,
    helpedWith: params.helpedWith,
    helpedWithOther: params.helpedWithOther?.trim() || undefined,
    testimonial: params.testimonial?.trim() || undefined,
    improvementFeedback: params.improvementFeedback?.trim() || undefined,
    createdAt,
  }

  if (isDatabaseConfigured()) {
    try {
      await ensureSchema()
      await getSql()`
        INSERT INTO member_feedback (
          id, member_id, email, member_name, agency, department_type, department_other,
          helpfulness_rating, helped_with, helped_with_other, testimonial, improvement_feedback,
          created_at
        )
        VALUES (
          ${entry.id}, ${entry.memberId}, ${entry.email}, ${entry.memberName ?? null},
          ${entry.agency ?? null}, ${entry.departmentType ?? null}, ${entry.departmentOther ?? null},
          ${entry.helpfulnessRating}, ${JSON.stringify(entry.helpedWith ?? [])},
          ${entry.helpedWithOther ?? null}, ${entry.testimonial ?? null},
          ${entry.improvementFeedback ?? null}, ${entry.createdAt}
        )
      `
      return { id }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes("unique") || message.includes("duplicate")) {
        return { error: "Feedback already submitted" }
      }
      throw err
    }
  }

  const store = await ensureFile()
  if (store.feedback.some((f) => f.email.toLowerCase() === email)) {
    return { error: "Feedback already submitted" }
  }
  store.feedback.push(entry)
  await writeStore(store)
  return { id }
}

export async function getMemberFeedbackList(): Promise<MemberFeedback[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT * FROM member_feedback ORDER BY created_at DESC
    `
    return (rows as FeedbackRow[]).map(rowToFeedback)
  }

  const store = await ensureFile()
  return [...store.feedback].sort((a, b) => b.createdAt - a.createdAt)
}

export async function deleteMemberFeedback(id: string): Promise<boolean> {
  if (!id?.trim()) return false

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      DELETE FROM member_feedback WHERE id = ${id} RETURNING id
    `
    return rows.length > 0
  }

  const store = await ensureFile()
  const before = store.feedback.length
  store.feedback = store.feedback.filter((f) => f.id !== id)
  if (store.feedback.length === before) return false
  await writeStore(store)
  return true
}

export async function purgeMemberFeedback(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM member_feedback WHERE email = ${normalized}`
    return
  }

  const store = await ensureFile()
  store.feedback = store.feedback.filter((f) => f.email.toLowerCase() !== normalized)
  await writeStore(store)
}
