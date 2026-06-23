import { NextResponse } from "next/server"
import { getMemberSession, clearMemberSession } from "@/lib/member-session"
import { getFreeMemberByEmail, deleteFreeMember } from "@/lib/members-store"
import { verifyPassword } from "@/lib/password"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`delete-account:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
  }

  try {
    const session = await getMemberSession()
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const body = await request.json()
    const password = typeof body.password === "string" ? body.password : ""

    const member = await getFreeMemberByEmail(session.email)
    if (!member) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 })
    }

    if (member.passwordHash) {
      if (!password) {
        return NextResponse.json({ error: "Password is required to delete your account." }, { status: 400 })
      }
      const valid = await verifyPassword(password, member.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
      }
    }

    await deleteFreeMember(member.id)
    await clearMemberSession()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
