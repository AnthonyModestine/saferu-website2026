import { SubcategoryPage } from "@/components/subcategory-page"
import { getCategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Crime Prevention - SaferU",
  description: "Crime prevention tips and resources for your community.",
}

export default function CrimePreventionPage() {
  const category = getCategoryById("crime-prevention")

  if (!category) {
    notFound()
  }

  return (
    <SubcategoryPage
      category={category}
      iconColor="text-primary"
    />
  )
}
