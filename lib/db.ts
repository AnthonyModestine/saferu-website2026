import { neon, NeonQueryFunction } from "@neondatabase/serverless"

let sql: NeonQueryFunction<false, false> | null = null
let schemaReady = false

/** True when Neon/Postgres env vars are present (Vercel + local env pull). */
export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl())
}

/** Which env var supplies the database URL (safe to expose in admin UI). */
export function getConfiguredDatabaseEnvVar(): string | null {
  if (process.env.POSTGRES_URL) return "POSTGRES_URL"
  if (process.env.POSTGRES_URL_NON_POOLING) return "POSTGRES_URL_NON_POOLING"
  if (process.env.DATABASE_URL) return "DATABASE_URL"
  if (process.env.NEON_DATABASE_URL) return "NEON_DATABASE_URL"
  return null
}

function getDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.NEON_DATABASE_URL
  )
}

export type DatabaseStorageMeta = {
  storage: "postgres" | "file"
  reason?: "missing_env" | "connection_failed"
  envVar?: string | null
}

/** Verify Postgres is configured and reachable (used by admin metrics). */
export async function getDatabaseStorageMeta(): Promise<DatabaseStorageMeta> {
  const envVar = getConfiguredDatabaseEnvVar()
  if (!envVar) {
    return { storage: "file", reason: "missing_env", envVar: null }
  }
  try {
    const db = getSql()
    await db`SELECT 1`
    return { storage: "postgres", envVar }
  } catch (err) {
    console.error("[db] connection check failed:", err)
    return { storage: "file", reason: "connection_failed", envVar }
  }
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

/** Create members + sessions + cms tables if they do not exist yet. Safe to call repeatedly. */
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

  await db`ALTER TABLE free_members ADD COLUMN IF NOT EXISTS department_type TEXT`
  await db`ALTER TABLE free_members ADD COLUMN IF NOT EXISTS department_other TEXT`

  await db`
    CREATE TABLE IF NOT EXISTS member_sessions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES free_members(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      name TEXT,
      expires_at BIGINT NOT NULL
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      email TEXT NOT NULL,
      expires_at BIGINT NOT NULL
    )
  `
  await db`CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions (expires_at)`

  await db`
    CREATE TABLE IF NOT EXISTS cms_additions (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      data JSONB NOT NULL DEFAULT '{}'
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS content_visibility (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      unpublished_keys JSONB NOT NULL DEFAULT '[]'
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS pio_trials (
      email TEXT PRIMARY KEY,
      trial_end_at BIGINT NOT NULL
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS pio_generations (
      email TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{"packs":0}'
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS generation_sessions (
      id TEXT PRIMARY KEY,
      agency_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      member_email TEXT NOT NULL,
      agency_name TEXT,
      agency_type TEXT,
      member_plan TEXT NOT NULL DEFAULT 'free',
      generation_type TEXT NOT NULL,
      incident_type TEXT,
      investigation_status TEXT,
      created_at BIGINT NOT NULL
    )
  `

  await db`ALTER TABLE generation_sessions ADD COLUMN IF NOT EXISTS department_other TEXT`

  await db`
    CREATE TABLE IF NOT EXISTS generation_actions (
      id TEXT PRIMARY KEY,
      generation_session_id TEXT NOT NULL REFERENCES generation_sessions(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS generation_feedback (
      id TEXT PRIMARY KEY,
      generation_session_id TEXT NOT NULL REFERENCES generation_sessions(id) ON DELETE CASCADE,
      rating TEXT NOT NULL,
      reason TEXT,
      comment TEXT,
      created_at BIGINT NOT NULL
    )
  `

  await db`
    CREATE TABLE IF NOT EXISTS content_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      category_id TEXT,
      subcategory_id TEXT,
      article_id TEXT,
      article_title TEXT,
      post_id TEXT,
      post_title TEXT,
      path TEXT,
      member_email TEXT,
      ip TEXT,
      created_at BIGINT NOT NULL
    )
  `

  await db`CREATE INDEX IF NOT EXISTS idx_free_members_email ON free_members (email)`
  await db`CREATE INDEX IF NOT EXISTS idx_member_sessions_expires ON member_sessions (expires_at)`
  await db`CREATE INDEX IF NOT EXISTS idx_gen_sessions_created ON generation_sessions (created_at)`
  await db`CREATE INDEX IF NOT EXISTS idx_gen_sessions_agency ON generation_sessions (agency_id)`
  await db`CREATE INDEX IF NOT EXISTS idx_gen_sessions_email ON generation_sessions (member_email)`
  await db`CREATE INDEX IF NOT EXISTS idx_gen_actions_session ON generation_actions (generation_session_id)`
  await db`CREATE INDEX IF NOT EXISTS idx_gen_actions_created ON generation_actions (created_at)`
  await db`CREATE INDEX IF NOT EXISTS idx_gen_feedback_session ON generation_feedback (generation_session_id)`
  await db`CREATE INDEX IF NOT EXISTS idx_content_events_created ON content_events (created_at)`
  await db`CREATE INDEX IF NOT EXISTS idx_content_events_path ON content_events (path)`
  await db`ALTER TABLE content_events ADD COLUMN IF NOT EXISTS session_id TEXT`
  await db`CREATE INDEX IF NOT EXISTS idx_content_events_session ON content_events (session_id)`

  await db`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      expires_at BIGINT NOT NULL
    )
  `
  await db`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens (email)`
  await db`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens (expires_at)`

  schemaReady = true
}
