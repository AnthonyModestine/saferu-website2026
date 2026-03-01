"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Star, Flame, ChevronRight, Lock, CloudLightning, AlertTriangle, Users } from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"
import type { LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

const colorMap: Record<string, string> = {
  "crime-prevention": "bg-[#1470AF]",
  "fire-prevention": "bg-[#e07c3e]",
  "whats-new": "bg-[#f2b233]",
  "weather-preparedness": "bg-[#5b7a9d]",
  "natural-disaster": "bg-[#c44d4d]",
  "community-awareness": "bg-[#4a9d6b]",
}

const hrefMap: Record<string, string> = {
  "crime-prevention": "/crime-prevention",
  "fire-prevention": "/fire-prevention",
  "whats-new": "/whats-new",
  "weather-preparedness": "/weather-preparedness",
  "natural-disaster": "/natural-disaster",
  "community-awareness": "/community-awareness",
}

export default function TemplatesPage() {
  const categories = getAllCategories()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#f0f4f8]">
        {/* Hero Section */}
        <section className="bg-[#1a365d] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Content Library
              </h1>
              <p className="mt-4 text-lg text-[#a0c4e8] max-w-2xl mx-auto">
                Browse our curated collection of safety templates. Copy-ready social media posts 
                with professional graphics for your community outreach.
              </p>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const Icon = iconMap[category.id] || ShieldCheck
                const bgColor = colorMap[category.id] || "bg-[#1470AF]"
                const href = hrefMap[category.id] || `/${category.id}`
                const isMembersOnly = category.id === "whats-new"
                
                // Count total articles and posts
                const totalArticles = category.subcategories.reduce((sum, sub) => sum + sub.articles.length, 0)
                const totalPosts = category.subcategories.reduce((sum, sub) => 
                  sum + sub.articles.reduce((aSum, article) => aSum + article.posts.length, 0), 0
                )

                return (
                  <Card 
                    key={category.id}
                    className="relative flex flex-col overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow bg-white h-full"
                  >
                    {isMembersOnly && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1470AF]/10 px-2 py-1 text-xs font-medium text-[#1470AF]">
                          <Lock className="h-3 w-3" />
                          Members
                        </span>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center mb-4`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-[#1a365d]">
                        {category.title}
                      </CardTitle>
                      <CardDescription className="text-[#4a5568] min-h-[40px]">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex-1 flex flex-col">
                      {/* Stats */}
                      <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                        <span>{category.subcategories.length} sections</span>
                        <span>{totalArticles} articles</span>
                        <span>{totalPosts} posts</span>
                      </div>
                      
                      {/* Subcategories */}
                      <div className="mb-4 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Includes
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {category.subcategories.slice(0, 4).map((sub) => (
                            <span 
                              key={sub.id}
                              className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground"
                            >
                              {sub.title}
                            </span>
                          ))}
                          {category.subcategories.length > 4 && (
                            <span className="text-xs bg-muted px-2 py-1 rounded-md text-muted-foreground">
                              +{category.subcategories.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button asChild className="w-full bg-[#1a365d] hover:bg-[#1a365d]/90 text-white mt-auto">
                        <Link href={href}>
                          Browse Templates
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
