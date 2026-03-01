"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Shield, 
  LayoutDashboard, 
  FolderTree, 
  FileText, 
  ImageIcon, 
  BarChart3,
  LogOut,
  ChevronRight,
  Archive,
  Users,
  ExternalLink,
  CreditCard,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutAdmin } from "@/lib/admin-auth"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Tickets", href: "/admin/tickets", icon: MessageSquare },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Articles", href: "/admin/articles", icon: FileText },
  { name: "Unpublished", href: "/admin/unpublished", icon: Archive },
  { name: "Media Library", href: "/admin/media", icon: ImageIcon },
  { name: "Metrics", href: "/admin/metrics", icon: BarChart3 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await logoutAdmin()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-[#1a365d] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2b233]">
          <Shield className="h-5 w-5 text-[#1a365d]" />
        </div>
        <div>
          <h1 className="font-bold">SaferU</h1>
          <p className="text-xs text-[#a0c4e8]">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/admin" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-[#a0c4e8] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-white/10 p-4">
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#a0c4e8] transition-colors hover:bg-white/5 hover:text-white"
        >
          <CreditCard className="h-5 w-5" />
          Stripe Dashboard
          <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-70" />
        </a>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#a0c4e8] hover:bg-white/5 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
