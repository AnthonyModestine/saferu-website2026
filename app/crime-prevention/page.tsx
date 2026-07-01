import { renderCategoryIndexPage } from "@/lib/category-public-pages"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Crime Prevention - SaferU",
  description: "Crime prevention tips and resources for your community.",
}

export default async function CrimePreventionPage() {
  return renderCategoryIndexPage("crime-prevention")
}
