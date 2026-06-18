/**
 * Send password reset email via Resend.
 * Set RESEND_API_KEY in env. Optionally set RESEND_FROM (e.g. "SaferU <support@saferu.com>").
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? "SaferU <onboarding@resend.dev>"

function formatResendError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("only send") || lower.includes("testing") || lower.includes("verify")) {
    return "Email could not be sent. Verify your domain in Resend and set RESEND_FROM to an address on that domain."
  }
  if (lower.includes("api key") || lower.includes("unauthorized")) {
    return "Email is not configured correctly. Check RESEND_API_KEY on Vercel."
  }
  return message
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("[send-reset-email] RESEND_API_KEY is not set")
    return { ok: false, error: "Email is not configured. Add RESEND_API_KEY on Vercel." }
  }

  const { Resend } = await import("resend")
  const resend = new Resend(RESEND_API_KEY)

  const subject = "Reset your SaferU password"
  const html = `
    <p>You requested a password reset for your SaferU account.</p>
    <p><a href="${resetLink}">Reset your password</a></p>
    <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    <p>— SaferU</p>
  `.trim()

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to.trim().toLowerCase()],
      subject,
      html,
    })
    if (error) {
      console.error("[send-reset-email] Resend error:", error)
      return { ok: false, error: formatResendError(error.message) }
    }
    return { ok: true }
  } catch (err) {
    console.error("[send-reset-email] Failed to send:", err)
    const message = err instanceof Error ? err.message : "Failed to send email"
    return { ok: false, error: formatResendError(message) }
  }
}
