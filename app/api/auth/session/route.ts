import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { isDisabled } from "@/lib/disabled-members"
import { getMemberDepartmentProfile } from "@/lib/member-profile"

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
    const [stripePaid, trialActive, profile] = await Promise.all([
      getIsPaidByEmail(session.email),
      isOnActiveTrial(session.email),
      getMemberDepartmentProfile(session.email),
    ])
    const paid = stripePaid || trialActive
    return NextResponse.json({
      member: {
        id: session.memberId,
        email: session.email,
        name: session.name ?? null,
        paid,
        agency: profile?.agency ?? null,
        departmentType: profile?.departmentType ?? null,
        departmentOther: profile?.departmentOther ?? null,
      },
    })
  } catch {
    return NextResponse.json({ member: null })
  }
}
