import { neon, NeonQueryFunction } from "@neondatabase/serverless"

let sql: NeonQueryFunction<false, false> | null = null
let schemaReady = false

/** True when Neon/Postgres env vars are present (Vercel + local env pull). */
export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl())
}

function getDatabaseUrl(): string | undefined {
  return process.env.POSTGRES_URL ?? process.env.DATABASE_URL
}

export function getSql(): NeonQueryFunction<false, false> {
  const url = getDatabaseUrl()
  if (!url) {
    throw new Error("Database is not configured. Set POSTGRES_URL or DATABASE_URL.")
  }
  if (!sql) {
    sql = neon(url)
  }
  return sql
}

/** Create members + sessions tables if they do not exist yet. Safe to call repeatedly. */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return
  const db = getSql()

  await db`
    CREATE TABLE IF NOT EXISTS free_members (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      agency TEXT,
      password_hash TEXT,
      created_at BIGINT NOT NULL
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS member_sessions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES free_members(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      name TEXT,
      expires_at BIGINT NOT NULL
    )
  `

  await db`CREATE INDEX IF NOT EXISTS idx_free_members_email ON free_members (email)`
  await db`CREATE INDEX IF NOT EXISTS idx_member_sessions_expires ON member_sessions (expires_at)`

  schemaReady = true
}
