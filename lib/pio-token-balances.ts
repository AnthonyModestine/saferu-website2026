/**
 * Atomic AI token balances (Neon) with file fallback for local dev.
 *
 * Concurrency model:
 * - reserveTokens() atomically deducts an estimate BEFORE the AI call
 * - releaseTokens() refunds on failed generation
 * - settleReservation() adjusts for actual usage after success
 *
 * Two concurrent requests with balance for only one generation:
 * only one reserveTokens() UPDATE succeeds; the other gets false.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { MONTHLY_TOKEN_QUOTA } from "@/lib/pio-generations-constants"

const DATA_DIR = path.join(process.cwd(), "data")
const BALANCE_FILE = path.join(DATA_DIR, "pio-token-balances.json")
const LEGACY_FILE = path.join(DATA_DIR, "pio-generations.json")

export type TokenBalance = {
  monthKey: string
  monthlyUsed: number
  packs: number
}

type FileStore = Record<string, TokenBalance>

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function normalizeBalance(raw: TokenBalance | null | undefined): TokenBalance {
  const month = currentMonthKey()
  if (!raw) return { monthKey: month, monthlyUsed: 0, packs: 0 }
  if (raw.monthKey !== month) {
    return { monthKey: month, monthlyUsed: 0, packs: Math.max(0, raw.packs || 0) }
  }
  return {
    monthKey: month,
    monthlyUsed: Math.max(0, Math.floor(raw.monthlyUsed || 0)),
    packs: Math.max(0, Math.floor(raw.packs || 0)),
  }
}

function remainingOf(b: TokenBalance): number {
  return Math.max(0, MONTHLY_TOKEN_QUOTA - b.monthlyUsed) + b.packs
}

function applyDebit(b: TokenBalance, amount: number): TokenBalance | null {
  const tokens = Math.max(0, Math.floor(amount))
  if (tokens <= 0) return b
  if (remainingOf(b) < tokens) return null
  let left = tokens
  let monthlyUsed = b.monthlyUsed
  let packs = b.packs
  const monthlyRem = Math.max(0, MONTHLY_TOKEN_QUOTA - monthlyUsed)
  if (monthlyRem > 0) {
    const fromMonthly = Math.min(monthlyRem, left)
    monthlyUsed += fromMonthly
    left -= fromMonthly
  }
  if (left > 0) packs -= left
  return { monthKey: b.monthKey, monthlyUsed, packs }
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(BALANCE_FILE, "utf-8")
    const data = JSON.parse(raw) as FileStore
    return data && typeof data === "object" ? data : {}
  } catch {
    return {}
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(BALANCE_FILE, JSON.stringify(store, null, 2), "utf-8")
}

/** Migrate legacy pio_generations JSONB / file into structured balances once. */
async function migrateLegacyIfNeeded(email: string): Promise<TokenBalance | null> {
  const key = email.trim().toLowerCase()
  if (!key) return null

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const existing = await getSql()`SELECT email FROM pio_token_balances WHERE email = ${key} LIMIT 1`
    if ((existing as unknown[]).length > 0) return null

    const rows = await getSql()`SELECT data FROM pio_generations WHERE email = ${key} LIMIT 1`
    if ((rows as unknown[]).length === 0) return null
    const data = (rows as { data: unknown }[])[0].data
    let parsed: Record<string, unknown> = {}
    if (typeof data === "string") {
      try {
        parsed = JSON.parse(data) as Record<string, unknown>
      } catch {
        parsed = {}
      }
    } else if (data && typeof data === "object") {
      parsed = data as Record<string, unknown>
    }
    const month = currentMonthKey()
    const used = typeof parsed[month] === "number" ? Number(parsed[month]) : 0
    const packs = typeof parsed.packs === "number" ? Number(parsed.packs) : 0
    const now = Math.floor(Date.now() / 1000)
    await getSql()`
      INSERT INTO pio_token_balances (email, month_key, monthly_used, packs, updated_at)
      VALUES (${key}, ${month}, ${used}, ${packs}, ${now})
      ON CONFLICT (email) DO NOTHING
    `
    return normalizeBalance({ monthKey: month, monthlyUsed: used, packs })
  }

  // File: try legacy generations file
  try {
    const raw = await readFile(LEGACY_FILE, "utf-8")
    const legacy = JSON.parse(raw) as Record<string, Record<string, unknown>>
    const rec = legacy[key]
    if (!rec) return null
    const month = currentMonthKey()
    const used = typeof rec[month] === "number" ? Number(rec[month]) : 0
    const packs = typeof rec.packs === "number" ? Number(rec.packs) : 0
    return normalizeBalance({ monthKey: month, monthlyUsed: used, packs })
  } catch {
    return null
  }
}

