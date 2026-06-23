/**
 * Send password reset email via Resend.
 * Set RESEND_API_KEY in env. Optionally set RESEND_FROM (e.g. "SaferU <support@saferu.com>").
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.RESEND_FROM ?? "SaferU <onboarding@resend.dev>"

function formatResendError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("only send") || lower.includes("testing") || lower.includes("verify")) {
    return "Email could not be sent. Verify saferu.com in Resend, add DNS records in Squarespace, and set RESEND_FROM=SaferU <support@saferu.com> on Vercel."
  }
  if (lower.includes("api key") || lower.includes("unauthorized")) {
    return "Email is not configured correctly. Check RESEND_API_KEY on Vercel (saferu-backend project)."
  }
  return message
}

async function sendHtmlEmail(params: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error("[send-email] RESEND_API_KEY is not set")
    return { ok: false, error: "Email is not configured. Add RESEND_API_KEY on Vercel." }
  }

  const { Resend } = await import("resend")
  const resend = new Resend(RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [params.to.trim().toLowerCase()],
      subject: params.subject,
      html: params.html,
      text: params.text,
    })
    if (error) {
      console.error("[send-email] Resend error:", error)
      return { ok: false, error: formatResendError(error.message) }
    }
    return { ok: true }
  } catch (err) {
    console.error("[send-email] Failed to send:", err)
    const message = err instanceof Error ? err.message : "Failed to send email"
    return { ok: false, error: formatResendError(message) }
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<{ ok: boolean; error?: string }> {
  const subject = "Reset your SaferU password"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; line-height: 1.5; color: #1a365d;">
      <p>You requested a password reset for your SaferU account.</p>
      <p><a href="${resetLink}" style="display:inline-block;background:#1470AF;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset your password</a></p>
      <p style="word-break:break-all;font-size:14px;color:#555;">Or copy this link:<br>${resetLink}</p>
      <p style="font-size:14px;color:#555;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      <p>— SaferU</p>
    </div>
  `.trim()
  const text = `Reset your SaferU password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`

  return sendHtmlEmail({ to, subject, html, text })
}

/** Admin test email to verify Resend is working. */
export async function sendTestEmail(to: string): Promise<{ ok: boolean; error?: string }> {
  const subject = "SaferU email test"
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; line-height: 1.5; color: #1a365d;">
      <p>This is a test email from SaferU admin.</p>
      <p>If you received this, password reset emails should work for addresses allowed by your Resend domain setup.</p>
      <p>— SaferU</p>
    </div>
  `.trim()
  const text = "This is a test email from SaferU admin. If you received this, Resend is configured correctly."

  return sendHtmlEmail({ to, subject, html, text })
}
