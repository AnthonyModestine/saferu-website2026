"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PostPackCard } from "@/components/post-pack-card"
import { PostPackModal } from "@/components/post-pack-modal"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, AlertTriangle } from "lucide-react"
import type { PostPack } from "@/lib/data/post-packs"

const ICON_MAP = { AlertTriangle } as const
type IconName = keyof typeof ICON_MAP

interface CategoryPageProps {
  title: string
  description: string
  iconName: IconName
  iconColor: string
  packs: PostPack[]
}

export function CategoryPage({
  title,
  description,
  iconName,
  iconColor,
  packs,
}: CategoryPageProps) {
  const Icon = ICON_MAP[iconName]
  const [selectedPack, setSelectedPack] = useState<PostPack | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = [...new Set(packs.flatMap((pack) => pack.tags))]

  const filteredPacks = packs.filter((pack) => {
    const matchesSearch =
      pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || pack.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const handleOpenPack = (pack: PostPack) => {
    setSelectedPack(pack)
    setModalOpen(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg bg-primary/10 p-3 ${iconColor}`}>
                {Icon && <Icon className="h-8 w-8" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                <p className="mt-1 text-muted-foreground">{description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="border-b border-border bg-background py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedTag === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </Badge>
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Post Packs Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filteredPacks.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPacks.map((pack) => (
                  <PostPackCard
                    key={pack.id}
                    pack={pack}
                    onOpenPack={handleOpenPack}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No posts found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      <PostPackModal
        pack={selectedPack}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
