'use server'

import { stripe } from '../../lib/stripe'
import { PRODUCTS } from '../../lib/products'
import { getMemberSession } from '../../lib/member-session'

export async function startCheckoutSession(productId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.")
  }
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Link checkout to the logged-in member's email if available
  const session = await getMemberSession()
  const customerEmail = session?.email ?? undefined

  const checkoutSession = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: product.interval ? {
            interval: product.interval,
          } : undefined,
        },
        quantity: 1,
      },
    ],
    mode: product.interval ? 'subscription' : 'payment',
    metadata: {
      memberId: session?.memberId ?? '',
      memberEmail: session?.email ?? '',
      productId,
    },
  })

  return checkoutSession.client_secret
}

export async function startHostedCheckoutSession(productId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.")
  }
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  const session = await getMemberSession()
  const customerEmail = session?.email ?? undefined
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: product.interval ? 'subscription' : 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
          recurring: product.interval ? { interval: product.interval } : undefined,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/pio-tool?subscribed=1`,
    cancel_url: `${appUrl}/pio-tool`,
    metadata: {
      memberId: session?.memberId ?? '',
      memberEmail: session?.email ?? '',
      productId,
    },
  })

  return checkoutSession.url
}

export async function createCustomerPortalSession(customerId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.")
  }
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account`,
  })

  return session.url
}