async function getBalance(email: string): Promise<TokenBalance> {
  const key = email.trim().toLowerCase()
  const month = currentMonthKey()
  const now = Math.floor(Date.now() / 1000)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await migrateLegacyIfNeeded(key)
    const rows = await getSql()`
      SELECT month_key, monthly_used, packs
      FROM pio_token_balances
      WHERE email = ${key}
      LIMIT 1
    `
    if ((rows as unknown[]).length === 0) {
      await getSql()`
        INSERT INTO pio_token_balances (email, month_key, monthly_used, packs, updated_at)
        VALUES (${key}, ${month}, 0, 0, ${now})
        ON CONFLICT (email) DO NOTHING
      `
      return { monthKey: month, monthlyUsed: 0, packs: 0 }
    }
    const row = (rows as { month_key: string; monthly_used: number; packs: number }[])[0]
    const bal = normalizeBalance({
      monthKey: String(row.month_key),
      monthlyUsed: Number(row.monthly_used),
      packs: Number(row.packs),
    })
    if (bal.monthKey !== String(row.month_key) || bal.monthlyUsed !== Number(row.monthly_used)) {
      // Month rolled — persist reset
      await getSql()`
        UPDATE pio_token_balances
        SET month_key = ${bal.monthKey},
            monthly_used = ${bal.monthlyUsed},
            packs = ${bal.packs},
            updated_at = ${now}
        WHERE email = ${key}
      `
    }
    return bal
  }

  const store = await readFileStore()
  if (!store[key]) {
    const migrated = await migrateLegacyIfNeeded(key)
    store[key] = migrated ?? { monthKey: month, monthlyUsed: 0, packs: 0 }
    await writeFileStore(store)
  }
  const bal = normalizeBalance(store[key])
  store[key] = bal
  await writeFileStore(store)
  return bal
}

