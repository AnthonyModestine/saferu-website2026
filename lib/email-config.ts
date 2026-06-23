/**
 * Resend email configuration status for admin diagnostics.
 */

export interface EmailConfigStatus {
  configured: boolean
  apiKeySet: boolean
  fromAddress: string
  usingResendTestDomain: boolean
  issues: string[]
  setupSteps: string[]
}

export function getEmailConfigStatus(): EmailConfigStatus {
  const apiKeySet = Boolean(process.env.RESEND_API_KEY?.trim())
  const fromAddress = process.env.RESEND_FROM?.trim() || "SaferU <onboarding@resend.dev>"
  const usingResendTestDomain = fromAddress.includes("@resend.dev")

  const issues: string[] = []
  const setupSteps: string[] = []

  if (!apiKeySet) {
    issues.push("RESEND_API_KEY is not set on this deployment.")
    setupSteps.push("In Vercel → saferu-backend → Settings → Environment Variables, add RESEND_API_KEY from resend.com/api-keys.")
  }

  if (usingResendTestDomain) {
    issues.push("Using Resend test sender (onboarding@resend.dev). Password reset only delivers to the email on your Resend account.")
    setupSteps.push("Verify saferu.com in Resend → Domains, then set RESEND_FROM=SaferU <support@saferu.com> on Vercel and redeploy.")
  } else if (!fromAddress.includes("@saferu.com")) {
    setupSteps.push(`Confirm ${fromAddress} is on a domain verified in Resend.`)
  }

  if (apiKeySet && !usingResendTestDomain) {
    setupSteps.push("Add Resend DNS records in Squarespace: resend._domainkey (TXT), send (MX + TXT). Wait for verification in Resend.")
    setupSteps.push("Set RESEND_FROM=SaferU <support@saferu.com> on the saferu-backend Vercel project, then redeploy.")
  }

  setupSteps.push("Use Send test email below to confirm delivery before asking users to reset passwords.")

  return {
    configured: apiKeySet,
    apiKeySet,
    fromAddress,
    usingResendTestDomain,
    issues,
    setupSteps,
  }
}
