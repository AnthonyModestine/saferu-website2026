"use client"

import { useState, useEffect } from "react"
import { Star, Lock, FileText, Bell, Sparkles, ChevronRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getCategoryById } from "@/lib/content-merged"
import { useMemberSession } from "@/lib/use-member-session"

export default function WhatsNewPage() {
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
        <main className="flex-1 bg-gradient-to-b from-background to-muted/30">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f2b233]/20">
              <Lock className="h-10 w-10 text-[#f2b233]" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
              Members Only Content
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The What&apos;s New section contains our latest templates, seasonal content, and timely updates exclusively for SaferU members.
            </p>
            
            <Card className="mt-10 text-left">
              <CardHeader>
                <CardTitle>Free Membership Includes</CardTitle>
                <CardDescription>Create a free account to access</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-[#f2b233]" />
                    <span>Latest seasonal safety templates</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#f2b233]" />
                    <span>Timely alerts and trending topics</span>
                  </li>
                  <li className="flex items-center gap-3">
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
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-transparent"
              >
                <Link href={`/sign-in?returnUrl=${encodeURIComponent("/whats-new")}`}>Sign In</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const category = getCategoryById("whats-new")
  if (!category || !category.subcategories.length) {
    return null
  }

  // What's New has no subcategory UI — show articles directly from the single "latest" subcategory
  const articles = category.subcategories[0].articles

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-[#f2b233]">
                <Star className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#1a365d]">{category.title}</h1>
                <p className="mt-1 text-muted-foreground">{category.description}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-[#1a365d] mb-6">Articles</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link key={article.id} href={`/whats-new/${article.id}`}>
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
                        {article.posts.length} {article.posts.length === 1 ? "post" : "posts"} available
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
