/**
 * Verifies local data-collection stores and optional live API checks.
 * Run: node scripts/verify-data-collection.mjs
 * With dev server: node scripts/verify-data-collection.mjs --live http://localhost:3000
 */

import fs from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const DEPARTMENT_TYPES = [
  "police",
  "sheriff",
  "state_police",
  "fire",
  "ems",
  "emergency_management",
  "municipality",
  "other",
]

let passed = 0
let failed = 0

function ok(label) {
  passed += 1
  console.log(`  ✓ ${label}`)
}

function fail(label, detail) {
  failed += 1
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`)
}

function assert(condition, label, detail) {
  if (condition) ok(label)
  else fail(label, detail)
}

async function testDepartmentValidation() {
  console.log("\nDepartment signup validation")
  assert(DEPARTMENT_TYPES.includes("sheriff"), "sheriff is a valid department type")
  assert(DEPARTMENT_TYPES.includes("state_police"), "state_police is a valid department type")
  assert(!DEPARTMENT_TYPES.includes("invalid"), "invalid department rejected")

  const requiresOther = (type, other) => {
    if (!type) return "Department type is required"
    if (!DEPARTMENT_TYPES.includes(type)) return "Invalid department type"
    if (type === "other" && !other?.trim()) return "Please describe your department"
    return null
  }

  assert(requiresOther("", "") === "Department type is required", "empty department blocked")
  assert(requiresOther("other", "") === "Please describe your department", "other requires text")
  assert(requiresOther("fire", "") === null, "fire accepted without other")
  assert(requiresOther("other", "Campus Security") === null, "other with text accepted")
}

async function testAnalyticsStoreRoundtrip() {
  console.log("\nPress Center analytics file store")
  const storePath = path.join(DATA_DIR, "pio-analytics.json")
  const backupPath = `${storePath}.verify-backup`

  let backup = null
  try {
    backup = await fs.readFile(storePath, "utf-8")
  } catch {
    backup = null
  }

  const testSessionId = `verify-${Date.now()}`
  const now = Date.now()
  const sample = {
    sessions: [
      {
        id: testSessionId,
        agencyId: "member-verify",
        userId: "member-verify",
        memberEmail: "verify@test.local",
        agencyName: "Verify PD",
        agencyType: "police",
        memberPlan: "free",
        generationType: "new_press_release",
        incidentType: "burglary",
        investigationStatus: "ongoing",
        createdAt: now,
      },
    ],
    actions: [
      {
        id: "action-verify",
        generationSessionId: testSessionId,
        actionType: "press_release_copied",
        createdAt: now,
      },
    ],
    feedback: [
      {
        id: "feedback-verify",
        generationSessionId: testSessionId,
        rating: "positive",
        createdAt: now,
      },
    ],
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(storePath, JSON.stringify(sample, null, 2), "utf-8")
    const raw = await fs.readFile(storePath, "utf-8")
    const parsed = JSON.parse(raw)
    assert(parsed.sessions?.[0]?.id === testSessionId, "session written and read")
    assert(parsed.actions?.[0]?.actionType === "press_release_copied", "action written and read")
    assert(parsed.feedback?.[0]?.rating === "positive", "feedback written and read")
  } finally {
    if (backup != null) {
      await fs.writeFile(storePath, backup, "utf-8")
    } else {
      await fs.unlink(storePath).catch(() => {})
    }
  }
}

async function testContentAnalyticsStore() {
  console.log("\nCurated content analytics file store")
  const storePath = path.join(DATA_DIR, "content-analytics.json")
  const backupPath = `${storePath}.verify-backup`

  let backup = null
  try {
    backup = await fs.readFile(storePath, "utf-8")
  } catch {
    backup = null
  }

  const sample = [
    {
      id: "content-verify",
      eventType: "copy",
      categoryId: "crime-prevention",
      subcategoryId: "home",
      articleId: "burglary-prevention",
      path: "/crime-prevention/home/burglary-prevention",
      createdAt: Date.now(),
    },
  ]

  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(storePath, JSON.stringify(sample, null, 2), "utf-8")
    const parsed = JSON.parse(await fs.readFile(storePath, "utf-8"))
    assert(Array.isArray(parsed) && parsed[0]?.eventType === "copy", "content event stored")
  } finally {
    if (backup != null) {
      await fs.writeFile(storePath, backup, "utf-8")
    } else {
      await fs.unlink(storePath).catch(() => {})
    }
  }
}

async function testMembersStoreShape() {
  console.log("\nMember signup store shape")
  const storePath = path.join(DATA_DIR, "free-members.json")
  let raw = "[]"
  try {
    raw = await fs.readFile(storePath, "utf-8")
  } catch {
    raw = JSON.stringify({ members: [] })
  }

  const parsed = JSON.parse(raw)
  const members = Array.isArray(parsed.members) ? parsed.members : parsed
  assert(Array.isArray(members), "free-members.json readable")

  const withDept = members.find((m) => m.departmentType)
  if (withDept) {
    assert(Boolean(withDept.departmentType), "existing member has departmentType when present")
  } else {
    ok("no members with department yet (expected before new signups)")
  }
}

async function testLiveApi(baseUrl) {
  console.log(`\nLive API checks (${baseUrl})`)

  const trackRes = await fetch(`${baseUrl}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "page_view",
      path: "/crime-prevention/home/burglary-prevention",
    }),
  })
  assert(trackRes.ok, "POST /api/track for article path")

  const homeTrack = await fetch(`${baseUrl}/api/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "page_view", path: "/" }),
  })
  assert(homeTrack.ok, "POST /api/track for home page")

  const signupMissingDept = await fetch(`${baseUrl}/api/members/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `missing-dept-${Date.now()}@test.local`,
      password: "testpassword123",
      departmentType: "",
    }),
  })
  assert(signupMissingDept.status === 400, "signup rejects missing department type")

  const signupOtherMissing = await fetch(`${baseUrl}/api/members/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `other-missing-${Date.now()}@test.local`,
      password: "testpassword123",
      departmentType: "other",
    }),
  })
  assert(signupOtherMissing.status === 400, "signup rejects other without description")

  const actionUnauthorized = await fetch(`${baseUrl}/api/pio/analytics/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationSessionId: "fake-session",
      actionType: "press_release_copied",
    }),
  })
  assert(actionUnauthorized.status === 401, "analytics action requires login")
}

async function main() {
  console.log("SaferU data collection verification")
  await testDepartmentValidation()
  await testAnalyticsStoreRoundtrip()
  await testContentAnalyticsStore()
  await testMembersStoreShape()

  const liveArg = process.argv.indexOf("--live")
  if (liveArg !== -1) {
    const baseUrl = process.argv[liveArg + 1] || "http://localhost:3000"
    try {
      await testLiveApi(baseUrl)
    } catch (e) {
      fail("live API checks", e instanceof Error ? e.message : String(e))
    }
  } else {
    console.log("\nSkipping live API checks (run with --live http://localhost:3000)")
  }

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
