"use client"

import { use } from "react"
import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export default function NaturalDisasterSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>
}) {
  const { subcategory: subcategoryId } = use(params)
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
