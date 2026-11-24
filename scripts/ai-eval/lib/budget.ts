/**
 * Conservative budget tracker for paid AI eval runs.
 * Stops before a request that would exceed the authorized cap.
 */

export type BudgetLedger = {
  maxUsd: number
  spentUsd: number
  reservedUsd: number
  requests: Array<{ id: string; estimatedUsd: number; measuredUsd?: number }>
}

export function createBudget(maxUsd: number): BudgetLedger {
  return { maxUsd, spentUsd: 0, reservedUsd: 0, requests: [] }
}

export function canAfford(budget: BudgetLedger, estimatedUsd: number): boolean {
  return budget.spentUsd + budget.reservedUsd + estimatedUsd <= budget.maxUsd + 1e-9
}

export function reserve(budget: BudgetLedger, id: string, estimatedUsd: number): boolean {
  if (!canAfford(budget, estimatedUsd)) return false
  budget.reservedUsd += estimatedUsd
  budget.requests.push({ id, estimatedUsd })
  return true
}

export function settle(
  budget: BudgetLedger,
  id: string,
  measuredUsd: number | undefined
): void {
  const req = budget.requests.find((r) => r.id === id && r.measuredUsd === undefined)
  if (!req) return
  budget.reservedUsd = Math.max(0, budget.reservedUsd - req.estimatedUsd)
  const charge = measuredUsd ?? req.estimatedUsd
  req.measuredUsd = charge
  budget.spentUsd += charge
}

export function releaseReservation(budget: BudgetLedger, id: string): void {
  const idx = budget.requests.findIndex((r) => r.id === id && r.measuredUsd === undefined)
  if (idx < 0) return
  budget.reservedUsd = Math.max(0, budget.reservedUsd - budget.requests[idx].estimatedUsd)
  budget.requests.splice(idx, 1)
}
