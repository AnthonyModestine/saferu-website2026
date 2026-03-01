import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const article = getArticleById("crime-prevention", subcategoryId, articleId)
  const subcategory = getSubcategoryById("crime-prevention", subcategoryId)
  
  return {
    title: article ? `${article.title} - ${subcategory?.title} - SaferU` : "Crime Prevention - SaferU",
    description: article?.description || "Crime prevention tips and resources.",
  }
}

export default async function ArticlePage({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const category = getCategoryById("crime-prevention")
  const subcategory = getSubcategoryById("crime-prevention", subcategoryId)
  const article = getArticleById("crime-prevention", subcategoryId, articleId)

  if (!category || !subcategory || !article) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor="text-primary"
    />
  )
}
