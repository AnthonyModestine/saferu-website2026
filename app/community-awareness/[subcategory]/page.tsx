import {
  renderCategorySlugPage,
  getCategorySlugMetadata,
} from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ subcategory: string }>
}

const CATEGORY_ID = "community-awareness"
const CATEGORY_LABEL = "Community Awareness"

export async function generateMetadata({ params }: Props) {
  const { subcategory } = await params
  return getCategorySlugMetadata(CATEGORY_ID, subcategory, CATEGORY_LABEL)
}

export default async function CommunityAwarenessSlugPage({ params }: Props) {
  const { subcategory } = await params
  return renderCategorySlugPage(CATEGORY_ID, subcategory)
}
