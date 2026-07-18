"use client"

import { useState, useEffect } from "react"
import { Star, Lock, FileText, Bell, Sparkles } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArticleCard } from "@/components/article-card"
import Link from "next/link"
import { useMemberSession } from "@/lib/use-member-session"
import type { Article } from "@/lib/data/content-library"

interface WhatsNewClientProps {
  categoryTitle: string
  categoryDescription: string
  articles: Article[]
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

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-[#F0F4F8]">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F2B233]/20">
              <Lock className="h-8 w-8 text-[#C3880B]" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl">
              Weekly content for SaferU members
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#42536e]">
              What&apos;s New brings together fresh seasonal content and timely safety topics. Free
              members receive access to new graphics and captions added each week.
            </p>

            <Card className="mt-10 rounded-2xl border-[#E2E8F5] text-left shadow-sm">
              <CardHeader>
                <CardTitle>Free Membership Includes</CardTitle>
                <CardDescription>Create a free account to access</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-[#42536e]">
                    <Sparkles className="h-5 w-5 text-[#f2b233]" />
                    <span>Latest seasonal safety templates</span>
                  </li>
                  <li className="flex items-center gap-3 text-[#42536e]">
                    <Bell className="h-5 w-5 text-[#f2b233]" />
                    <span>Timely alerts and trending topics</span>
                  </li>
                  <li className="flex items-center gap-3 text-[#42536e]">
                    <FileText className="h-5 w-5 text-[#f2b233]" />
                    <span>New content added weekly</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
              >
                <Link href={`/sign-up?returnUrl=${encodeURIComponent("/whats-new")}`}>Create Free Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent">
                <Link href={`/sign-in?returnUrl=${encodeURIComponent("/whats-new")}`}>Sign In</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#F0F4F8]">
        <section className="border-b border-[#E2E8F5] bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-5 flex items-center gap-2 text-sm text-[#5c6b85]">
              <Link href="/templates" className="transition-colors hover:text-[#1A365D]">
                Content Library
              </Link>
              <span>/</span>
              <span className="font-medium text-[#1A365D]">What&apos;s New</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F2B233]">
                <Star className="h-7 w-7 text-[#1A365D]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B77908]">
                  New content added weekly
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl">{categoryTitle}</h1>
                <p className="mt-1 text-[#42536e]">{categoryDescription}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-xl font-bold text-[#1A365D]">Latest content</h2>
            {articles.length === 0 ? (
              <div className="mx-auto max-w-md rounded-2xl border border-[#E2E8F5] bg-white p-10 text-center shadow-sm">
                <FileText className="mx-auto h-8 w-8 text-[#5c6b85]" />
                <h3 className="mt-4 text-lg font-bold text-[#1A365D]">No new content right now.</h3>
                <p className="mt-2 text-sm text-[#42536e]">
                  New member content is added weekly. Browse the public library in the meantime.
                </p>
                <Button asChild className="mt-6 bg-[#1A365D] text-white hover:bg-[#1A365D]/90">
                  <Link href="/templates">Browse Content Library</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    href={`/whats-new/${article.id}`}
                    accent="#F2B233"
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
