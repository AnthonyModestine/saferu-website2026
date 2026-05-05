import { NextResponse } from "next/server"
import { getMemberSession, clearMemberSession } from "@/lib/member-session"
import { getFreeMemberByEmail, deleteFreeMember } from "@/lib/members-store"

export async function POST() {
  try {
    const session = await getMemberSession()
    if (!session) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const member = await getFreeMemberByEmail(session.email)
    if (member) {
      await deleteFreeMember(member.id)
    }

    await clearMemberSession()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
