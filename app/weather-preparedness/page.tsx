import { SubcategoryPage } from "@/components/subcategory-page"
import { getCategoryById } from "@/lib/content-merged"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Weather Preparedness - SaferU",
  description: "Stay safe during severe weather events and seasonal conditions.",
}

export default function WeatherPreparednessPage() {
  const category = getCategoryById("weather-preparedness")
  
  if (!category) {
    notFound()
  }

  return (
    <SubcategoryPage
      category={category}
      iconColor="text-[#5b7a9d]"
    />
  )
}
