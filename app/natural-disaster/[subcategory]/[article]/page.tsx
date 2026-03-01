"use client"

import { use } from "react"
import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export default function NaturalDisasterArticlePage({
  params,
}: {
  params: Promise<{ subcategory: string; article: string }>
}) {
  const { subcategory: subcategoryId, article: articleId } = use(params)
  const category = getCategoryById("natural-disaster")
  const subcategory = getSubcategoryById("natural-disaster", subcategoryId)
  const article = getArticleById("natural-disaster", subcategoryId, articleId)

  if (!category || !subcategory || !article) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor="text-[#c44d4d]"
    />
  )
}
