import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Archive } from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"
import { isArticlePublished, getUnpublishedArticleTriples } from "@/lib/content-visibility"
import { ArticlesListClient } from "./articles-list-client"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"

export default async function ArticlesPage() {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
  const liveArticles = getAllCategories({ includeUnpublished: true }).flatMap((category) =>
    category.subcategories.flatMap((subcategory) =>
      subcategory.articles
        .filter((article) =>
          isArticlePublished(category.id, subcategory.id, article.id)
        )
        .map((article) => ({
          id: article.id,
          title: article.title,
          description: article.description ?? "",
          categoryId: category.id,
          categoryTitle: category.title,
          subcategoryId: subcategory.id,
          subcategoryTitle: subcategory.title,
          posts: article.posts,
        }))
    )
  )
  const draftCount = getUnpublishedArticleTriples().length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Articles</h1>
          <p className="mt-1 text-gray-500">
            {liveArticles.length} published article{liveArticles.length !== 1 ? "s" : ""} visible on the site
          </p>
          {draftCount > 0 && (
            <p className="mt-2 text-sm text-amber-800">
              {draftCount} draft{draftCount !== 1 ? "s" : ""} in{" "}
              <Link href="/admin/unpublished" className="font-medium underline hover:text-amber-900">
                Drafts
              </Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {draftCount > 0 && (
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/admin/unpublished">
                <Archive className="mr-2 h-4 w-4" />
                Drafts ({draftCount})
              </Link>
            </Button>
          )}
          <Button asChild className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
            <Link href="/admin/articles/new">
              <Plus className="mr-2 h-4 w-4" />
              New Article
            </Link>
          </Button>
        </div>
      </div>

      <ArticlesListClient articles={liveArticles} />
    </div>
  )
}
