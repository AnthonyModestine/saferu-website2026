/**
 * Remove all stored data for a member when their account is deleted.
 * Credits, trials, sessions, analytics, and related records are keyed by email
 * and must be purged separately from free_members.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { setMemberDisabled } from "@/lib/disabled-members"
import { clearMemberSessionsForUser } from "@/lib/member-session"
import { stripe } from "@/lib/stripe"

const DATA_DIR = path.join(process.cwd(), "data")
const PIO_GENERATIONS_FILE = path.join(DATA_DIR, "pio-generations.json")
const PIO_TRIALS_FILE = path.join(DATA_DIR, "pio-trials.json")
const PASSWORD_RESET_FILE = path.join(DATA_DIR, "password-reset-tokens.json")
const PIO_ANALYTICS_FILE = path.join(DATA_DIR, "pio-analytics.json")
const CONTENT_ANALYTICS_FILE = path.join(DATA_DIR, "content-analytics.json")

export async function purgeAllMemberData(params: {
  email: string
  memberId?: string
  /** Cancel Stripe customer(s) and subscriptions for this email. */
  removeStripe?: boolean
}): Promise<void> {
  const email = params.email.trim().toLowerCase()
  if (!email) return

  const memberId = params.memberId?.trim()

  await Promise.all([
    purgeGenerations(email),
    purgeTrial(email),
    purgePasswordResetTokens(email),
    purgeGenerationAnalytics(email, memberId),
    purgeContentAnalytics(email),
    setMemberDisabled(email, false),
    memberId ? clearMemberSessionsForUser(memberId) : Promise.resolve(),
    params.removeStripe ? purgeStripeByEmail(email) : Promise.resolve(),
  ])
}

async function purgeGenerations(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM pio_generations WHERE email = ${email}`
    return
  }

  try {
    const raw = await readFile(PIO_GENERATIONS_FILE, "utf-8")
    const store = JSON.parse(raw) as Record<string, unknown>
    if (store && typeof store === "object") {
      delete store[email]
      await mkdir(DATA_DIR, { recursive: true })
      await writeFile(PIO_GENERATIONS_FILE, JSON.stringify(store, null, 2), "utf-8")
    }
  } catch {
    // no file yet
  }
}

async function purgeTrial(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM pio_trials WHERE email = ${email}`
    return
  }

  try {
    const raw = await readFile(PIO_TRIALS_FILE, "utf-8")
    const store = JSON.parse(raw) as Record<string, unknown>
    if (store && typeof store === "object") {
      delete store[email]
      await mkdir(DATA_DIR, { recursive: true })
      await writeFile(PIO_TRIALS_FILE, JSON.stringify(store, null, 2), "utf-8")
    }
  } catch {
    // no file yet
  }
}

async function purgePasswordResetTokens(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM password_reset_tokens WHERE email = ${email}`
    return
  }

  try {
    const raw = await readFile(PASSWORD_RESET_FILE, "utf-8")
    const data = JSON.parse(raw) as { tokens?: { email: string }[] }
    if (!Array.isArray(data.tokens)) return
    const tokens = data.tokens.filter((t) => t.email.toLowerCase() !== email)
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(PASSWORD_RESET_FILE, JSON.stringify({ tokens }, null, 2), "utf-8")
  } catch {
    // no file yet
  }
}

async function purgeGenerationAnalytics(email: string, memberId?: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    if (memberId) {
      await getSql()`
        DELETE FROM generation_sessions
        WHERE member_email = ${email} OR agency_id = ${memberId} OR user_id = ${memberId}
      `
    } else {
      await getSql()`DELETE FROM generation_sessions WHERE member_email = ${email}`
    }
    return
  }

  try {
    const raw = await readFile(PIO_ANALYTICS_FILE, "utf-8")
    const data = JSON.parse(raw) as {
      sessions?: { id: string; memberEmail?: string; agencyId?: string; userId?: string }[]
      actions?: { generationSessionId: string }[]
      feedback?: { generationSessionId: string }[]
    }
    const sessions = Array.isArray(data.sessions) ? data.sessions : []
    const removedIds = new Set(
      sessions
        .filter((s) => {
          const sessionEmail = s.memberEmail?.toLowerCase()
          if (sessionEmail === email) return true
          if (memberId && (s.agencyId === memberId || s.userId === memberId)) return true
          return false
        })
        .map((s) => s.id)
    )
    if (removedIds.size === 0) return

    const next = {
      sessions: sessions.filter((s) => !removedIds.has(s.id)),
      actions: (Array.isArray(data.actions) ? data.actions : []).filter(
        (a) => !removedIds.has(a.generationSessionId)
      ),
      feedback: (Array.isArray(data.feedback) ? data.feedback : []).filter(
        (f) => !removedIds.has(f.generationSessionId)
      ),
    }
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(PIO_ANALYTICS_FILE, JSON.stringify(next, null, 2), "utf-8")
  } catch {
    // no file yet
  }
}

async function purgeContentAnalytics(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM content_events WHERE member_email = ${email}`
    return
  }

  try {
    const raw = await readFile(CONTENT_ANALYTICS_FILE, "utf-8")
    const events = JSON.parse(raw) as { memberEmail?: string }[]
    if (!Array.isArray(events)) return
    const next = events.filter((e) => e.memberEmail?.toLowerCase() !== email)
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(CONTENT_ANALYTICS_FILE, JSON.stringify(next, null, 2), "utf-8")
  } catch {
    // no file yet
  }
}

async function purgeStripeByEmail(email: string): Promise<void> {
  if (!stripe) return
  try {
    const customers = await stripe.customers.list({ email, limit: 100 })
    for (const customer of customers.data) {
      await stripe.customers.del(customer.id)
    }
  } catch {
    // Stripe cleanup is best-effort; member data purge still succeeds
  }
}
