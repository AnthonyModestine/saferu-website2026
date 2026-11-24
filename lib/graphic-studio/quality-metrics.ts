/**
 * Privacy-safe Graphic Studio quality monitoring.
 *
 * Serverless-safe:
 * - Always emits a structured log line (Vercel logs).
 * - Optionally persists aggregates to Postgres when configured.
 * - Never writes required local JSON (ephemeral on Vercel).
 * - Never stores headline, message, images, or agency copy.
 * - Failures never throw to callers.
 */

import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

export type GraphicQualityEvent = {
  at: string
  /** success | failed_generation | failed_qa | abandoned */
  result: "success" | "failed_generation" | "failed_qa" | "abandoned"
  firstAttemptQaPass?: boolean
  correctionsAttempted?: number
  revision?: boolean
  downloaded?: boolean
  latencyMs?: number
  /** Estimated provider cost USD when measured; never required. */
  estimatedCostUsd?: number
  failureReason?: string
  promptVersion?: string
  imageVariant?: string
  hadLogo?: boolean
}

async function ensureMetricsTable(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false
  await ensureSchema()
  const db = getSql()
  await db`
    CREATE TABLE IF NOT EXISTS graphic_studio_quality_events (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      result TEXT NOT NULL,
      first_attempt_qa_pass BOOLEAN,
      corrections_attempted INTEGER,
      is_revision BOOLEAN,
      is_download BOOLEAN,
      latency_ms INTEGER,
      estimated_cost_usd DOUBLE PRECISION,
      failure_reason TEXT,
      prompt_version TEXT,
      image_variant TEXT,
      had_logo BOOLEAN
    )
  `
  await db`CREATE INDEX IF NOT EXISTS idx_gs_quality_created ON graphic_studio_quality_events (created_at DESC)`
  return true
}

/** Record one anonymized quality event. Never pass customer content. Never throws. */
export function recordGraphicQualityEvent(event: GraphicQualityEvent): void {
  try {
    // Structured log for Vercel / log drains (primary serverless path).
    console.info(
      JSON.stringify({
        type: "saferu.graphic_quality",
        ...event,
      })
    )
  } catch {
    // ignore logging failures
  }

  // Best-effort async persist — fire and forget; never block the request.
  void persistEvent(event).catch((err) => {
    console.warn(
      "[graphic-studio/quality-metrics] persist failed:",
      err instanceof Error ? err.message : err
    )
  })
}

async function persistEvent(event: GraphicQualityEvent): Promise<void> {
  const ok = await ensureMetricsTable()
  if (!ok) return
  const db = getSql()
  await db`
    INSERT INTO graphic_studio_quality_events (
      result,
      first_attempt_qa_pass,
      corrections_attempted,
      is_revision,
      is_download,
      latency_ms,
      estimated_cost_usd,
      failure_reason,
      prompt_version,
      image_variant,
      had_logo
    ) VALUES (
      ${event.result},
      ${event.firstAttemptQaPass ?? null},
      ${event.correctionsAttempted ?? null},
      ${event.revision ?? false},
      ${event.downloaded ?? false},
      ${typeof event.latencyMs === "number" ? Math.round(event.latencyMs) : null},
      ${typeof event.estimatedCostUsd === "number" ? event.estimatedCostUsd : null},
      ${event.failureReason ? event.failureReason.slice(0, 80) : null},
      ${event.promptVersion ?? null},
      ${event.imageVariant ?? null},
      ${event.hadLogo ?? null}
    )
  `
}

export async function summarizeGraphicQualityMetrics(): Promise<{
  successfulGenerationRate: number | null
  firstAttemptQaPassRate: number | null
  avgCorrectionsPerSuccess: number | null
  avgLatencyMs: number | null
  estimatedCostPerSuccessUsd: number | null
  revisionCount: number
  downloadCount: number
  failureReasons: Record<string, number>
  storage: "postgres" | "logs_only"
}> {
  const empty = {
    successfulGenerationRate: null,
    firstAttemptQaPassRate: null,
    avgCorrectionsPerSuccess: null,
    avgLatencyMs: null,
    estimatedCostPerSuccessUsd: null,
    revisionCount: 0,
    downloadCount: 0,
    failureReasons: {} as Record<string, number>,
    storage: "logs_only" as const,
  }

  try {
    const ok = await ensureMetricsTable()
    if (!ok) return empty
    const db = getSql()
    const rows = await db`
      SELECT
        COUNT(*) FILTER (WHERE NOT COALESCE(is_download, false) OR latency_ms IS NOT NULL OR failure_reason IS NOT NULL OR COALESCE(is_revision, false))::int AS generations,
        COUNT(*) FILTER (WHERE result = 'success' AND (NOT COALESCE(is_download, false) OR latency_ms IS NOT NULL))::int AS successes,
        COUNT(*) FILTER (WHERE first_attempt_qa_pass = true)::int AS first_pass,
        COALESCE(SUM(corrections_attempted), 0)::int AS corrections,
        COUNT(*) FILTER (WHERE is_revision = true)::int AS revisions,
        COUNT(*) FILTER (WHERE is_download = true)::int AS downloads,
        COALESCE(AVG(latency_ms) FILTER (WHERE latency_ms IS NOT NULL), 0)::float AS avg_latency,
        COALESCE(SUM(estimated_cost_usd) FILTER (WHERE result = 'success'), 0)::float AS cost_sum
      FROM graphic_studio_quality_events
    `
    const r = rows[0] as Record<string, number>
    const generations = Number(r.generations || 0)
    const successes = Number(r.successes || 0)
    const reasons = await db`
      SELECT failure_reason, COUNT(*)::int AS c
      FROM graphic_studio_quality_events
      WHERE failure_reason IS NOT NULL
      GROUP BY failure_reason
      ORDER BY c DESC
      LIMIT 20
    `
    const failureReasons: Record<string, number> = {}
    for (const row of reasons as Array<{ failure_reason: string; c: number }>) {
      failureReasons[row.failure_reason] = Number(row.c)
    }
    return {
      successfulGenerationRate: generations > 0 ? successes / generations : null,
      firstAttemptQaPassRate: successes > 0 ? Number(r.first_pass || 0) / successes : null,
      avgCorrectionsPerSuccess: successes > 0 ? Number(r.corrections || 0) / successes : null,
      avgLatencyMs: Number(r.avg_latency || 0) || null,
      estimatedCostPerSuccessUsd: successes > 0 ? Number(r.cost_sum || 0) / successes : null,
      revisionCount: Number(r.revisions || 0),
      downloadCount: Number(r.downloads || 0),
      failureReasons,
      storage: "postgres",
    }
  } catch (err) {
    console.warn(
      "[graphic-studio/quality-metrics] summarize failed:",
      err instanceof Error ? err.message : err
    )
    return empty
  }
}
