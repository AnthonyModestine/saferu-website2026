import { SubcategoryPage } from "@/components/subcategory-page"
import { getCategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Fire Prevention - SaferU",
  description: "Fire safety tips and prevention resources for your community.",
}

export default function FirePreventionPage() {
  const category = getCategoryById("fire-prevention")

  if (!category) {
    notFound()
  }

  return (
    <SubcategoryPage
      category={category}
      iconColor="text-[#e07c3e]"
    />
  )
}
