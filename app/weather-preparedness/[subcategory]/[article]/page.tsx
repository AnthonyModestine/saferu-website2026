import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getSubcategoryById, getArticleById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

export async function generateMetadata({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
  const article = getArticleById("weather-preparedness", subcategoryId, articleId)
  const subcategory = getSubcategoryById("weather-preparedness", subcategoryId)

  return {
    title: article ? `${article.title} - ${subcategory?.title} - SaferU` : "Weather Preparedness - SaferU",
    description: article?.description || "Weather preparedness tips and resources.",
  }
}

export default async function WeatherArticlePage({ params }: Props) {
  const { subcategory: subcategoryId, article: articleId } = await params
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
