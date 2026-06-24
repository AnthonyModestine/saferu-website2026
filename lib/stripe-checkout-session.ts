import "server-only"

import { stripe } from "@/lib/stripe"

export type CheckoutSessionSummary = {
  email: string
  productId: string | null
}

/** Returns checkout details only when Stripe reports a completed, paid session. */
export async function getCompletedCheckoutSession(
  sessionId: string
): Promise<CheckoutSessionSummary | null> {
  if (!stripe || !sessionId.startsWith("cs_")) return null

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.status !== "complete") return null
    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return null
    }

    const email =
      session.customer_details?.email?.trim() ||
      session.customer_email?.trim() ||
      null
    if (!email) return null

    return {
      email,
      productId: session.metadata?.productId ?? null,
    }
  } catch {
    return null
  }
}
