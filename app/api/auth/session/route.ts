import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { isDisabled } from "@/lib/disabled-members"
import { getMemberDepartmentProfile } from "@/lib/member-profile"
import { LOCAL_PREVIEW_MEMBER } from "@/lib/local-preview"
import { isLocalPreviewServer } from "@/lib/local-preview-server"

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
    const localPreview =
      (await isLocalPreviewServer()) && session.email === LOCAL_PREVIEW_MEMBER.email

    const [stripePaid, trialActive, profile] = await Promise.all([
      getIsPaidByEmail(session.email),
      localPreview ? Promise.resolve(false) : isOnActiveTrial(session.email),
      localPreview ? Promise.resolve(null) : getMemberDepartmentProfile(session.email),
    ])
    const paid = localPreview || stripePaid || trialActive
    return NextResponse.json({
      member: {
        id: session.memberId,
        email: session.email,
        name: session.name ?? null,
        paid,
        agency: profile?.agency ?? "Demo Township Police Department",
        departmentType: profile?.departmentType ?? null,
        departmentOther: profile?.departmentOther ?? null,
        localPreview: localPreview || undefined,
      },
    })
  } catch {
    return NextResponse.json({ member: null })
  }
}
