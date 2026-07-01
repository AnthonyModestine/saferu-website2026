import {
  renderCategorySlugPage,
  getCategorySlugMetadata,
} from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ subcategory: string }>
}

const CATEGORY_ID = "weather-preparedness"
const CATEGORY_LABEL = "Weather Preparedness"

export async function generateMetadata({ params }: Props) {
  const { subcategory } = await params
  return getCategorySlugMetadata(CATEGORY_ID, subcategory, CATEGORY_LABEL)
}

export default async function WeatherPreparednessSlugPage({ params }: Props) {
  const { subcategory } = await params
  return renderCategorySlugPage(CATEGORY_ID, subcategory)
}
