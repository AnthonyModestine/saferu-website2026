import { ArticleDetailPage } from "@/components/article-detail-page"
import { getCategoryById, findArticleInCategory } from "@/lib/content-merged"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ article: string }>
}

export async function generateMetadata({ params }: Props) {
  await ensureContentLoaded()
  const { article: articleId } = await params
  const found = findArticleInCategory("whats-new", articleId)
  return {
    title: found ? `${found.article.title} - What's New - SaferU` : "What's New - SaferU",
    description: found?.article.description || "Latest safety content and updates.",
  }
}

export default async function WhatsNewArticlePage({ params }: Props) {
  noStore()
  await ensureContentLoaded()
  const { article: articleId } = await params
  const category = getCategoryById("whats-new")
  const found = findArticleInCategory("whats-new", articleId)

  if (!category || !found) {
    notFound()
  }

  return (
    <ArticleDetailPage
      category={category}
      subcategory={found.subcategory}
      article={found.article}
      iconColor="text-[#f2b233]"
      isWhatsNew
    />
  )
}
