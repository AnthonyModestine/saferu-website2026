import { getAllCategories } from "@/lib/content-merged"

/** Flat list of all published article paths for analytics unused-articles comparison. */
export function getAllArticlePaths(): { path: string; title: string; category: string }[] {
  const paths: { path: string; title: string; category: string }[] = []
  const categories = getAllCategories()

  for (const cat of categories) {
    if (cat.id === "whats-new") {
      for (const sub of cat.subcategories) {
        for (const article of sub.articles) {
          paths.push({
            path: `/whats-new/${article.id}`,
            title: article.title,
            category: cat.title,
          })
        }
      }
      continue
    }
    for (const sub of cat.subcategories) {
      for (const article of sub.articles) {
        paths.push({
          path: `/${cat.id}/${sub.id}/${article.id}`,
          title: article.title,
          category: cat.title,
        })
      }
    }
  }

  return paths
}
