import type Stripe from "stripe"

type PageParams = { limit: number; starting_after?: string }

/** Paginate Stripe list endpoints (Stripe SDK v20+ removed autoPagingIter). */
export async function stripeListAll<T extends { id: string }>(
  fetchPage: (params: PageParams) => Promise<Stripe.ApiList<T>>
): Promise<T[]> {
  const all: T[] = []
  let startingAfter: string | undefined

  while (true) {
    const page = await fetchPage({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    all.push(...page.data)
    if (!page.has_more || page.data.length === 0) break
    startingAfter = page.data[page.data.length - 1]!.id
  }

  return all
}
