import React from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChevronRight, 
  ArrowLeft,
  Plus,
  ShieldCheck,
  Flame,
  Star,
  CloudLightning,
  AlertTriangle,
  Users
} from "lucide-react"
import { getCategoryById } from "@/lib/content-merged"
import { SubcategoryListOrder } from "@/components/admin/subcategory-list-order"

const categoryIcons: Record<string, React.ElementType> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

interface PageProps {
  params: Promise<{
    category: string
  }>
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { category: categoryId } = await params
  
  const category = getCategoryById(categoryId, { includeUnpublished: true })

  if (!category) {
    notFound()
  }

  const Icon = categoryIcons[category.id] || FolderOpen

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/categories" className="hover:text-gray-900">Categories</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{category.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="bg-transparent">
            <Link href="/admin/categories">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1470AF]">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.title}</h1>
            <p className="mt-1 text-gray-500">{category.description}</p>
          </div>
        </div>
        {categoryId !== "whats-new" && (
          <Button asChild className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
            <Link href={`/admin/categories/${categoryId}/add-subcategory`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subcategory
            </Link>
          </Button>
        )}
      </div>

      {/* Subcategories */}
      <Card>
        <CardHeader>
          <CardTitle>Subcategories</CardTitle>
          <CardDescription>
            {category.subcategories.length} subcategor{category.subcategories.length !== 1 ? "ies" : "y"} in {category.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SubcategoryListOrder
            categoryId={category.id}
            subcategories={category.subcategories}
          />
        </CardContent>
      </Card>
    </div>
  )
}