async function writeBalance(email: string, bal: TokenBalance): Promise<void> {
  const key = email.trim().toLowerCase()
  const now = Math.floor(Date.now() / 1000)
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO pio_token_balances (email, month_key, monthly_used, packs, updated_at)
      VALUES (${key}, ${bal.monthKey}, ${bal.monthlyUsed}, ${bal.packs}, ${now})
      ON CONFLICT (email) DO UPDATE SET
        month_key = EXCLUDED.month_key,
        monthly_used = EXCLUDED.monthly_used,
        packs = EXCLUDED.packs,
        updated_at = EXCLUDED.updated_at
    `
    return
  }
  const store = await readFileStore()
  store[key] = bal
  await writeFileStore(store)
}

export async function getAtomicTokenStatus(email: string): Promise<{
  used: number
  quota: number
  monthlyRemaining: number
  packs: number
  remaining: number
}> {
  const bal = await getBalance(email)
  const monthlyRemaining = Math.max(0, MONTHLY_TOKEN_QUOTA - bal.monthlyUsed)
  return {
    used: bal.monthlyUsed,
    quota: MONTHLY_TOKEN_QUOTA,
    monthlyRemaining,
    packs: bal.packs,
    remaining: monthlyRemaining + bal.packs,
  }
}

/**
 * Atomically deduct tokens. Returns false if insufficient balance.
 * Uses a single conditional UPDATE on Neon so concurrent reserves cannot both succeed.
 */
export async function atomicConsumeTokens(email: string, amount: number): Promise<boolean> {
  const tokens = Math.max(0, Math.floor(amount))
  if (tokens <= 0) return true
  const key = email.trim().toLowerCase()
  const month = currentMonthKey()
  const now = Math.floor(Date.now() / 1000)
  const quota = MONTHLY_TOKEN_QUOTA

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getBalance(key) // ensure row + month roll

    // Atomic: only update if remaining >= tokens. Compute new used/packs in SQL.
    const rows = await getSql()`
      UPDATE pio_token_balances
      SET
        monthly_used = CASE
          WHEN GREATEST(0, ${quota} - monthly_used) >= ${tokens}
            THEN monthly_used + ${tokens}
          ELSE ${quota}
        END,
        packs = CASE
          WHEN GREATEST(0, ${quota} - monthly_used) >= ${tokens}
            THEN packs
          ELSE packs - (${tokens} - GREATEST(0, ${quota} - monthly_used))
        END,
        updated_at = ${now}
      WHERE email = ${key}
        AND month_key = ${month}
        AND (GREATEST(0, ${quota} - monthly_used) + packs) >= ${tokens}
      RETURNING email
    `
    return (rows as unknown[]).length > 0
  }

  const bal = await getBalance(key)
  const next = applyDebit(bal, tokens)
  if (!next) return false
  await writeBalance(key, next)
  return true
}

/** Atomically credit tokens (refund / pack purchase). */
export async function atomicCreditTokens(email: string, amount: number): Promise<void> {
  const tokens = Math.max(0, Math.floor(amount))
  if (tokens <= 0) return
  const key = email.trim().toLowerCase()
  const month = currentMonthKey()
  const now = Math.floor(Date.now() / 1000)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getBalance(key)
    await getSql()`
      UPDATE pio_token_balances
      SET packs = packs + ${tokens},
          updated_at = ${now}
      WHERE email = ${key}
        AND month_key = ${month}
    `
    // If month mismatch somehow, getBalance already rolled; re-apply
    const check = await getSql()`
      SELECT 1 AS ok FROM pio_token_balances WHERE email = ${key} AND month_key = ${month}
    `
    if ((check as unknown[]).length === 0) {
      const bal = await getBalance(key)
      await writeBalance(key, { ...bal, packs: bal.packs + tokens })
    }
    return
  }

  const bal = await getBalance(key)
  await writeBalance(key, { ...bal, packs: bal.packs + tokens })
}

/**
 * Reserve estimate before AI. Creates a held reservation row and deducts atomically.
 */
export async function reserveTokens(
  email: string,
  amount: number
): Promise<{ ok: true; reservationId: string; reserved: number } | { ok: false }> {
  const tokens = Math.max(0, Math.floor(amount))
  if (tokens <= 0) {
    return { ok: true, reservationId: `noop_${crypto.randomUUID()}`, reserved: 0 }
  }
  const reserved = await atomicConsumeTokens(email, tokens)
  if (!reserved) return { ok: false }

  const reservationId = crypto.randomUUID()
  const key = email.trim().toLowerCase()
  const now = Math.floor(Date.now() / 1000)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO pio_token_reservations (id, email, amount, status, created_at)
      VALUES (${reservationId}, ${key}, ${tokens}, 'held', ${now})
    `
  }

  return { ok: true, reservationId, reserved: tokens }
}

/** Refund a held reservation after AI failure. */
export async function releaseReservation(
  email: string,
  reservationId: string,
  reserved: number
): Promise<void> {
  if (reserved <= 0) return
  const key = email.trim().toLowerCase()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      UPDATE pio_token_reservations
      SET status = 'released'
      WHERE id = ${reservationId}
        AND email = ${key}
        AND status = 'held'
      RETURNING id
    `
    if ((rows as unknown[]).length === 0) return // already settled/released
  }

  await atomicCreditTokens(email, reserved)
}

/**
 * After successful AI: finalize reservation.
 * If actual < reserved, refund the difference.
 * If actual > reserved, try to debit the remainder (best-effort).
 */
export async function settleReservation(
  email: string,
  reservationId: string,
  reserved: number,
  actual: number
): Promise<{ amount: number }> {
  const used = Math.max(0, Math.floor(actual))
  const key = email.trim().toLowerCase()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      UPDATE pio_token_reservations
      SET status = 'finalized'
      WHERE id = ${reservationId}
        AND email = ${key}
        AND status = 'held'
      RETURNING id
    `
    if ((rows as unknown[]).length === 0) {
      // Already finalized/released — do not double-adjust
      return { amount: used || reserved }
    }
  }

  if (used < reserved) {
    await atomicCreditTokens(email, reserved - used)
    return { amount: used }
  }
  if (used > reserved) {
    await atomicConsumeTokens(email, used - reserved)
    return { amount: used }
  }
  return { amount: reserved }
}

export async function purgeTokenBalances(email: string): Promise<void> {
  const key = email.trim().toLowerCase()
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM pio_token_balances WHERE email = ${key}`
    await getSql()`DELETE FROM pio_token_reservations WHERE email = ${key}`
    await getSql()`DELETE FROM pio_generations WHERE email = ${key}`
    return
  }
  try {
    const store = await readFileStore()
    delete store[key]
    await writeFileStore(store)
  } catch {
    // ignore
  }
}
