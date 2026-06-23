import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import { getEmailConfigStatus } from "@/lib/email-config"
import { sendTestEmail } from "@/lib/send-reset-email"

export async function GET() {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(getEmailConfigStatus())
}

export async function POST(request: Request) {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const to = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!to || !to.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const result = await sendTestEmail(to)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Failed to send test email" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
