import { renderCategoryIndexPage } from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Natural Disaster - SaferU",
  description: "Prepare for and respond to natural disasters in your area.",
}

export default async function NaturalDisasterPage() {
  return renderCategoryIndexPage("natural-disaster")
}
