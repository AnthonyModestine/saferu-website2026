/**
 * Run: npx --yes tsx --test scripts/ai-eval/lib/budget.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { canAfford, createBudget, releaseReservation, reserve, settle } from "./budget"

describe("eval budget tracker", () => {
  it("refuses reservations that would exceed the cap", () => {
    const budget = createBudget(1)
    assert.equal(reserve(budget, "a", 0.6), true)
    assert.equal(canAfford(budget, 0.5), false)
    assert.equal(reserve(budget, "b", 0.5), false)
  })

  it("settles measured spend and frees reservation", () => {
    const budget = createBudget(10)
    assert.equal(reserve(budget, "a", 2), true)
    settle(budget, "a", 1.5)
    assert.equal(budget.spentUsd, 1.5)
    assert.equal(budget.reservedUsd, 0)
  })

  it("releases failed reservations without charging", () => {
    const budget = createBudget(10)
    reserve(budget, "a", 3)
    releaseReservation(budget, "a")
    assert.equal(budget.spentUsd, 0)
    assert.equal(budget.reservedUsd, 0)
  })
})
