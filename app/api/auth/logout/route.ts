import { NextResponse } from "next/server"
import { clearMemberSession } from "@/lib/member-session"

export async function POST() {
  try {
    await clearMemberSession()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
