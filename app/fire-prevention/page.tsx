import { renderCategoryIndexPage } from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Fire Prevention - SaferU",
  description: "Fire safety tips and prevention resources for your community.",
}

export default async function FirePreventionPage() {
  return renderCategoryIndexPage("fire-prevention")
}
