import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const subcategory = getSubcategoryById("natural-disaster", subcategoryId)

  return {
    title: subcategory ? `${subcategory.title} - Natural Disaster - SaferU` : "Natural Disaster - SaferU",
    description: subcategory?.description || "Natural disaster preparedness tips and resources.",
  }
}

export default async function NaturalDisasterSubcategoryPage({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const category = getCategoryById("natural-disaster")
  const subcategory = getSubcategoryById("natural-disaster", subcategoryId)

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <ArticlesPage
      category={category}
      subcategory={subcategory}
      iconColor="text-[#c44d4d]"
    />
  )
}
