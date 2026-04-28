import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { createCustomerPortalSession } from "@/app/actions/stripe"
import { stripe } from "@/lib/stripe"

/** GET: return Stripe customer portal URL for the signed-in member, or null if no Stripe customer. */
export async function GET() {
  try {
    const session = await getMemberSession()
    if (!session) {
      return NextResponse.json({ url: null, error: "Not signed in" }, { status: 401 })
    }
    if (!stripe) {
      return NextResponse.json({ url: null, error: "Billing not configured" }, { status: 503 })
    }
    const email = session.email.trim().toLowerCase()
    const customers = await stripe.customers.list({ email, limit: 1 })
    const customer = customers.data[0]
    if (!customer) {
      return NextResponse.json({ url: null })
    }
    const url = await createCustomerPortalSession(customer.id)
    return NextResponse.json({ url })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create portal session"
    return NextResponse.json({ url: null, error: message }, { status: 500 })
  }
}
