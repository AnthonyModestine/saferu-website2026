"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, Home, Car, Shield, AlertTriangle, TrafficCone, MoreHorizontal, Flame, DoorOpen, CloudLightning, Thermometer, Snowflake, Activity, Waves, Users, Baby, Heart, Calendar, Bell, ShieldCheck, Star } from "lucide-react"
import type { Category } from "@/lib/data/content-library"
import type { LucideIcon } from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Home,
  Car,
  Shield,
  AlertTriangle,
  TrafficCone,
  MoreHorizontal,
  Flame,
  DoorOpen,
  CloudLightning,
  Thermometer,
  Snowflake,
  Activity,
  Waves,
  Users,
  Baby,
  Heart,
  Calendar,
  Bell,
}

const categoryIconMap: Record<string, LucideIcon> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

interface SubcategoryPageProps {
  category: Category
  iconColor: string
}

export function SubcategoryPage({ category, iconColor }: SubcategoryPageProps) {
  const CategoryIcon = categoryIconMap[category.id] || Shield
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Page Header */}
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

        {/* Subcategories Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">Choose a Topic</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.subcategories.map((subcategory) => {
                const SubIcon = iconMap[subcategory.icon] || Home
                return (
                  <Link
                    key={subcategory.id}
                    href={`/${category.id}/${subcategory.id}`}
                  >
                    <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <SubIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {subcategory.title}
                            </CardTitle>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription>{subcategory.description}</CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          {subcategory.articles.length} {subcategory.articles.length === 1 ? 'article' : 'articles'}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
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
