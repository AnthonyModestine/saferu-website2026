import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, getArticleById } from "@/lib/content-merged"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"
import { notFound } from "next/navigation"

const WHATS_NEW_SUBCATEGORY_ID = "latest"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ article: string }>
}

export async function generateMetadata({ params }: Props) {
  const { article: articleId } = await params
  const article = getArticleById("whats-new", WHATS_NEW_SUBCATEGORY_ID, articleId)
  return {
    title: article ? `${article.title} - What's New - SaferU` : "What's New - SaferU",
    description: article?.description || "Latest safety content and updates.",
  }
}

export default async function WhatsNewArticlePage({ params }: Props) {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
  const { article: articleId } = await params
  const category = getCategoryById("whats-new")
  const subcategory = category?.subcategories.find((s) => s.id === WHATS_NEW_SUBCATEGORY_ID)
  const article = getArticleById("whats-new", WHATS_NEW_SUBCATEGORY_ID, articleId)

  if (!category || !subcategory || !article) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor="text-[#f2b233]"
      isWhatsNew
    />
  )
}
