"use client"

import { use } from "react"
import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export default function WeatherArticlePage({
  params,
}: {
  params: Promise<{ subcategory: string; article: string }>
}) {
  const { subcategory: subcategoryId, article: articleId } = use(params)
  const category = getCategoryById("weather-preparedness")
  const subcategory = getSubcategoryById("weather-preparedness", subcategoryId)
  const article = getArticleById("weather-preparedness", subcategoryId, articleId)

  if (!category || !subcategory || !article) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor="text-[#5b7a9d]"
    />
  )
}
