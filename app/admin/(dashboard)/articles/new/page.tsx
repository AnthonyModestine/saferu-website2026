import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"
import { NewArticleForm } from "./new-article-form"

export const dynamic = "force-dynamic"

export default async function NewArticlePage() {
  await ensureContentLoaded()
  const categories = getAllCategories({ includeUnpublished: true })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="bg-transparent">
          <Link href="/admin/articles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Article</h1>
          <p className="mt-1 text-gray-500">
            Create a new article and add social media posts to it
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <NewArticleForm categories={categories} />
      </div>
    </div>
  )
}
