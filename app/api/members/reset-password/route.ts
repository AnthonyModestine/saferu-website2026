import { NextResponse } from "next/server"
import { getFreeMemberByEmail, updateMemberPassword } from "@/lib/members-store"
import { consumeResetToken } from "@/lib/password-reset-tokens"
import { clearMemberSessionsForUser } from "@/lib/member-session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`reset-password:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const token = typeof body.token === "string" ? body.token.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!token) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const email = await consumeResetToken(token)
    if (!email) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 })
    }

    const member = await getFreeMemberByEmail(email)
    if (!member) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 })
    }

    const updated = await updateMemberPassword(member.id, password)
    if (!updated) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    await clearMemberSessionsForUser(member.id)

    return NextResponse.json({ ok: true, message: "Password updated. You can sign in now." })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
