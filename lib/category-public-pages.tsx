import { notFound, redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { SubcategoryPage } from "@/components/subcategory-page"
import { CategoryArticlesPage } from "@/components/category-articles-page"
import { ArticlesPage } from "@/components/articles-page"
import { ArticleDetailPage } from "@/components/article-detail-page"
import {
  getCategoryById,
  getSubcategoryById,
  getArticleById,
  findArticleInCategory,
  getFlatCategoryArticleEntries,
} from "@/lib/content-merged"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"
import {
  isFlatCategory,
  getCategoryPublicPath,
  getArticlePublicPath,
} from "@/lib/category-layout"

export type CategoryPublicConfig = {
  iconColor: string
  /** Skip subcategory in article detail breadcrumb */
  flatArticles?: boolean
}

const CONFIG: Record<string, CategoryPublicConfig> = {
  "crime-prevention": { iconColor: "text-primary" },
  "fire-prevention": { iconColor: "text-[#e07c3e]" },
  "weather-preparedness": { iconColor: "text-[#5b7a9d]" },
  "natural-disaster": { iconColor: "text-[#c44d4d]" },
  "community-awareness": { iconColor: "text-[#4a9d6b]" },
}

export function getCategoryPublicConfig(categoryId: string): CategoryPublicConfig {
  return CONFIG[categoryId] ?? { iconColor: "text-primary" }
}

export async function renderCategoryIndexPage(categoryId: string) {
  noStore()
  await ensureContentLoaded()

  const category = getCategoryById(categoryId)
  if (!category) notFound()

  const { iconColor } = getCategoryPublicConfig(categoryId)

  if (isFlatCategory(categoryId)) {
    const articles = getFlatCategoryArticleEntries(categoryId)
    return (
      <CategoryArticlesPage
        category={category}
        articles={articles}
        iconColor={iconColor}
      />
    )
  }

  return <SubcategoryPage category={category} iconColor={iconColor} />
}

export async function renderCategorySlugPage(categoryId: string, slug: string) {
  noStore()
  await ensureContentLoaded()

  const category = getCategoryById(categoryId)
  if (!category) notFound()

  const { iconColor } = getCategoryPublicConfig(categoryId)

  if (isFlatCategory(categoryId)) {
    const found = findArticleInCategory(categoryId, slug)
    if (found) {
      return (
        <ArticleDetailPage
          category={category}
          subcategory={found.subcategory}
          article={found.article}
          iconColor={iconColor}
          flatArticles
        />
      )
    }
    redirect(getCategoryPublicPath(categoryId))
  }

  const subcategory = getSubcategoryById(categoryId, slug)
  if (!subcategory) notFound()

  return (
    <ArticlesPage
      category={category}
      subcategory={subcategory}
      iconColor={iconColor}
    />
  )
}

export async function renderCategoryArticlePage(
  categoryId: string,
  subcategoryId: string,
  articleId: string
) {
  noStore()
  await ensureContentLoaded()

  if (isFlatCategory(categoryId)) {
    redirect(getArticlePublicPath(categoryId, subcategoryId, articleId))
  }

  const category = getCategoryById(categoryId)
  const subcategory = getSubcategoryById(categoryId, subcategoryId)
  const article = getArticleById(categoryId, subcategoryId, articleId)

  if (!category || !subcategory || !article) notFound()

  const { iconColor } = getCategoryPublicConfig(categoryId)

  return (
    <ArticleDetailPage
      category={category}
      subcategory={subcategory}
      article={article}
      iconColor={iconColor}
    />
  )
}

export async function getCategorySlugMetadata(
  categoryId: string,
  slug: string,
  categoryLabel: string
) {
  await ensureContentLoaded()

  if (isFlatCategory(categoryId)) {
    const found = findArticleInCategory(categoryId, slug)
    return {
      title: found
        ? `${found.article.title} - ${categoryLabel} - SaferU`
        : `${categoryLabel} - SaferU`,
      description: found?.article.description || `${categoryLabel} tips and resources.`,
    }
  }

  const subcategory = getSubcategoryById(categoryId, slug)
  return {
    title: subcategory
      ? `${subcategory.title} - ${categoryLabel} - SaferU`
      : `${categoryLabel} - SaferU`,
    description: subcategory?.description || `${categoryLabel} tips and resources.`,
  }
}

export async function getCategoryArticleMetadata(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  categoryLabel: string
) {
  await ensureContentLoaded()

  const article = getArticleById(categoryId, subcategoryId, articleId)
  const subcategory = getSubcategoryById(categoryId, subcategoryId)

  return {
    title: article
      ? `${article.title} - ${subcategory?.title ?? categoryLabel} - SaferU`
      : `${categoryLabel} - SaferU`,
    description: article?.description || `${categoryLabel} tips and resources.`,
  }
}
