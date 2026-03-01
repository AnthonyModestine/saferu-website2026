"use client"

import { use } from "react"
import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export default function WeatherSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>
}) {
  const { subcategory: subcategoryId } = use(params)
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
