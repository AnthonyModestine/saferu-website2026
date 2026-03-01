import { NextResponse } from "next/server"
import { getFreeMemberByEmail } from "@/lib/members-store"
import { verifyPassword } from "@/lib/password"
import { createMemberSession } from "@/lib/member-session"
import { isDisabled } from "@/lib/disabled-members"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    const disabled = await isDisabled(email)
    if (disabled) {
      return NextResponse.json({ error: "This account has been disabled. Contact support." }, { status: 403 })
    }
    const member = await getFreeMemberByEmail(email)
    if (!member) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    if (!member.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    const valid = await verifyPassword(password, member.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }
    await createMemberSession({
      memberId: member.id,
      email: member.email,
      name: member.name,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
