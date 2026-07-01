import { renderCategoryIndexPage } from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Community Awareness - SaferU",
  description: "Build stronger, safer neighborhoods through awareness and engagement.",
}

export default async function CommunityAwarenessPage() {
  return renderCategoryIndexPage("community-awareness")
}
