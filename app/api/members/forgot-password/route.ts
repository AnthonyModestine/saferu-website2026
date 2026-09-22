import { NextResponse } from "next/server"
import { getFreeMemberByEmail } from "@/lib/members-store"
import { createResetToken } from "@/lib/password-reset-tokens"
import { sendPasswordResetEmail } from "@/lib/send-reset-email"
import { checkAuthRateLimit, getClientIp } from "@/lib/auth-rate-limit"
import { getAppBaseUrl } from "@/lib/app-url"

const GENERIC_MESSAGE =
  "If an account exists for this email, you will receive a reset link."

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!(await checkAuthRateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json(
      { ok: true, message: GENERIC_MESSAGE },
      { status: 200 }
    )
  }

  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const member = await getFreeMemberByEmail(email)
    if (member) {
      const token = await createResetToken(email)
      let appUrl: string
      try {
        appUrl = getAppBaseUrl()
      } catch (e) {
        console.error("[forgot-password] app URL misconfigured:", e)
        return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
      }
      const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`
      const sent = await sendPasswordResetEmail(email, resetLink)
      if (!sent.ok) {
        console.error("[forgot-password] send failed for", email, sent.error)
      }
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  } catch (err) {
    console.error("[forgot-password] error:", err)
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })
  }
}
