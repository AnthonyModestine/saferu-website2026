import { getAllCategories } from "@/lib/content-merged"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"
import { TemplatesPageClient } from "./templates-client"

export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  await ensureContentLoaded()
  const categories = getAllCategories()
  return <TemplatesPageClient categories={categories} />
}
