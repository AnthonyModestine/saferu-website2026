"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, ArrowLeft, FileText, ShieldCheck, Flame, Star, CloudLightning, AlertTriangle, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Subcategory, Category } from "@/lib/data/content-library"
import type { LucideIcon } from "lucide-react"

const categoryIconMap: Record<string, LucideIcon> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

interface ArticlesPageProps {
  category: Category
  subcategory: Subcategory
  iconColor: string
}

export function ArticlesPage({ category, subcategory, iconColor }: ArticlesPageProps) {
  const CategoryIcon = categoryIconMap[category.id] || Shield
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb & Header */}
        <section className="border-b border-border bg-muted/30 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href={`/${category.id}`} className="hover:text-foreground transition-colors">
                {category.title}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{subcategory.title}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`rounded-lg bg-primary/10 p-3 ${iconColor}`}>
                <CategoryIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{subcategory.title}</h1>
                <p className="mt-1 text-muted-foreground">{subcategory.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Articles List */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Articles</h2>
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <Link href={`/${category.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {category.title}
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subcategory.articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${category.id}/${subcategory.id}/${article.id}`}
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
                        {article.posts.length} {article.posts.length === 1 ? 'post' : 'posts'} available
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
