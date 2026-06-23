import { NextResponse } from "next/server"
import {
  getMemberSession,
  getCurrentMemberSessionId,
  clearMemberSessionsForUser,
} from "@/lib/member-session"
import { getFreeMemberByEmail, updateMemberPassword } from "@/lib/members-store"
import { verifyPassword } from "@/lib/password"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`change-password:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
  }

  try {
    const session = await getMemberSession()
    if (!session?.email) {
      return NextResponse.json({ error: "You must be signed in to change your password." }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : ""

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 })
    }

    const member = await getFreeMemberByEmail(session.email)
    if (!member) {
      return NextResponse.json({ error: "Account not found." }, { status: 400 })
    }
    if (!member.passwordHash) {
      return NextResponse.json({ error: "This account does not use a password." }, { status: 400 })
    }

    const valid = await verifyPassword(currentPassword, member.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 })
    }

    const updated = await updateMemberPassword(member.id, newPassword)
    if (!updated) {
      return NextResponse.json({ error: "Failed to update password. Please try again." }, { status: 500 })
    }

    const currentSessionId = await getCurrentMemberSessionId()
    await clearMemberSessionsForUser(member.id, currentSessionId ?? undefined)

    return NextResponse.json({ ok: true, message: "Password updated. Use your new password next time you sign in." })
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
