/**
 * Persistent budget ledger across Phase 4 experiment invocations.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

export type PersistentBudget = {
  maxUsd: number
  spentEstimatedUsd: number
  spentMeasuredUsd: number
  entries: Array<{
    at: string
    id: string
    estimatedUsd: number
    measuredUsd?: number
    note?: string
  }>
}

export function loadBudget(filePath: string, maxUsd: number): PersistentBudget {
  if (!existsSync(filePath)) {
    return { maxUsd, spentEstimatedUsd: 0, spentMeasuredUsd: 0, entries: [] }
  }
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as PersistentBudget
  return {
    maxUsd,
    spentEstimatedUsd: raw.spentEstimatedUsd || 0,
    spentMeasuredUsd: raw.spentMeasuredUsd || 0,
    entries: raw.entries || [],
  }
}

export function saveBudget(filePath: string, budget: PersistentBudget): void {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(budget, null, 2))
}

/** Conservative remaining = max - max(estimated, measured) spent so far - reserved. */
export function remainingConservative(budget: PersistentBudget, reservedUsd = 0): number {
  const spent = Math.max(budget.spentEstimatedUsd, budget.spentMeasuredUsd)
  return budget.maxUsd - spent - reservedUsd
}

export function canAffordPersistent(
  budget: PersistentBudget,
  estimatedUsd: number
): boolean {
  return remainingConservative(budget) + 1e-9 >= estimatedUsd
}

export function recordSpend(
  budget: PersistentBudget,
  id: string,
  estimatedUsd: number,
  measuredUsd?: number,
  note?: string
): void {
  budget.spentEstimatedUsd += estimatedUsd
  if (typeof measuredUsd === "number") budget.spentMeasuredUsd += measuredUsd
  budget.entries.push({
    at: new Date().toISOString(),
    id,
    estimatedUsd,
    measuredUsd,
    note,
  })
}
