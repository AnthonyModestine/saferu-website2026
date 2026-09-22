/**
 * Remove all stored data for a member when their account is deleted.
 *
 * Stripe billing objects are NOT deleted (invoices/payments retained for finance).
 * Contact form tickets are anonymized (support history kept without PII).
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { setMemberDisabled } from "@/lib/disabled-members"
import { clearMemberSessionsForUser } from "@/lib/member-session"
import { purgeMemberFeedback } from "@/lib/member-feedback-store"
import { purgeGenerationsForEmail } from "@/lib/pio-generations"

const DATA_DIR = path.join(process.cwd(), "data")
const PIO_TRIALS_FILE = path.join(DATA_DIR, "pio-trials.json")
const PASSWORD_RESET_FILE = path.join(DATA_DIR, "password-reset-tokens.json")
const PIO_ANALYTICS_FILE = path.join(DATA_DIR, "pio-analytics.json")
const CONTENT_ANALYTICS_FILE = path.join(DATA_DIR, "content-analytics.json")
const MEMBER_LAST_LOGINS_FILE = path.join(DATA_DIR, "member-last-logins.json")
const AGENCY_SETTINGS_FILE = path.join(DATA_DIR, "agency-settings.json")
const AGENCY_PREFS_FILE = path.join(DATA_DIR, "agency-recommendation-preferences.json")
const GRAPHIC_STUDIO_FILE = path.join(DATA_DIR, "graphic-studio-generations.json")

export async function purgeAllMemberData(params: {
  email: string
  memberId?: string
  /**
   * @deprecated Do not delete Stripe customers on account delete.
   * Kept for admin tooling; default false.
   */
  removeStripe?: boolean
}): Promise<void> {
  const email = params.email.trim().toLowerCase()
  if (!email) return

  const memberId = params.memberId?.trim()

  await Promise.all([
    purgeGenerationsForEmail(email),
    purgeTrial(email),
    purgePasswordResetTokens(email),
    purgeGenerationAnalytics(email, memberId),
    purgeContentAnalytics(email),
    purgeMemberFeedback(email),
    purgeLastLogin(email),
    purgeAgencySettings(memberId),
    purgeRecommendationPreferences(memberId),
    purgeAgencySourceCatalog(email),
    purgeGraphicStudio(email),
    anonymizeContactTickets(email),
    setMemberDisabled(email, false),
    memberId ? clearMemberSessionsForUser(memberId) : Promise.resolve(),
  ])

  // Intentionally NOT calling Stripe customer delete.
  void params.removeStripe
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
    // no file
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
    // no file
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
          if (s.memberEmail?.toLowerCase() === email) return true
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
    // no file
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
    // no file
  }
}

async function purgeLastLogin(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM member_last_logins WHERE email = ${email}`
    return
  }
  try {
    const raw = await readFile(MEMBER_LAST_LOGINS_FILE, "utf-8")
    const store = JSON.parse(raw) as Record<string, number>
    if (!store || typeof store !== "object") return
    delete store[email]
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(MEMBER_LAST_LOGINS_FILE, JSON.stringify(store, null, 2), "utf-8")
  } catch {
    // no file
  }
}

async function purgeAgencySettings(memberId?: string): Promise<void> {
  if (!memberId) return
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM agency_settings_profiles WHERE member_id = ${memberId}`
    return
  }
  try {
    const raw = await readFile(AGENCY_SETTINGS_FILE, "utf-8")
    const store = JSON.parse(raw) as Record<string, unknown>
    if (!store || typeof store !== "object") return
    delete store[memberId]
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(AGENCY_SETTINGS_FILE, JSON.stringify(store, null, 2), "utf-8")
  } catch {
    // no file
  }
}

async function purgeRecommendationPreferences(memberId?: string): Promise<void> {
  if (!memberId) return
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM agency_recommendation_preferences WHERE member_id = ${memberId}`
    return
  }
  try {
    const raw = await readFile(AGENCY_PREFS_FILE, "utf-8")
    const data = JSON.parse(raw) as { records?: { memberId?: string }[] }
    if (!Array.isArray(data.records)) return
    data.records = data.records.filter((r) => r.memberId !== memberId)
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(AGENCY_PREFS_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch {
    // no file
  }
}

async function purgeAgencySourceCatalog(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM agency_source_catalogs WHERE member_email = ${email}`
  }
}

async function purgeGraphicStudio(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM graphic_studio_records WHERE user_email = ${email}`
    return
  }
  try {
    const raw = await readFile(GRAPHIC_STUDIO_FILE, "utf-8")
    const data = JSON.parse(raw) as { records?: { user_id?: string; user_email?: string }[] }
    if (!Array.isArray(data.records)) return
    data.records = data.records.filter(
      (r) =>
        r.user_id?.toLowerCase() !== email && r.user_email?.toLowerCase() !== email
    )
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(GRAPHIC_STUDIO_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch {
    // no file
  }
}

/** Keep ticket rows for ops, strip PII tied to the deleted account email. */
async function anonymizeContactTickets(email: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      UPDATE contact_tickets
      SET
        name = 'Deleted user',
        email = 'deleted@saferu.invalid',
        agency = NULL,
        message = '[Redacted — account deleted]'
      WHERE email = ${email}
    `
    return
  }
  try {
    const file = path.join(DATA_DIR, "tickets.json")
    const raw = await readFile(file, "utf-8")
    const data = JSON.parse(raw) as {
      tickets?: { email?: string; name?: string; agency?: string; message?: string }[]
    }
    if (!Array.isArray(data.tickets)) return
    for (const t of data.tickets) {
      if (t.email?.toLowerCase() === email) {
        t.name = "Deleted user"
        t.email = "deleted@saferu.invalid"
        t.agency = undefined
        t.message = "[Redacted — account deleted]"
      }
    }
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(file, JSON.stringify(data, null, 2), "utf-8")
  } catch {
    // no file
  }
}
