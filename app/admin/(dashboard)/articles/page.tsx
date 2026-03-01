import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Plus,
  FileText,
  ImageIcon,
  ChevronRight,
  Search
} from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"

export default function ArticlesPage() {
  // Flatten all articles from the content library
  const allArticles = getAllCategories({ includeUnpublished: true }).flatMap(category =>
    category.subcategories.flatMap(subcategory =>
      subcategory.articles.map(article => ({
        ...article,
        categoryId: category.id,
        categoryTitle: category.title,
        subcategoryId: subcategory.id,
        subcategoryTitle: subcategory.title,
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

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input 
          placeholder="Search articles..." 
          className="pl-10 bg-white"
        />
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            Click an article to view and edit its posts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {allArticles.map((article) => (
              <Link
                key={`${article.categoryId}-${article.subcategoryId}-${article.id}`}
                href={`/admin/articles/${article.categoryId}/${article.subcategoryId}/${article.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{article.title}</p>
                    <p className="text-sm text-gray-500">{article.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {article.categoryTitle}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {article.subcategoryTitle}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {article.posts.length} post{article.posts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
