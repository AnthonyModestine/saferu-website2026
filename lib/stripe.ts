import "server-only"

import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
export const stripe: Stripe | null = key ? new Stripe(key) : null
