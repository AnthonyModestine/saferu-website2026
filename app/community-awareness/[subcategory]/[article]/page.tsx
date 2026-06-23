import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const article = getArticleById("community-awareness", subcategoryId, articleId)
  const subcategory = getSubcategoryById("community-awareness", subcategoryId)

  return {
    title: article ? `${article.title} - ${subcategory?.title} - SaferU` : "Community Awareness - SaferU",
    description: article?.description || "Community awareness tips and resources.",
  }
}

export default async function CommunityAwarenessArticlePage({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
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
