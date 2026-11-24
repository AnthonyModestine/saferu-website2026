/**
 * Agency voice memory must reach post-message generation inputs.
 * Run: npx --yes tsx --test lib/post-generator/post-message/voice-memory.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildPostMessageInputFromOpportunity } from "./build-input"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"

const opportunity = {
  id: "opp-1",
  title: "Road closure on Oak Ave",
  summary: "Oak Ave closed for water main repair",
  category: "road_closure",
  sourceLabel: "Current Local Opportunity",
  whyItMatters: "Drivers need a detour",
  recommendedAction: "Use Maple Street",
  recommendedPostTiming: "today",
  priority: "recommended_today",
  signals: [],
  verifiedFacts: ["Oak Ave closed between 1st and 4th until Friday 5pm"],
  publicCallToAction: ["Use Maple Street detour"],
  doNotClaim: [],
} as RankedExternalOpportunity

describe("agency voice memory injection", () => {
  it("includes agencyVoiceProfile on PostMessageInput", () => {
    const input = buildPostMessageInputFromOpportunity(opportunity, {
      agencyName: "Lansdale Borough Police Department",
      agencyType: "Police Department",
      agencyVoiceProfile: "Prefer calm tone; short sentences; include tip line when available.",
      city: "Lansdale",
      county: "Montgomery",
      state: "PA",
    })
    assert.ok(input.voiceProfile)
    assert.match(input.voiceProfile!, /calm tone/)
    assert.equal(input.agencyName, "Lansdale Borough Police Department")
  })

  it("omits voiceProfile when memory is empty", () => {
    const input = buildPostMessageInputFromOpportunity(opportunity, {
      agencyName: "Test PD",
      agencyType: "police",
      agencyVoiceProfile: "   ",
      city: "Testville",
      county: "",
      state: "TX",
    })
    assert.equal(input.voiceProfile, undefined)
  })
})
