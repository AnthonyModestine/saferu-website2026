import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FolderTree, 
  FileText, 
  ImageIcon, 
  Plus,
  ShieldCheck,
  Flame,
  Star,
  BarChart3,
  Users,
  DollarSign,
  CreditCard,
  ExternalLink
} from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"
import { getMembersCounts, getRevenueSummary } from "@/lib/admin-members"
import { getAdminMetricsDashboard } from "@/lib/admin-metrics"
import { parseDateRange } from "@/lib/pio-analytics"

export default async function AdminDashboardPage() {
  const categories = getAllCategories({ includeUnpublished: true })
  const totalCategories = categories.length
  const totalSubcategories = categories.reduce(
    (acc, cat) => acc + cat.subcategories.length, 0
  )
  const totalArticles = categories.reduce(
    (acc, cat) => acc + cat.subcategories.reduce(
      (subAcc, sub) => subAcc + sub.articles.length, 0
    ), 0
  )
  const totalPosts = categories.reduce(
    (acc, cat) => acc + cat.subcategories.reduce(
      (subAcc, sub) => subAcc + sub.articles.reduce(
        (artAcc, art) => artAcc + art.posts.length, 0
      ), 0
    ), 0
  )

  const [membersResult, revenueResult, metricsSnapshot] = await Promise.all([
    getMembersCounts(),
    getRevenueSummary(),
    getAdminMetricsDashboard(parseDateRange("30d"), "day"),
  ])
  const membersTotal = membersResult.error ? 0 : membersResult.total
  const payingMembers = membersResult.error ? 0 : membersResult.paying
  const revenueAvailable = revenueResult.error ? 0 : revenueResult.availableCents / 100

  const ms = metricsSnapshot.pressCenter.summary
  const fb = metricsSnapshot.pressCenter.feedback
  const contentTotals = metricsSnapshot.content.totals

  const stats = [
    { name: "Categories", value: totalCategories, icon: FolderTree, color: "bg-blue-500" },
    { name: "Subcategories", value: totalSubcategories, icon: FolderTree, color: "bg-purple-500" },
    { name: "Articles", value: totalArticles, icon: FileText, color: "bg-green-500" },
    { name: "Total Posts", value: totalPosts, icon: ImageIcon, color: "bg-orange-500" },
    { name: "Members", value: membersTotal, icon: Users, color: "bg-cyan-500", href: "/admin/members" },
    { name: "Paying members", value: payingMembers, icon: CreditCard, color: "bg-emerald-600", href: "/admin/members" },
    { name: "Revenue (available)", value: typeof revenueAvailable === "number" ? `$${revenueAvailable.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—", icon: DollarSign, color: "bg-emerald-500", href: "/admin/members" },
  ]

  const categoryIcons: Record<string, React.ElementType> = {
    "crime-prevention": ShieldCheck,
    "fire-prevention": Flame,
    "whats-new": Star,
    "weather-preparedness": FolderTree,
    "natural-disaster": FolderTree,
    "community-awareness": FolderTree,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your safety content and templates
          </p>
        </div>
        <Button asChild className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90 shrink-0">
          <Link href="/admin/articles/new">
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </div>

      {/* Stats - two rows: content stats, then members/revenue */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.slice(0, 4).map((stat) => {
            const href = "href" in stat ? (stat as { href?: string }).href : undefined
            const content = (
              <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-600">{stat.name}</span>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{stat.value}</p>
              </div>
            )
            return href ? (
              <Link key={stat.name} href={href} className="h-full">
                {content}
              </Link>
            ) : (
              <React.Fragment key={stat.name}>{content}</React.Fragment>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.slice(4, 7).map((stat) => {
            const href = (stat as { href?: string }).href ?? "/admin/members"
            return (
              <Link
                key={stat.name}
                href={href}
                className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-600">{stat.name}</span>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{stat.value}</p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Metrics snapshot — full charts live under Metrics */}
      <section className="mb-6">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b bg-muted/30 px-6 py-4">
            <div>
              <CardTitle className="text-lg">Metrics (last 30 days)</CardTitle>
              <CardDescription className="mt-0.5">
                Signups, generation usage, feedback, and curated content — open Metrics for bar charts and full breakdowns.
              </CardDescription>
            </div>
            <Button asChild className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90 shrink-0">
              <Link href="/admin/metrics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Open Metrics
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {[
                { label: "Agencies", value: ms.totalAgencies },
                { label: "New signups", value: ms.newSignups },
                { label: "PR sessions", value: ms.newPressReleaseSessions },
                { label: "Video sessions", value: ms.videoRequestSessions },
                { label: "Copies", value: ms.totalCopyActions },
                { label: "Feedback +", value: `${fb.positivePercent}%` },
                { label: "Article views", value: contentTotals.views },
                { label: "Active (30d)", value: ms.activeAgencies },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-3">
                  <p className="text-xs font-medium text-gray-500">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Categories + Quick Actions in a uniform grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content Categories - 2 cols on large, names contained */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <CardTitle className="text-lg">Content Categories</CardTitle>
            <CardDescription className="mt-0.5">
              Quick overview of your template categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => {
                const Icon = categoryIcons[category.id] || FolderTree
                const articleCount = category.subcategories.reduce(
                  (acc, sub) => acc + sub.articles.length, 0
                )
                const postCount = category.subcategories.reduce(
                  (acc, sub) => acc + sub.articles.reduce(
                    (artAcc, art) => artAcc + art.posts.length, 0
                  ), 0
                )
                return (
                  <Link
                    key={category.id}
                    href={`/admin/categories/${category.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#1470AF] hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1470AF]/10">
                      <Icon className="h-5 w-5 text-[#1470AF]" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h3 className="truncate font-medium text-gray-900" title={category.title}>
                        {category.title}
                      </h3>
                      <p className="truncate text-xs text-gray-500">
                        {articleCount} articles · {postCount} posts
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - 1 col */}
        <Card>
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription className="mt-0.5">
              Common tasks for managing your content
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 p-6">
            <Button asChild variant="outline" className="justify-start gap-3 bg-transparent">
              <Link href="/admin/articles/new">
                <Plus className="h-4 w-4" />
                <span>Add Article</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-3 bg-transparent">
              <Link href="/admin/media">
                <ImageIcon className="h-4 w-4" />
                <span>Upload Images</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-3 bg-transparent">
              <Link href="/admin/categories">
                <FolderTree className="h-4 w-4" />
                <span>Manage Categories</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-3 bg-transparent">
              <Link href="/admin/metrics">
                <BarChart3 className="h-4 w-4" />
                <span>View Metrics</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-3 bg-transparent">
              <Link href="/" target="_blank">
                <ExternalLink className="h-4 w-4" />
                <span>View Live Site</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start gap-3 bg-transparent">
              <Link href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                <DollarSign className="h-4 w-4" />
                <span>Open Stripe Dashboard</span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
