/**
 * Stable experiment identifiers for idempotent Phase 4+ eval runs.
 * Same fixture + model + config + prompt version ⇒ same id ⇒ skip regenerate.
 */

import { createHash } from "node:crypto"

export type ExperimentKeyParts = {
  kind: "graphic" | "writing" | "qa" | "strategy" | "research"
  fixtureId: string
  variant: string
  model: string
  promptVersion: string
  configFingerprint: string
}

export function fingerprintConfig(env: Record<string, string | undefined>): string {
  const keys = Object.keys(env)
    .filter((k) => k.startsWith("SAFERU_AI_"))
    .sort()
  const payload = keys.map((k) => `${k}=${env[k] ?? ""}`).join("|")
  return createHash("sha1").update(payload).digest("hex").slice(0, 12)
}

export function experimentId(parts: ExperimentKeyParts): string {
  const raw = [
    parts.kind,
    parts.fixtureId,
    parts.variant,
    parts.model,
    parts.promptVersion,
    parts.configFingerprint,
  ].join("::")
  return createHash("sha256").update(raw).digest("hex").slice(0, 16)
}

export function graphicExperimentId(opts: {
  topicId: string
  variant: string
  model: string
  promptVersion: string
  env: Record<string, string | undefined>
}): string {
  return experimentId({
    kind: "graphic",
    fixtureId: opts.topicId,
    variant: opts.variant,
    model: opts.model,
    promptVersion: opts.promptVersion,
    configFingerprint: fingerprintConfig(opts.env),
  })
}

export function writingExperimentId(opts: {
  caseId: string
  variant: string
  model: string
  promptVersion: string
  env: Record<string, string | undefined>
}): string {
  return experimentId({
    kind: "writing",
    fixtureId: opts.caseId,
    variant: opts.variant,
    model: opts.model,
    promptVersion: opts.promptVersion,
    configFingerprint: fingerprintConfig(opts.env),
  })
}
