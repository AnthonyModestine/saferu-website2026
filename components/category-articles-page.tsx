"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, FileText, ShieldCheck, Flame, Star, CloudLightning, AlertTriangle, Users, Shield } from "lucide-react"
import type { Article, Category } from "@/lib/data/content-library"
import { getArticlePublicPath } from "@/lib/category-layout"
import type { LucideIcon } from "lucide-react"

const categoryIconMap: Record<string, LucideIcon> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

interface CategoryArticlesPageProps {
  category: Category
  articles: { article: Article; subcategoryId: string }[]
  iconColor: string
}

export function CategoryArticlesPage({
  category,
  articles,
  iconColor,
}: CategoryArticlesPageProps) {
  const CategoryIcon = categoryIconMap[category.id] || Shield

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg bg-primary/10 p-3 ${iconColor}`}>
                <CategoryIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{category.title}</h1>
                <p className="mt-1 text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">Articles</h2>
            {articles.length === 0 ? (
              <p className="text-muted-foreground">No articles yet. Check back soon.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map(({ article, subcategoryId }) => (
                  <Link
                    key={article.id}
                    href={getArticlePublicPath(category.id, subcategoryId, article.id)}
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {article.title}
                            </CardTitle>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription>{article.description}</CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          {article.posts.length}{" "}
                          {article.posts.length === 1 ? "post" : "posts"} available
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
