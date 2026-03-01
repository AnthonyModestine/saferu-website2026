import { SubcategoryPage } from "@/components/subcategory-page"
import { getCategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Natural Disaster - SaferU",
  description: "Prepare for and respond to natural disasters in your area.",
}

export default function NaturalDisasterPage() {
  const category = getCategoryById("natural-disaster")
  
  if (!category) {
    notFound()
  }

  return (
    <SubcategoryPage
      category={category}
      iconColor="text-[#c44d4d]"
    />
  )
}
