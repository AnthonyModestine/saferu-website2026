import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  partitionApprovedCopy,
  selectGraphicExecutionStrategy,
} from "./execution-strategy"

describe("execution-strategy", () => {
  it("routes child-passenger style challenges to accuracy_first", () => {
    const d = selectGraphicExecutionStrategy({
      challenge: "accuracy_critical_equipment",
      headline: "Car Seat Safety for Children",
      message:
        "Always use the right car seat for your child's age and size. Putting a rear-facing seat in front of an active airbag can cause serious injury or death in a crash.",
      technicalEquipmentCritical: true,
    })
    assert.equal(d.mode, "accuracy_first")
  })

  it("routes long copy to hybrid", () => {
    const d = selectGraphicExecutionStrategy({
      challenge: "conceptual_storytelling",
      headline: "Don’t Pay Scammers With Gift Cards",
      message:
        "Government agencies will never ask you to pay with gift cards. If someone pressures you for urgent payment by gift card, it’s a scam — hang up right away to avoid losing your money.",
    })
    assert.equal(d.mode, "hybrid")
  })

  it("partitions long multi-sentence messages without rewriting", () => {
    const p = partitionApprovedCopy(
      "Carbon Monoxide: Invisible Threat",
      "Carbon monoxide is an odorless gas that can kill you in your sleep. Install working CO detectors on every level of your home, and never ignore the alarm—leave immediately if it sounds."
    )
    assert.equal(p.onGraphicHeadline, "Carbon Monoxide: Invisible Threat")
    assert.ok(p.onGraphicMessage?.startsWith("Carbon monoxide is an odorless"))
    assert.ok(p.captionRemainder?.includes("Install working CO detectors"))
  })
})
