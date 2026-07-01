import { renderCategoryIndexPage } from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Weather Preparedness - SaferU",
  description: "Stay safe during severe weather events and seasonal conditions.",
}

export default async function WeatherPreparednessPage() {
  return renderCategoryIndexPage("weather-preparedness")
}
