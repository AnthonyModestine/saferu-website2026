export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  interval?: "month" | "year"
  generations?: number
  images?: string[]
}

// Base subscription - $20/month includes 30 generations (press releases + community requests)
export const SUBSCRIPTION_PRODUCTS: Product[] = [
  {
    id: "pio-tool-monthly",
    name: "Press Center",
    description: "Press release and community request generator for public safety agencies. Includes 30 generations per month.",
    priceInCents: 2000, // $20.00/month
    interval: "month",
    generations: 30,
  },
]

// Additional generation packs - one-time purchases, carry over
export const GENERATION_PACKS: Product[] = [
  {
    id: "generations-5",
    name: "5 Additional Generations",
    description: "5 additional generations for press releases and community requests",
    priceInCents: 1000, // $10.00
    generations: 5,
  },
  {
    id: "generations-12",
    name: "12 Additional Generations",
    description: "12 additional generations for press releases and community requests",
    priceInCents: 2000, // $20.00
    generations: 12,
  },
  {
    id: "generations-35",
    name: "35 Additional Generations",
    description: "35 additional generations for press releases and community requests",
    priceInCents: 5000, // $50.00
    generations: 35,
  },
]

// Combined exports
export const PRODUCTS: Product[] = [...SUBSCRIPTION_PRODUCTS, ...GENERATION_PACKS]
