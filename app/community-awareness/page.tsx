import { SubcategoryPage } from "@/components/subcategory-page"
import { getCategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Community Awareness - SaferU",
  description: "Build stronger, safer neighborhoods through awareness and engagement.",
}

export default function CommunityAwarenessPage() {
  const category = getCategoryById("community-awareness")
  
  if (!category) {
    notFound()
  }

  return (
    <SubcategoryPage
      category={category}
      iconColor="text-[#4a9d6b]"
    />
  )
}
