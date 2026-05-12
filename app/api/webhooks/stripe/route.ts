import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"

/**
 * Stripe webhook handler.
 * Verifies the signature using STRIPE_WEBHOOK_SECRET from environment variables.
 * Set this in Vercel → Settings → Environment Variables.
 *
 * To get your webhook secret:
 *   1. Go to stripe.com/dashboard → Developers → Webhooks
 *   2. Add endpoint: https://yourdomain.com/api/webhooks/stripe
 *   3. Select events: customer.subscription.created, customer.subscription.updated,
 *      customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed
 *   4. Copy the "Signing secret" and add it as STRIPE_WEBHOOK_SECRET in Vercel
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`Subscription ${event.type}: ${subscription.id} status=${subscription.status}`)
        // Stripe is the source of truth for paid status via getIsPaidByEmail.
        // No local state change needed unless you want to cache it.
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`Subscription cancelled: ${subscription.id}`)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment succeeded: invoice ${invoice.id}`)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        console.warn(`Payment failed: invoice ${invoice.id} — customer may lose access`)
        break
      }

      default:
        // Ignore unhandled event types
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
