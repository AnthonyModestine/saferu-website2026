import {
  renderCategorySlugPage,
  getCategorySlugMetadata,
} from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ subcategory: string }>
}

const CATEGORY_ID = "natural-disaster"
const CATEGORY_LABEL = "Natural Disaster"

export async function generateMetadata({ params }: Props) {
  const { subcategory } = await params
  return getCategorySlugMetadata(CATEGORY_ID, subcategory, CATEGORY_LABEL)
}

export default async function NaturalDisasterSlugPage({ params }: Props) {
  const { subcategory } = await params
  return renderCategorySlugPage(CATEGORY_ID, subcategory)
}
