import Link from "next/link"
import { getUnpublishedArticleTriples } from "@/lib/content-visibility"
import { getCategoryById, getArticle } from "@/lib/content-merged"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Send } from "lucide-react"
import { UnpublishedListClient } from "./unpublished-list-client"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"

export default async function UnpublishedPage() {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
  const triples = getUnpublishedArticleTriples()
  const items = triples.map(({ categoryId, subcategoryId, articleId }) => {
    const category = getCategoryById(categoryId, { includeUnpublished: true })
    const article = getArticle(categoryId, subcategoryId, articleId, { includeUnpublished: true })
    const subcategory = category?.subcategories.find((s) => s.id === subcategoryId)
    return {
      categoryId,
      subcategoryId,
      articleId,
      categoryTitle: category?.title ?? categoryId,
      subcategoryTitle: subcategory?.title ?? subcategoryId,
      articleTitle: article?.title ?? articleId,
    }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Drafts</h1>
        <p className="mt-1 text-gray-500">
          Articles that are not live on the site. New articles start here until you publish them.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft articles</CardTitle>
          <CardDescription>
            {items.length === 0
              ? "No drafts right now."
              : `${items.length} draft article${items.length !== 1 ? "s" : ""} — not visible to members until published.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">
              Unpublish an article from any category to see it here. Then use Publish to push it live again.
            </p>
          ) : (
            <UnpublishedListClient items={items} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
