"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FilePlus,
  MessageSquare,
  History,
  Settings,
  HelpCircle,
  LogOut,
  CreditCard,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/pio-tool",
    icon: LayoutDashboard,
  },
  {
    title: "New Press Release",
    href: "/pio-tool/new",
    icon: FilePlus,
  },
  {
    title: "Video Request",
    href: "/pio-tool/community-post",
    icon: MessageSquare,
  },
  {
    title: "History",
    href: "/pio-tool/history",
    icon: History,
  },
  {
    title: "Agency Settings",
    href: "/pio-tool/settings",
    icon: Settings,
  },
]

const bottomItems = [
  {
    title: "Subscribe",
    href: "/pio-tool/subscribe",
    icon: CreditCard,
  },
  {
    title: "Help",
    href: "/pio-tool/help",
    icon: HelpCircle,
  },
  {
    title: "Log Out",
    href: "/",
    icon: LogOut,
  },
]

export function PIOSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border p-4">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </div>
    </aside>
  )
}
