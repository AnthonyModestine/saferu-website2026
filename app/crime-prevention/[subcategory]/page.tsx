import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const subcategory = getSubcategoryById("crime-prevention", subcategoryId)
  
  return {
    title: subcategory ? `${subcategory.title} - Crime Prevention - SaferU` : "Crime Prevention - SaferU",
    description: subcategory?.description || "Crime prevention tips and resources.",
  }
}

export default async function SubcategoryPage({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const category = getCategoryById("crime-prevention")
  const subcategory = getSubcategoryById("crime-prevention", subcategoryId)

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <ArticlesPage
      category={category}
      subcategory={subcategory}
      iconColor="text-primary"
    />
  )
}
