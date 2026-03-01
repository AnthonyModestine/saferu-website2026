"use client"

import { use } from "react"
import { ArticlesPage } from "@/components/articles-page"
import { getCategoryById, getSubcategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export default function CommunityAwarenessSubcategoryPage({
  params,
}: {
  params: Promise<{ subcategory: string }>
}) {
  const { subcategory: subcategoryId } = use(params)
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
