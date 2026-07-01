import {
  renderCategoryArticlePage,
  getCategoryArticleMetadata,
} from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ subcategory: string; article: string }>
}

const CATEGORY_ID = "natural-disaster"
const CATEGORY_LABEL = "Natural Disaster"

export async function generateMetadata({ params }: Props) {
  const { subcategory, article } = await params
  return getCategoryArticleMetadata(CATEGORY_ID, subcategory, article, CATEGORY_LABEL)
}

export default async function NaturalDisasterArticlePage({ params }: Props) {
  const { subcategory, article } = await params
  return renderCategoryArticlePage(CATEGORY_ID, subcategory, article)
}
