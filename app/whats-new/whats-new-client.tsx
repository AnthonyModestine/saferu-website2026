"use client"

import { useState, useEffect } from "react"
import { Star, Lock, ChevronRight, ArrowRight, FileText } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ContentLibraryEmpty } from "@/components/content-library-empty"
import Link from "next/link"
import { useMemberSession } from "@/lib/use-member-session"
import { getCategoryAccent } from "@/lib/category-accents"
import type { Article } from "@/lib/data/content-library"

interface WhatsNewClientProps {
  categoryTitle: string
  categoryDescription: string
  articles: Article[]
}

function WhatsNewShell({
  categoryTitle,
  categoryDescription,
  children,
}: {
  categoryTitle: string
  categoryDescription: string
  children: React.ReactNode
}) {
  const accent = getCategoryAccent("whats-new")

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#F0F4F8]">
        <section className="border-b border-[#E2E8F5] bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav
              className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#5c6b85]"
              aria-label="Breadcrumb"
            >
              <Link href="/templates" className="transition-colors hover:text-[#1A365D]">
                Content Library
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-[#1A365D]">{categoryTitle}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accent }}
              >
                <Star className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl">
                  {categoryTitle}
                </h1>
                <p className="mt-1 text-[#42536e]">{categoryDescription}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export function WhatsNewClient({
  categoryTitle,
  categoryDescription,
  articles,
}: WhatsNewClientProps) {
  const { member, isLoading } = useMemberSession()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isSignedIn = !!member
  const accent = getCategoryAccent("whats-new")

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-[#F0F4F8]">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <WhatsNewShell
        categoryTitle={categoryTitle}
        categoryDescription={categoryDescription}
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#E2E8F5] bg-white px-6 py-10 text-center shadow-sm sm:px-10">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}22` }}
          >
            <Lock className="h-6 w-6" style={{ color: accent }} />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-[#1A365D]">
            Members only
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#42536e]">
            Sign in with your free SaferU account to browse this week&apos;s seasonal graphics and
            captions.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-[#f2b233] font-semibold text-[#1a365d] hover:bg-[#f2b233]/90"
            >
              <Link href={`/sign-up?returnUrl=${encodeURIComponent("/whats-new")}`}>
                Create Free Account
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link href={`/sign-in?returnUrl=${encodeURIComponent("/whats-new")}`}>Sign In</Link>
            </Button>
          </div>
        </div>
      </WhatsNewShell>
    )
  }

  return (
    <WhatsNewShell categoryTitle={categoryTitle} categoryDescription={categoryDescription}>
      <h2 className="mb-6 text-xl font-bold text-[#1A365D]">Choose a topic</h2>
      {articles.length === 0 ? (
        <ContentLibraryEmpty
          title="Check back soon"
          description="New member graphics are added weekly. Please check back later, or browse the public Content Library in the meantime."
          actionHref="/templates"
          actionLabel="Browse Content Library"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const postCount = article.posts.length
            return (
              <Link
                key={article.id}
                href={`/whats-new/${article.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="flex-1 text-lg font-bold leading-snug text-[#1A365D] transition-colors group-hover:text-[#1470AF]">
                      {article.title}
                    </h3>
                    <ArrowRight className="h-5 w-5 shrink-0 text-[#8a99b0] transition-all group-hover:translate-x-0.5 group-hover:text-[#1470AF]" />
                  </div>
                  {article.description ? (
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-[#42536e] line-clamp-3">
                      {article.description}
                    </p>
                  ) : (
                    <div className="mt-3 flex-1" />
                  )}
                  <p className="mt-3 text-xs font-medium text-[#5c6b85]">
                    {postCount} {postCount === 1 ? "post" : "posts"}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </WhatsNewShell>
  )
}
