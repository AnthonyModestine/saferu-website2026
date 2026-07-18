"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  ShieldCheck,
  Star,
  Flame,
  ArrowRight,
  Lock,
  CloudLightning,
  AlertTriangle,
  Users,
  Search,
  X,
} from "lucide-react"
import type { Category } from "@/lib/data/content-library"
import type { LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

/** Category accent colors per docs/SAFERU-UI-UX.md §4 */
const accentMap: Record<string, string> = {
  "crime-prevention": "#1470AF",
  "fire-prevention": "#E07C3E",
  "whats-new": "#F2B233",
  "weather-preparedness": "#5B7A9D",
  "natural-disaster": "#C44D4D",
  "community-awareness": "#4A9D6B",
}

const hrefMap: Record<string, string> = {
  "crime-prevention": "/crime-prevention",
  "fire-prevention": "/fire-prevention",
  "whats-new": "/whats-new",
  "weather-preparedness": "/weather-preparedness",
  "natural-disaster": "/natural-disaster",
  "community-awareness": "/community-awareness",
}

interface SearchResult {
  categoryId: string
  categoryTitle: string
  subcategoryTitle: string
  articleTitle: string
  articleDescription: string
  postCount: number
  href: string
  membersOnly: boolean
}

function buildArticleHref(categoryId: string, subcategoryId: string, articleId: string): string {
  const base = hrefMap[categoryId] || `/${categoryId}`
  // What's New articles live directly under /whats-new without a subcategory segment
  if (categoryId === "whats-new") return `${base}/${articleId}`
  return `${base}/${subcategoryId}/${articleId}`
}

export function TemplatesPageClient({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("")

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const matches: SearchResult[] = []
    for (const category of categories) {
      for (const sub of category.subcategories) {
        for (const article of sub.articles) {
          const haystack =
            `${article.title} ${article.description} ${sub.title} ${category.title}`.toLowerCase()
          if (haystack.includes(q)) {
            matches.push({
              categoryId: category.id,
              categoryTitle: category.title,
              subcategoryTitle: sub.title,
              articleTitle: article.title,
              articleDescription: article.description,
              postCount: article.posts.length,
              href: buildArticleHref(category.id, sub.id, article.id),
              membersOnly: category.id === "whats-new",
            })
          }
        }
      }
    }
    return matches
  }, [query, categories])

  const searching = query.trim().length >= 2

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#F0F4F8]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0B1B3A] py-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-[#F2B233]/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F2B233]">
                Free for public safety agencies
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Public Safety Content Library
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-[#b8c7e0]">
                Browse ready-to-share safety graphics and captions for your agency or community —
                curated, professional, and free to use.
              </p>

              <div className="relative mx-auto mt-8 max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5c6b85]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search safety content — vehicle theft, heat safety, scams…"
                  aria-label="Search safety content"
                  className="w-full rounded-xl border border-white/10 bg-white py-3.5 pl-12 pr-12 text-base text-[#0B1B3A] shadow-lg placeholder:text-[#8a99b0] focus:outline-none focus:ring-2 focus:ring-[#F2B233]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#5c6b85] transition-colors hover:text-[#0B1B3A]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {searching ? (
          /* Search results */
          <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {results.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-[#42536e]">
                    {results.length} {results.length === 1 ? "result" : "results"} for{" "}
                    <span className="font-semibold text-[#1A365D]">&ldquo;{query.trim()}&rdquo;</span>
                  </p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((result) => {
                      const accent = accentMap[result.categoryId] || "#1470AF"
                      return (
                        <Link
                          key={result.href}
                          href={result.href}
                          className="group flex flex-col rounded-2xl border border-[#E2E8F5] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                              style={{ backgroundColor: accent }}
                            >
                              {result.categoryTitle}
                            </span>
                            {result.membersOnly && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#1470AF]/10 px-2 py-1 text-xs font-medium text-[#1470AF]">
                                <Lock className="h-3 w-3" />
                                Members
                              </span>
                            )}
                          </div>
                          <h3 className="mt-4 text-lg font-bold leading-snug text-[#1A365D] group-hover:text-[#1470AF]">
                            {result.articleTitle}
                          </h3>
                          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[#42536e]">
                            {result.articleDescription}
                          </p>
                          <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F5] pt-4 text-sm">
                            <span className="text-[#5c6b85]">
                              {result.subcategoryTitle}
                              {result.postCount > 0 &&
                                ` · ${result.postCount} ${result.postCount === 1 ? "post" : "posts"}`}
                            </span>
                            <ArrowRight className="h-4 w-4 text-[#1470AF] transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              ) : (
                /* Empty state per docs/SAFERU-UI-UX.md §28 */
                <div className="mx-auto max-w-md rounded-2xl border border-[#E2E8F5] bg-white p-10 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F4F8]">
                    <Search className="h-6 w-6 text-[#5c6b85]" />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-[#1A365D]">
                    No safety content matched your search.
                  </h2>
                  <p className="mt-2 text-sm text-[#42536e]">
                    Try a broader term like scams, fire prevention, or severe weather — or browse by
                    category.
                  </p>
                  <Button
                    onClick={() => setQuery("")}
                    className="mt-6 rounded-xl bg-[#1A365D] px-6 font-semibold text-white hover:bg-[#1A365D]/90"
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </section>
        ) : (
          /* Category grid */
          <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1A365D] sm:text-3xl">
                    Browse by category
                  </h2>
                  <p className="mt-2 text-[#42536e]">
                    Every category includes graphics and ready-to-share captions.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => {
                  const Icon = iconMap[category.id] || ShieldCheck
                  const accent = accentMap[category.id] || "#1470AF"
                  const href = hrefMap[category.id] || `/${category.id}`
                  const isMembersOnly = category.id === "whats-new"

                  const totalArticles = category.subcategories.reduce(
                    (sum, sub) => sum + sub.articles.length,
                    0
                  )
                  const totalPosts = category.subcategories.reduce(
                    (sum, sub) =>
                      sum + sub.articles.reduce((aSum, article) => aSum + article.posts.length, 0),
                    0
                  )

                  return (
                    <div
                      key={category.id}
                      className="relative flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
                      {isMembersOnly && (
                        <div className="absolute right-4 top-6 z-10">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#1470AF]/10 px-2 py-1 text-xs font-medium text-[#1470AF]">
                            <Lock className="h-3 w-3" />
                            Members
                          </span>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-6">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl"
                          style={{ backgroundColor: accent }}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-[#1A365D]">{category.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#42536e]">
                          {category.description}
                        </p>

                        <div className="mt-4 flex gap-4 text-xs font-medium text-[#5c6b85]">
                          <span>{category.subcategories.length} sections</span>
                          <span>{totalArticles} articles</span>
                          <span>{totalPosts} posts</span>
                        </div>

                        <div className="mt-4 flex-1">
                          <div className="flex flex-wrap gap-2">
                            {category.subcategories.slice(0, 4).map((sub) => (
                              <span
                                key={sub.id}
                                className="rounded-full border border-[#E2E8F5] bg-[#F0F4F8] px-2.5 py-1 text-xs text-[#42536e]"
                              >
                                {sub.title}
                              </span>
                            ))}
                            {category.subcategories.length > 4 && (
                              <span className="rounded-full border border-[#E2E8F5] bg-[#F0F4F8] px-2.5 py-1 text-xs text-[#42536e]">
                                +{category.subcategories.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          asChild
                          className="mt-6 w-full rounded-xl bg-[#1A365D] font-semibold text-white hover:bg-[#1A365D]/90"
                        >
                          <Link href={href}>
                            Browse {category.title}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
