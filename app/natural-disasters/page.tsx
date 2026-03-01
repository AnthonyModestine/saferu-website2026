import { CategoryPage } from "@/components/category-page"
import { getPostPacksByCategory } from "@/lib/data/post-packs"
import { AlertTriangle } from "lucide-react"

export const metadata = {
  title: "Natural Disasters - SaferU",
  description: "Natural disaster preparedness and response resources.",
}

export default function NaturalDisastersPage() {
  const packs = getPostPacksByCategory("natural-disasters")

  return (
    <CategoryPage
      title="Natural Disasters"
      description="Emergency preparedness content for earthquakes, floods, and other natural disasters."
      icon={AlertTriangle}
      iconColor="text-destructive"
      packs={packs}
    />
  )
}
