import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"
import { ArticlesListClient } from "./articles-list-client"

export default function ArticlesPage() {
  const allArticles = getAllCategories({ includeUnpublished: true }).flatMap(category =>
    category.subcategories.flatMap(subcategory =>
      subcategory.articles.map(article => ({
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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Articles</h1>
          <p className="mt-1 text-gray-500">
            {allArticles.length} articles across all categories
          </p>
        </div>
        <Button asChild className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
          <Link href="/admin/articles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      <ArticlesListClient articles={allArticles} />
    </div>
  )
}
