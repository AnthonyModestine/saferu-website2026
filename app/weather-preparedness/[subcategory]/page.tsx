import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const subcategory = getSubcategoryById("weather-preparedness", subcategoryId)

  return {
    title: subcategory ? `${subcategory.title} - Weather Preparedness - SaferU` : "Weather Preparedness - SaferU",
    description: subcategory?.description || "Weather preparedness tips and resources.",
  }
}

export default async function WeatherSubcategoryPage({ params }: Props) {
  const { subcategory: subcategoryId } = await params
  const category = getCategoryById("weather-preparedness")
  const subcategory = getSubcategoryById("weather-preparedness", subcategoryId)

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <ArticlesPage
      category={category}
      subcategory={subcategory}
      iconColor="text-[#5b7a9d]"
    />
  )
}
