import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const subcategory = getSubcategoryById("community-awareness", subcategoryId)

  return {
    title: subcategory ? `${subcategory.title} - Community Awareness - SaferU` : "Community Awareness - SaferU",
    description: subcategory?.description || "Community awareness tips and resources.",
  }
}

export default async function CommunityAwarenessSubcategoryPage({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const category = getCategoryById("community-awareness")
  const subcategory = getSubcategoryById("community-awareness", subcategoryId)

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <ArticlesPage
      category={category}
      subcategory={subcategory}
      iconColor="text-[#4a9d6b]"
    />
  )
}
