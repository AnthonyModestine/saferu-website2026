export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval?: "month" | "year"
  /** Included or purchased AI tokens (Press Center metering). */
  tokens?: number
  images?: string[]
}

// Press Center subscriptions - monthly and annual billing
export const SUBSCRIPTION_PRODUCTS: Product[] = [
  {
    id: "pio-tool-monthly",
    name: "Press Center",
    description:
      "Communication workspace for public safety agencies. Includes 100,000 AI tokens each month for press releases, video requests, event campaigns, community posts, and Graphic Studio.",
    priceInCents: 9900, // $99.00/month
    interval: "month",
    tokens: 100_000,
  },
  {
    id: "pio-tool-annual",
    name: "Press Center (Annual)",
    description:
      "Communication workspace for public safety agencies, billed annually. Includes 100,000 AI tokens each month for press releases, video requests, event campaigns, community posts, and Graphic Studio.",
    priceInCents: 99900, // $999.00/year
    interval: "year",
    tokens: 100_000,
  },
]

// Additional token packs - one-time purchases, carry over until used
// Product IDs kept stable for existing Stripe checkout metadata.
export const TOKEN_PACKS: Product[] = [
  {
    id: "generations-5",
    name: "25,000 AI Tokens",
    description: "25,000 additional AI tokens for Press Center and Graphic Studio",
    priceInCents: 1000, // $10.00
    tokens: 25_000,
  },
  {
    id: "generations-12",
    name: "50,000 AI Tokens",
    description: "50,000 additional AI tokens for Press Center and Graphic Studio",
    priceInCents: 2000, // $20.00
    tokens: 50_000,
  },
  {
    id: "generations-35",
    name: "125,000 AI Tokens",
    description: "125,000 additional AI tokens for Press Center and Graphic Studio",
    priceInCents: 5000, // $50.00
    tokens: 125_000,
  },
]

/** @deprecated Prefer TOKEN_PACKS */
export const GENERATION_PACKS = TOKEN_PACKS

// Combined exports
export const PRODUCTS: Product[] = [...SUBSCRIPTION_PRODUCTS, ...TOKEN_PACKS]

export function productTokenAmount(productId: string): number {
  const product = PRODUCTS.find((p) => p.id === productId)
  return product?.tokens ?? 0
}
