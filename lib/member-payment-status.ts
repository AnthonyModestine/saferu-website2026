/**
 * Stripe-backed payment status lookup for admin members and analytics.
 */

import { stripe } from "@/lib/stripe"
import { stripeListAll } from "@/lib/stripe-list-all"
import { getFreeMembers } from "@/lib/members-store"

export type MemberPaymentStatus = "active" | "past" | "never"

export interface MemberPaymentInfo {
  status: MemberPaymentStatus
  subscriptionStatus: string | null
}

export function derivePaymentStatus(
  hasActiveSub: boolean,
  hasSuccessfulCharge: boolean,
  hasAnySubscription: boolean
): MemberPaymentStatus {
  if (hasActiveSub) return "active"
  if (hasSuccessfulCharge || hasAnySubscription) return "past"
  return "never"
}

export function paymentStatusLabel(status: MemberPaymentStatus): string {
  switch (status) {
    case "active":
      return "Currently paying"
    case "past":
      return "Paid (past)"
    case "never":
      return "Never paid"
  }
}

export function accessLabel(
  paymentStatus: MemberPaymentStatus,
  subscriptionStatus: string | null
): string {
  if (paymentStatus === "active") return "Press Center Subscriber"
  if (paymentStatus === "past") {
    if (subscriptionStatus && subscriptionStatus !== "active") {
      return `Lapsed (${subscriptionStatus})`
    }
    return "Paid in the past"
  }
  return "Free"
}

/** Email (lowercase) → payment status for all registered members. */
export async function getMemberPaymentStatusMap(): Promise<Map<string, MemberPaymentInfo>> {
  const map = new Map<string, MemberPaymentInfo>()
  const freeMembers = await getFreeMembers()
  for (const m of freeMembers) {
    map.set(m.email.toLowerCase(), { status: "never", subscriptionStatus: null })
  }

  const stripeClient = stripe
  if (!stripeClient) return map

  const subsByCustomer = new Map<string, { status: string; hadAny: boolean }>()
  const subscriptionRows = await stripeListAll((params) =>
    stripeClient.subscriptions.list({ status: "all", ...params })
  )
  for (const sub of subscriptionRows) {
    if (sub.customer && typeof sub.customer === "string") {
      const existing = subsByCustomer.get(sub.customer)
      if (!existing) {
        subsByCustomer.set(sub.customer, { status: sub.status, hadAny: true })
      } else {
        existing.hadAny = true
        if (sub.status === "active") existing.status = "active"
      }
    }
  }

  const paidCustomerIds = new Set<string>()
  const chargeRows = await stripeListAll((params) => stripeClient.charges.list(params))
  for (const charge of chargeRows) {
    if (charge.customer && typeof charge.customer === "string" && charge.paid) {
      paidCustomerIds.add(charge.customer)
    }
  }

  const customerRows = await stripeListAll((params) => stripeClient.customers.list(params))
  for (const c of customerRows) {
    if (!c.email) continue
    const email = c.email.toLowerCase()
    const sub = subsByCustomer.get(c.id)
    const hasActiveSub = sub?.status === "active"
    const hasSuccessfulCharge = paidCustomerIds.has(c.id)
    const hasAnySubscription = sub?.hadAny ?? false
    map.set(email, {
      status: derivePaymentStatus(hasActiveSub, hasSuccessfulCharge, hasAnySubscription),
      subscriptionStatus: sub?.status ?? null,
    })
  }

  return map
}

export function lookupPaymentStatus(
  email: string | undefined | null,
  statusMap: Map<string, MemberPaymentInfo>
): MemberPaymentStatus | "anonymous" {
  if (!email?.trim()) return "anonymous"
  return statusMap.get(email.trim().toLowerCase())?.status ?? "never"
}
