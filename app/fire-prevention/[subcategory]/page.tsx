import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const subcategory = getSubcategoryById("fire-prevention", subcategoryId)
  
  return {
    title: subcategory ? `${subcategory.title} - Fire Prevention - SaferU` : "Fire Prevention - SaferU",
    description: subcategory?.description || "Fire safety tips and prevention resources.",
  }
}

export default async function SubcategoryPage({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const category = getCategoryById("fire-prevention")
  const subcategory = getSubcategoryById("fire-prevention", subcategoryId)

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <ArticlesPage
      category={category}
      subcategory={subcategory}
      iconColor="text-[#e07c3e]"
    />
  )
}
