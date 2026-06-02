import { getAllCategories } from "@/lib/content-merged"
import { isArticlePublished } from "@/lib/content-visibility"

export interface AdminPostRow {
  postId: string
  postTitle: string
  categoryId: string
  categoryTitle: string
  subcategoryId: string
  subcategoryTitle: string
  articleId: string
  articleTitle: string
  image?: string
  articlePublished: boolean
}

export function getAllPostsForAdmin(options?: { liveArticlesOnly?: boolean }): AdminPostRow[] {
  const liveOnly = options?.liveArticlesOnly ?? false
  const rows: AdminPostRow[] = []
  for (const category of getAllCategories({ includeUnpublished: true })) {
    for (const subcategory of category.subcategories) {
      for (const article of subcategory.articles) {
        const published = isArticlePublished(category.id, subcategory.id, article.id)
        if (liveOnly && !published) continue
        for (const post of article.posts) {
          rows.push({
            postId: post.id,
            postTitle: post.title,
            categoryId: category.id,
            categoryTitle: category.title,
            subcategoryId: subcategory.id,
            subcategoryTitle: subcategory.title,
            articleId: article.id,
            articleTitle: article.title,
            image: post.image,
            articlePublished: published,
          })
        }
      }
    }
  }
  return rows
}

export function articleRowKey(categoryId: string, subcategoryId: string, articleId: string) {
  return `${categoryId}::${subcategoryId}::${articleId}`
}

export function postRowKey(
  categoryId: string,
  subcategoryId: string,
  articleId: string,
  postId: string
) {
  return `${categoryId}::${subcategoryId}::${articleId}::${postId}`
}
