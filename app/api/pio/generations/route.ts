import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { getGenerationStatus } from "@/lib/pio-generations"

export async function GET() {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
  ])

  if (!stripePaid && !trialActive) {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 })
  }

  const status = await getGenerationStatus(session.email)
  return NextResponse.json(status)
}
