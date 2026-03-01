import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const article = getArticleById("fire-prevention", subcategoryId, articleId)
  const subcategory = getSubcategoryById("fire-prevention", subcategoryId)
  
  return {
    title: article ? `${article.title} - ${subcategory?.title} - SaferU` : "Fire Prevention - SaferU",
    description: article?.description || "Fire safety tips and prevention resources.",
  }
}

export default async function ArticlePage({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const category = getCategoryById("fire-prevention")
  const subcategory = getSubcategoryById("fire-prevention", subcategoryId)
  const article = getArticleById("fire-prevention", subcategoryId, articleId)

  if (!category || !subcategory || !article) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor="text-[#e07c3e]"
    />
  )
}
