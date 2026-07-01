import {
  renderCategoryArticlePage,
  getCategoryArticleMetadata,
} from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

const CATEGORY_ID = "weather-preparedness"
const CATEGORY_LABEL = "Weather Preparedness"

export async function generateMetadata({ params }: Props) {
  const { subcategory, article } = await params
  return getCategoryArticleMetadata(CATEGORY_ID, subcategory, article, CATEGORY_LABEL)
}

export default async function WeatherPreparednessArticlePage({ params }: Props) {
  const { subcategory, article } = await params
  return renderCategoryArticlePage(CATEGORY_ID, subcategory, article)
}
