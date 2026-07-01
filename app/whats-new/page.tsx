import { unstable_noStore as noStore } from "next/cache"
import { getCategoryById, getFlatCategoryArticleEntries } from "@/lib/content-merged"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"
import { WhatsNewClient } from "./whats-new-client"

export const dynamic = "force-dynamic"

export default async function WhatsNewPage() {
  noStore()
  await ensureContentLoaded()

  const category = getCategoryById("whats-new")
  const articles = getFlatCategoryArticleEntries("whats-new").map((entry) => entry.article)

  if (!category) {
    return null
  }

  return (
    <WhatsNewClient
      categoryTitle={category.title}
      categoryDescription={category.description}
      articles={articles}
    />
  )
}
