"use server"

import { stripe } from "@/lib/stripe"
import { stripeListAll } from "@/lib/stripe-list-all"
import { checkAdminSession } from "@/lib/admin-auth"
import { getFreeMembers, deleteFreeMember, addFreeMember } from "@/lib/members-store"
import { setTrial, getTrialEnd } from "@/lib/pio-trial"
import { getDisabledEmails, setMemberDisabled as setDisabledInStore } from "@/lib/disabled-members"

export interface MemberRow {
  id: string
  email: string | null
  name: string | null
  createdAt: number
  paid: boolean
  access: string
  /** Stripe subscription status if any */
  subscriptionStatus: string | null
  /** PIO trial end (Unix seconds), or null if none / expired */
  trialEndAt: number | null
  /** True if account is disabled by admin */
  disabled: boolean
}

export interface MembersResult {
  members: MemberRow[]
  total: number
  error?: string
}

export interface RevenueResult {
  availableCents: number
  pendingCents: number
  totalRevenueCents: number
  currency: string
  error?: string
}

async function ensureAdmin(): Promise<void> {
  const ok = await checkAdminSession()
  if (!ok) throw new Error("Unauthorized")
}

function getStripe() {
  return stripe
}

/** List all members: Stripe customers plus free signups (merged by email; free-only appear as Free). */
export async function getMembersList(): Promise<MembersResult> {
  await ensureAdmin()
  const freeMembers = await getFreeMembers()
  const stripeClient = getStripe()
  const disabledSet = await getDisabledEmails()

  const stripeEmails = new Set<string>()
  const members: MemberRow[] = []

  if (stripeClient) {
    try {
      const customerRows = await stripeListAll((params) => stripeClient.customers.list(params))
      const customers: { id: string; email: string | null; name: string | null; created: number }[] = []
      for (const c of customerRows) {
        customers.push({
          id: c.id,
          email: c.email ?? null,
          name: c.name ?? ([c.metadata?.name].filter(Boolean).join(" ") || null),
          created: c.created,
        })
        if (c.email) stripeEmails.add(c.email.toLowerCase())
      }
      const subsByCustomer = new Map<string, { status: string; product?: string }>()
      const subscriptionRows = await stripeListAll((params) =>
        stripeClient.subscriptions.list({ status: "all", ...params })
      )
      for (const sub of subscriptionRows) {
        if (sub.customer && typeof sub.customer === "string") {
          const existing = subsByCustomer.get(sub.customer)
          if (!existing || sub.status === "active") {
            const productName = sub.items?.data?.[0]?.price?.nickname ?? sub.items?.data?.[0]?.price?.recurring ? "Subscription" : "One-time"
            subsByCustomer.set(sub.customer, { status: sub.status, product: productName })
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
      for (const c of customers) {
        const sub = subsByCustomer.get(c.id)
        const hasPayment = paidCustomerIds.has(c.id) || (sub?.status === "active")
        let access = "Free"
        if (sub?.status === "active") access = "Press Center Subscriber"
        else if (paidCustomerIds.has(c.id)) access = "Paid (one-time or past)"
        members.push({
          id: c.id,
          email: c.email,
          name: c.name,
          createdAt: c.created,
          paid: hasPayment,
          access,
          subscriptionStatus: sub?.status ?? null,
          trialEndAt: null,
          disabled: disabledSet.has((c.email ?? "").toLowerCase()),
        })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load members"
      return { members: [], total: 0, error: message }
    }
  }

  for (const m of freeMembers) {
    if (stripeEmails.has(m.email.toLowerCase())) continue
    members.push({
      id: `free_${m.id}`,
      email: m.email,
      name: m.name,
      createdAt: m.createdAt,
      paid: false,
      access: "Free",
      subscriptionStatus: null,
      trialEndAt: null,
      disabled: disabledSet.has(m.email.toLowerCase()),
    })
  }

  members.sort((a, b) => a.createdAt - b.createdAt)

  // Fill trial end for each member with email
  const trialEnds = await Promise.all(members.map((m) => (m.email ? getTrialEnd(m.email) : null)))
  members.forEach((m, i) => {
    m.trialEndAt = trialEnds[i]
  })

  return { members, total: members.length }
}

/** Count of members (free + Stripe) and paying members (Stripe only). */
export async function getMembersCounts(): Promise<{
  total: number
  paying: number
  error?: string
}> {
  await ensureAdmin()
  const freeMembers = await getFreeMembers()
  const stripeClient = getStripe()

  let stripeCount = 0
  const stripeEmails = new Set<string>()
  const paidCustomerIds = new Set<string>()

  if (stripeClient) {
    try {
      const customerRows = await stripeListAll((params) => stripeClient.customers.list(params))
      stripeCount = customerRows.length
      for (const c of customerRows) {
        if (c.email) stripeEmails.add(c.email.toLowerCase())
      }
      const subscriptionRows = await stripeListAll((params) =>
        stripeClient.subscriptions.list({ status: "all", ...params })
      )
      for (const sub of subscriptionRows) {
        if (sub.customer && typeof sub.customer === "string" && sub.status === "active") {
          paidCustomerIds.add(sub.customer)
        }
      }
      const chargeRows = await stripeListAll((params) => stripeClient.charges.list(params))
      for (const charge of chargeRows) {
        if (charge.customer && typeof charge.customer === "string" && charge.paid) {
          paidCustomerIds.add(charge.customer)
        }
      }
    } catch (e) {
      return { total: 0, paying: 0, error: e instanceof Error ? e.message : "Failed to count" }
    }
  }

  const freeOnlyCount = freeMembers.filter((m) => !stripeEmails.has(m.email.toLowerCase())).length
  const total = stripeCount + freeOnlyCount
  const paying = paidCustomerIds.size
  return { total, paying }
}

/** Revenue summary from Stripe balance and charges. */
export async function getRevenueSummary(): Promise<RevenueResult> {
  await ensureAdmin()
  const stripeClient = getStripe()
  if (!stripeClient) {
    return { availableCents: 0, pendingCents: 0, totalRevenueCents: 0, currency: "usd", error: "Stripe not configured" }
  }
  try {
    const balance = await stripeClient.balance.retrieve()
    const availableCents = balance.available.reduce((sum, b) => sum + b.amount, 0)
    const pendingCents = balance.pending.reduce((sum, b) => sum + b.amount, 0)
    let totalRevenueCents = 0
    const chargeRows = await stripeListAll((params) => stripeClient.charges.list(params))
    for (const charge of chargeRows) {
      if (charge.paid && charge.amount) totalRevenueCents += charge.amount
    }
    const currency = balance.available[0]?.currency ?? "usd"
    return { availableCents, pendingCents, totalRevenueCents, currency }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load revenue"
    return { availableCents: 0, pendingCents: 0, totalRevenueCents: 0, currency: "usd", error: message }
  }
}

/** Delete a member: free signup (id starts with free_) or Stripe customer (cus_xxx). Removes them from the list. */
export async function deleteMember(id: string): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  if (!id?.trim()) return { success: false, error: "Member ID required" }
  if (id.startsWith("free_")) {
    const freeId = id.slice(5)
    const removed = await deleteFreeMember(freeId)
    return removed ? { success: true } : { success: false, error: "Member not found" }
  }
  if (id.startsWith("cus_")) {
    const stripeClient = getStripe()
    if (!stripeClient) return { success: false, error: "Stripe not configured" }
    try {
      await stripeClient.customers.del(id)
      return { success: true }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to delete member"
      return { success: false, error: message }
    }
  }
  return { success: false, error: "Invalid member ID" }
}

/** Add a member (free signup). Password is hashed and stored; never shown in admin. */
export async function addMemberAdmin(params: {
  email: string
  name?: string
  agency?: string
  password?: string
}): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  const email = params.email?.trim()
  if (!email) return { success: false, error: "Email is required" }
  const result = await addFreeMember({
    email,
    name: params.name?.trim() || email,
    agency: params.agency?.trim(),
    password: params.password?.trim(),
  })
  if ("error" in result) return { success: false, error: result.error }
  return { success: true }
}

/** Grant Press Center trial for a member by email (admin only). Days = 7 or 30. */
export async function grantPioTrial(email: string, days: number): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  const normalized = email?.trim()?.toLowerCase()
  if (!normalized) return { success: false, error: "Email is required" }
  if (days !== 7 && days !== 30) return { success: false, error: "Days must be 7 or 30" }
  try {
    await setTrial(normalized, days)
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to grant trial"
    return { success: false, error: message }
  }
}

/** Enable or disable a member by email (admin only). Disabled users cannot sign in. */
export async function setMemberDisabled(email: string, disabled: boolean): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  const normalized = email?.trim()?.toLowerCase()
  if (!normalized) return { success: false, error: "Email is required" }
  try {
    await setDisabledInStore(normalized, disabled)
    return { success: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update"
    return { success: false, error: message }
  }
}

/** Set a temporary password for a free member (admin only). Only works for members whose id starts with free_. */
export async function setMemberTemporaryPassword(
  memberId: string,
  temporaryPassword: string
): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  const plain = temporaryPassword?.trim()
  if (!plain || plain.length < 8) return { success: false, error: "Password must be at least 8 characters" }
  if (!memberId.startsWith("free_")) {
    return { success: false, error: "Temporary password can only be set for free members (sign-in with email/password)." }
  }
  const freeId = memberId.slice(5)
  const { updateMemberPassword } = await import("@/lib/members-store")
  const updated = await updateMemberPassword(freeId, plain)
  return updated ? { success: true } : { success: false, error: "Member not found" }
}
