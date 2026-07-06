"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Shield,
  LayoutDashboard,
  FolderTree,
  FileText,
  ImageIcon,
  Images,
  BarChart3,
  LogOut,
  ChevronRight,
  Archive,
  Users,
  ExternalLink,
  CreditCard,
  MessageSquare,
  MessageSquareQuote,
  Menu,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { logoutAdmin } from "@/lib/admin-auth"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Email", href: "/admin/email", icon: Mail },
  { name: "Tickets", href: "/admin/tickets", icon: MessageSquare },
  { name: "Member feedback", href: "/admin/member-feedback", icon: MessageSquareQuote },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Articles", href: "/admin/articles", icon: FileText },
  { name: "Posts", href: "/admin/posts", icon: Images },
  { name: "Drafts", href: "/admin/unpublished", icon: Archive },
  { name: "Media Library", href: "/admin/media", icon: ImageIcon },
  { name: "Metrics", href: "/admin/metrics", icon: BarChart3 },
]

function getPageTitle(pathname: string): string {
  const match = navigation.find(
    (item) => pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
  )
  return match?.name ?? "Admin"
}

function AdminSidebarHeader() {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2b233]">
        <Shield className="h-5 w-5 text-[#1a365d]" />
      </div>
      <div>
        <h1 className="font-bold">SaferU</h1>
        <p className="text-xs text-[#a0c4e8]">Admin Panel</p>
      </div>
    </div>
  )
}

function AdminSidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAdmin()
    onNavigate?.()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="space-y-1 border-t border-white/10 p-4">
      <a
        href="https://dashboard.stripe.com"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a0c4e8] transition-colors hover:bg-white/5 hover:text-white"
      >
        <CreditCard className="h-5 w-5" />
        Stripe Dashboard
        <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-70" />
      </a>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-[#a0c4e8] hover:bg-white/5 hover:text-white"
        onClick={() => void handleLogout()}
      >
        <LogOut className="h-5 w-5" />
        Sign Out
      </Button>
    </div>
  )
}

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <AdminSidebarHeader />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-[#a0c4e8] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          )
        })}
      </nav>
      <AdminSidebarFooter onNavigate={onNavigate} />
    </>
  )
}

export function AdminSidebar() {
  return (
    <div className="flex h-screen w-64 flex-col bg-[#1a365d] text-white">
      <AdminSidebarNav />
    </div>
  )
}

export function AdminMobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0" aria-label="Open admin menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-[min(100vw-2rem,280px)] flex-col border-0 bg-[#1a365d] p-0 text-white sm:max-w-xs [&>button]:text-white [&>button]:opacity-80"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">SaferU Admin</p>
        <p className="truncate font-semibold text-gray-900">{pageTitle}</p>
      </div>
    </header>
  )
}
