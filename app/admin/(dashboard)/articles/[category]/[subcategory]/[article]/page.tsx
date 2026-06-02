import { notFound } from "next/navigation"
import { getCategoryById, getArticle } from "@/lib/content-merged"
import { isArticlePublished } from "@/lib/content-visibility"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"
import { getAdditions } from "@/lib/cms-additions"
import ArticleEditorClient from "./article-editor-client"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ category: string; subcategory: string; article: string }>
}

export default async function ArticleEditorPage({ params }: PageProps) {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
  const { category: categoryId, subcategory: subcategoryId, article: articleId } = await params

  const category = getCategoryById(categoryId, { includeUnpublished: true })
  const subcategory = category?.subcategories.find((s) => s.id === subcategoryId)
  const article = getArticle(categoryId, subcategoryId, articleId, { includeUnpublished: true })

  if (!category || !subcategory || !article) {
    console.error("[admin/article] not found", {
      categoryId,
      subcategoryId,
      articleId,
      hasCategory: Boolean(category),
      hasSubcategory: Boolean(subcategory),
      cmsArticleCount: getAdditions().articles.length,
    })
    notFound()
  }

  const published = isArticlePublished(categoryId, subcategoryId, articleId)

  return (
    <ArticleEditorClient
      category={category}
      subcategory={subcategory}
      article={article}
      categoryId={categoryId}
      subcategoryId={subcategoryId}
      articleId={articleId}
      published={published}
    />
  )
}
