import "server-only"

import { stripe } from "@/lib/stripe"
import { getAppBaseUrl } from "@/lib/app-url"

/** Create a Stripe Billing Portal URL for a known customer id (server-only; never accept raw ids from the browser). */
export async function createBillingPortalUrl(customerId: string): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.")
  }
  const appUrl = getAppBaseUrl()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`,
  })
  return session.url
}
