import { getAllCategories } from "@/lib/content-merged"
import { getArticlePublicPath } from "@/lib/category-layout"

/** Flat list of all published article paths for analytics unused-articles comparison. */
export function getAllArticlePaths(): { path: string; title: string; category: string }[] {
  const paths: { path: string; title: string; category: string }[] = []
  const categories = getAllCategories()

  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      for (const article of sub.articles) {
        paths.push({
          path: getArticlePublicPath(cat.id, sub.id, article.id),
          title: article.title,
          category: cat.title,
        })
      }
    }
  }

  return paths
}
