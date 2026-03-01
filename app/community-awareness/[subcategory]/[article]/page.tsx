"use client"

import { use } from "react"
import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export default function CommunityAwarenessArticlePage({
  params,
}: {
  params: Promise<{ subcategory: string; article: string }>
}) {
  const { subcategory: subcategoryId, article: articleId } = use(params)
  const category = getCategoryById("community-awareness")
  const subcategory = getSubcategoryById("community-awareness", subcategoryId)
  const article = getArticleById("community-awareness", subcategoryId, articleId)

  if (!category || !subcategory || !article) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor="text-[#4a9d6b]"
    />
  )
}
