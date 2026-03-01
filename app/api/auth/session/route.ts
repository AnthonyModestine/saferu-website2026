import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { isDisabled } from "@/lib/disabled-members"

export async function GET() {
  try {
    const session = await getMemberSession()
    if (!session) {
      return NextResponse.json({ member: null })
    }
    const disabled = await isDisabled(session.email)
    if (disabled) {
      return NextResponse.json({ member: null })
    }
    const [stripePaid, trialActive] = await Promise.all([
      getIsPaidByEmail(session.email),
      isOnActiveTrial(session.email),
    ])
    const paid = stripePaid || trialActive
    return NextResponse.json({
      member: {
        id: session.memberId,
        email: session.email,
        name: session.name ?? null,
        paid,
      },
    })
  } catch {
    return NextResponse.json({ member: null })
  }
}
