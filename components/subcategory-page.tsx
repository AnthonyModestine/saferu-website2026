"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChevronRight, Home, Car, Shield, AlertTriangle, TrafficCone, MoreHorizontal, Flame, DoorOpen, CloudLightning, Thermometer, Snowflake, Activity, Waves, Users, Baby, Heart, Calendar, Bell, ShieldCheck, Star, ArrowRight } from "lucide-react"
import type { Category } from "@/lib/data/content-library"
import { getCategoryAccent } from "@/lib/category-accents"
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

export function SubcategoryPage({ category }: SubcategoryPageProps) {
  const CategoryIcon = categoryIconMap[category.id] || Shield
  const accent = getCategoryAccent(category.id)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-[#F0F4F8]">
        {/* Page header */}
        <section className="border-b border-[#E2E8F5] bg-white py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#5c6b85]" aria-label="Breadcrumb">
              <Link href="/templates" className="transition-colors hover:text-[#1A365D]">
                Content Library
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-[#1A365D]">{category.title}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accent }}
              >
                <CategoryIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1A365D] sm:text-4xl">
                  {category.title}
                </h1>
                <p className="mt-1 text-[#42536e]">{category.description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Topics grid */}
        <section className="py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-xl font-bold text-[#1A365D]">Choose a topic</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {category.subcategories.map((subcategory) => {
                const SubIcon = iconMap[subcategory.icon] || Home
                return (
                  <Link
                    key={subcategory.id}
                    href={`/${category.id}/${subcategory.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${accent}1A`, color: accent }}
                        >
                          <SubIcon className="h-5 w-5" />
                        </div>
                        <h3 className="flex-1 text-lg font-bold leading-snug text-[#1A365D] transition-colors group-hover:text-[#1470AF]">
                          {subcategory.title}
                        </h3>
                        <ArrowRight className="h-5 w-5 shrink-0 text-[#8a99b0] transition-all group-hover:translate-x-0.5 group-hover:text-[#1470AF]" />
                      </div>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#42536e]">
                        {subcategory.description}
                      </p>
                      <p className="mt-3 text-xs font-medium text-[#5c6b85]">
                        {subcategory.articles.length}{" "}
                        {subcategory.articles.length === 1 ? "article" : "articles"}
                      </p>
                    </div>
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
