import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const article = getArticleById("natural-disaster", subcategoryId, articleId)
  const subcategory = getSubcategoryById("natural-disaster", subcategoryId)

  return {
    title: article ? `${article.title} - ${subcategory?.title} - SaferU` : "Natural Disaster - SaferU",
    description: article?.description || "Natural disaster preparedness tips and resources.",
  }
}

export default async function NaturalDisasterArticlePage({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
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
