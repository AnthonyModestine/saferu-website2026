"use server"

import { stripe } from "@/lib/stripe"
import { LOCAL_PREVIEW_MEMBER } from "@/lib/local-preview"
import { isLocalPreviewServer } from "@/lib/local-preview-server"

/** Returns true if this email has an active Stripe subscription or a successful charge (PIO / paid access). */
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
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 1 })
    if (subs.data.length > 0) return true
    const charges = await stripe.charges.list({ customer: customer.id, limit: 1 })
    return charges.data.some((c) => c.paid === true)
  } catch {
    return false
  }
}
