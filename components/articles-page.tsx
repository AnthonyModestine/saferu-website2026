"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { ChevronRight, ArrowLeft, ShieldCheck, Flame, Star, CloudLightning, AlertTriangle, Users, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContentLibraryEmpty } from "@/components/content-library-empty"
import type { Subcategory, Category } from "@/lib/data/content-library"
import { getCategoryAccent } from "@/lib/category-accents"
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

export function ArticlesPage({ category, subcategory }: ArticlesPageProps) {
  const CategoryIcon = categoryIconMap[category.id] || Shield
  const accent = getCategoryAccent(category.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#F0F4F8]">
        {/* Breadcrumb & page header */}
        <section className="border-b border-[#E2E8F5] bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#5c6b85]" aria-label="Breadcrumb">
              <Link href="/templates" className="transition-colors hover:text-[#1A365D]">
                Content Library
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href={`/${category.id}`} className="transition-colors hover:text-[#1A365D]">
                {category.title}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-[#1A365D]">{subcategory.title}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accent }}
              >
                <CategoryIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1A365D] sm:text-3xl">
                  {subcategory.title}
                </h1>
                <p className="mt-1 text-[#42536e]">{subcategory.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Articles grid */}
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#1A365D]">Articles</h2>
                <p className="mt-0.5 text-sm text-[#5c6b85]">
                  {subcategory.articles.length}{" "}
                  {subcategory.articles.length === 1 ? "topic" : "topics"} ready to browse
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-[#5c6b85] hover:text-[#1A365D]"
              >
                <Link href={`/${category.id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to {category.title}
                </Link>
              </Button>
            </div>

            {subcategory.articles.length === 0 ? (
              <ContentLibraryEmpty
                title="Check back soon"
                description="Articles for this section are being prepared. Please check back later."
                actionHref={`/${category.id}`}
                actionLabel={`Browse ${category.title}`}
              />
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {subcategory.articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    href={`/${category.id}/${subcategory.id}/${article.id}`}
                    accent={accent}
                  />
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
