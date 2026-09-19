import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"
import { addTokenPack } from "@/lib/pio-generations"
import { productTokenAmount } from "@/lib/products"

/**
 * Stripe webhook handler.
 * Verifies the signature using STRIPE_WEBHOOK_SECRET from environment variables.
 *
 * Recommended events:
 *   customer.subscription.*, invoice.payment_*, checkout.session.completed
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === "payment" && session.payment_status === "paid") {
          const email = (
            session.metadata?.memberEmail ||
            session.customer_email ||
            session.customer_details?.email ||
            ""
          )
            .trim()
            .toLowerCase()
          const productId = session.metadata?.productId?.trim() || ""
          const tokens = productTokenAmount(productId)
          if (email && tokens > 0) {
            await addTokenPack(email, tokens)
            console.log(`Credited ${tokens} AI tokens to ${email} from ${productId}`)
          } else {
            console.warn(
              `checkout.session.completed missing credit info: email=${email || "(none)"} productId=${productId || "(none)"}`
            )
          }
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`Subscription ${event.type}: ${subscription.id} status=${subscription.status}`)
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
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Webhook handler error:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
