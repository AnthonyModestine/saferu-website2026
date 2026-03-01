import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, ChevronRight, FileText } from "lucide-react"
import { getCategoryById, getSubcategory } from "@/lib/content-merged"
import { isArticlePublished } from "@/lib/content-visibility"
import { ArticleListOrder } from "@/components/admin/article-list-order"

interface PageProps {
  params: Promise<{
    category: string
    subcategory: string
  }>
}

export default async function SubcategoryDetailPage({ params }: PageProps) {
  const { category: categoryId, subcategory: subcategoryId } = await params
  
  const category = getCategoryById(categoryId, { includeUnpublished: true })
  const subcategory = getSubcategory(categoryId, subcategoryId, { includeUnpublished: true })

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/categories" className="hover:text-gray-900">Categories</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/categories/${categoryId}`} className="hover:text-gray-900">
          {category.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{subcategory.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="bg-transparent">
            <Link href={`/admin/categories/${categoryId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{subcategory.title}</h1>
            <p className="mt-1 text-gray-500">{subcategory.description}</p>
          </div>
        </div>
        <Button asChild className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
          <Link href={`/admin/articles/new?category=${categoryId}&subcategory=${subcategoryId}`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Article
          </Link>
        </Button>
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            {subcategory.articles.length} article{subcategory.articles.length !== 1 ? "s" : ""} in this subcategory
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {subcategory.articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No articles yet</h3>
              <p className="mt-1 text-gray-500">Create your first article for this subcategory.</p>
              <Button asChild className="mt-4 bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
                <Link href={`/admin/articles/new?category=${categoryId}&subcategory=${subcategoryId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Article
                </Link>
              </Button>
            </div>
          ) : (
            <ArticleListOrder
              categoryId={categoryId}
              subcategoryId={subcategoryId}
              articles={subcategory.articles}
              publishedByArticleId={Object.fromEntries(
                subcategory.articles.map((a) => [
                  a.id,
                  isArticlePublished(categoryId, subcategoryId, a.id),
                ])
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
