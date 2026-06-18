import { NextResponse } from "next/server"
import { getFreeMemberByEmail } from "@/lib/members-store"
import { createResetToken } from "@/lib/password-reset-tokens"
import { sendPasswordResetEmail } from "@/lib/send-reset-email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const member = await getFreeMemberByEmail(email)
    if (!member) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists for this email, you will receive a reset link.",
      })
    }

    const token = await createResetToken(email)
    const origin = new URL(request.url).origin
    const resetLink = `${origin}/reset-password?token=${encodeURIComponent(token)}`

    const sent = await sendPasswordResetEmail(email, resetLink)
    if (!sent.ok) {
      console.error("[forgot-password] send failed for", email, sent.error)
      return NextResponse.json(
        { error: sent.error ?? "Failed to send reset email. Please try again or contact support." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for this email, you will receive a reset link.",
    })
  } catch (err) {
    console.error("[forgot-password] error:", err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again or contact support.",
      },
      { status: 500 }
    )
  }
}
