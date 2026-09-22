"use server"

import { stripe } from "@/lib/stripe"
import { LOCAL_PREVIEW_MEMBER } from "@/lib/local-preview"
import { isLocalPreviewServer } from "@/lib/local-preview-server"

/**
 * True when this email has a current Press Center subscription entitlement.
 *
 * Counts as paid:
 * - Local development preview (localhost + NODE_ENV=development)
 * - Stripe subscription status `active` or `trialing`
 *
 * Does NOT count as paid:
 * - Historic one-time charges (including token packs)
 * - Canceled / unpaid / incomplete / past_due subscriptions alone
 */
export async function getIsPaidByEmail(email: string): Promise<boolean> {
  if (await isLocalPreviewServer()) {
    const normalizedPreview = email?.trim()?.toLowerCase()
    if (!normalizedPreview || normalizedPreview === LOCAL_PREVIEW_MEMBER.email) return true
  }

  const normalized = email?.trim()?.toLowerCase()
  if (!normalized || !stripe) return false
  try {
    const customers = await stripe.customers.list({ email: normalized, limit: 1 })
    const customer = customers.data[0]
    if (!customer) return false

    const active = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    })
    if (active.data.length > 0) return true

    const trialing = await stripe.subscriptions.list({
      customer: customer.id,
      status: "trialing",
      limit: 1,
    })
    return trialing.data.length > 0
  } catch {
    return false
  }
}
