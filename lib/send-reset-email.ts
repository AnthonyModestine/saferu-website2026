/**
 * Send password reset email via Resend.
 * Set RESEND_API_KEY in env. Optionally set RESEND_FROM (e.g. "SaferU <support@saferu.com>").
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? "SaferU <onboarding@resend.dev>"

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set; cannot send password reset email")
    return { ok: false, error: "Email is not configured" }
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
      to: [to],
      subject,
      html,
    })
    if (error) {
      console.error("Resend error:", error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error("Failed to send reset email:", err)
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email" }
  }
}
