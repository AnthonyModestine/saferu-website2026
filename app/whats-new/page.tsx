import { getCategoryById } from "@/lib/content-merged"
import { WhatsNewClient } from "./whats-new-client"

const WHATS_NEW_SUBCATEGORY_ID = "latest"

export default function WhatsNewPage() {
  const category = getCategoryById("whats-new")
  const subcategory = category?.subcategories.find((s) => s.id === WHATS_NEW_SUBCATEGORY_ID)
  const articles = subcategory?.articles ?? []

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
