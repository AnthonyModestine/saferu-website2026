"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Plus,
  FileText,
  Video,
  CalendarDays,
  Bookmark,
  Calendar,
  Shield,
  LogOut,
  Settings,
  Sparkles,
  Lock,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { useMemberSession } from "@/lib/use-member-session"
import { pressCenterSignInUrl, pressCenterSignUpUrl } from "@/lib/press-center-routes"

/**
 * AI Post Generator (in Create nav): analyzes conditions + SaferU Content Library
 * to recommend timely posts with curated messages and graphics when available.
 */

const createItems = [
  {
    title: "Press Release",
    description: "Create incident & general press releases",
    href: "/pio-tool/new",
    icon: FileText,
    accent: "text-[#3B82F6]",
  },
  {
    title: "Video Request",
    description: "Request surveillance or dashcam footage",
    href: "/pio-tool/community-post",
    icon: Video,
    accent: "text-[#7C5CFC]",
  },
  {
    title: "Community Events",
    description: "Promote and manage community events",
    href: "/pio-tool/events?new=1",
    icon: CalendarDays,
    accent: "text-[#10B981]",
    match: "/pio-tool/events",
  },
  {
    title: "AI Post Generator",
    description: "What to post today — with SaferU graphics",
    href: "/pio-tool/ideas",
    icon: Sparkles,
    accent: "text-[#F59E0B]",
  },
]

const assistantItems = [
  {
    title: "Dashboard",
    description: "See what you should communicate today",
    href: "/pio-tool",
    icon: LayoutDashboard,
  },
  {
    title: "Saved Content",
    description: "View and manage your drafts",
    href: "/pio-tool/history",
    icon: Bookmark,
  },
  {
    title: "Templates",
    description: "Reuse recurring community events",
    href: "/pio-tool/templates",
    icon: CalendarDays,
  },
  {
    title: "Events",
    description: "Upcoming community events by month",
    href: "/pio-tool/events",
    icon: Calendar,
  },
]

function LockedNavItem({
  title,
  description,
  icon: Icon,
  accent,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  accent?: string
}) {
  return (
    <div
      className="flex cursor-not-allowed items-start gap-3 rounded-xl px-3 py-2.5 opacity-55"
      title="Sign in to unlock"
      aria-disabled="true"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", accent || "text-[#93A4C7]")} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#E8EEF9]">
          {title}
          <Lock className="h-3 w-3 text-[#7B8BB0]" aria-hidden="true" />
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[#94A3B8]">
          {description}
        </span>
      </span>
    </div>
  )
}

export function PIOSidebar() {
  const pathname = usePathname()
  const { settings } = useAgency()
  const { member } = useMemberSession()

  const agencyLabel =
    settings.agencyName?.trim() || "Demo Township Police Department"
  const displayName =
    member?.name?.trim() || member?.email?.split("@")[0] || null
  const shortName = displayName
    ? displayName.includes(" ")
      ? `${displayName.split(" ")[0]} ${displayName.split(" ").slice(-1)[0]?.[0] || ""}.`
      : displayName
    : null
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null

  const dashboardActive =
    pathname === "/pio-tool" || pathname === "/pio-tool/"

  return (
    <aside className="flex h-full w-[280px] flex-col bg-[#0B1B3A] text-white">
      <Link href="/pio-tool" className="flex items-center gap-3 px-5 py-5 hover:opacity-95">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB]">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#93A4C7]">SAFERU</p>
          <p className="truncate text-sm font-bold tracking-wide">PRESS CENTER</p>
        </div>
      </Link>

      <div className="px-4 pb-3">
        {member ? (
          <Link
            href="/pio-tool/events?new=1"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563EB]/30 transition hover:bg-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" />
            Create New
          </Link>
        ) : (
          <div
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#2563EB]/45 px-4 py-3 text-sm font-semibold text-white/80"
            title="Sign in to unlock"
            aria-disabled="true"
          >
            <Lock className="h-4 w-4" />
            Create New
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        <Link
          href={member ? "/pio-tool" : "/pio-tool?guest=1"}
          className={cn(
            "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
            dashboardActive
              ? "bg-white/15 text-white ring-1 ring-white/25"
              : "hover:bg-white/10"
          )}
          aria-current={dashboardActive ? "page" : undefined}
        >
          <LayoutDashboard
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0",
              dashboardActive ? "text-white" : "text-[#93A4C7]"
            )}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Dashboard</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-[#94A3B8]">
              See what you should communicate today
            </span>
          </span>
        </Link>

        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7B8BB0]">
            Create
          </p>
          <div className="space-y-1">
            {createItems.map((item) => {
              if (!member) {
                return (
                  <LockedNavItem
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    accent={item.accent}
                  />
                )
              }
              const matchPath = item.match || item.href.split("?")[0]
              const active =
                pathname === matchPath ||
                (matchPath !== "/pio-tool" && pathname.startsWith(matchPath))
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    active
                      ? "bg-[#12284F] ring-1 ring-[#10B981]/35"
                      : "hover:bg-white/10"
                  )}
                >
                  <item.icon className={cn("mt-0.5 h-5 w-5 shrink-0", item.accent)} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{item.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-[#94A3B8]">
                      {item.description}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7B8BB0]">
            AI Assistant
          </p>
          <div className="space-y-1">
            {assistantItems
              .filter((item) => item.href !== "/pio-tool")
              .map((item) => {
                if (!member) {
                  return (
                    <LockedNavItem
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      icon={item.icon}
                    />
                  )
                }
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      active ? "bg-white/15 text-white ring-1 ring-white/20" : "hover:bg-white/10"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0",
                        active ? "text-white" : "text-[#93A4C7]"
                      )}
                    />
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-sm font-semibold",
                          active ? "text-white" : "text-[#E8EEF9]"
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-[#94A3B8]">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                )
              })}
          </div>
        </div>
      </nav>

      <div className="space-y-2 border-t border-white/10 p-3">
        {member ? (
          <>
            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e90ff]/25 text-[#7ec8ff]">
                <Shield className="h-4 w-4" />
              </div>
              <p className="min-w-0 truncate text-xs font-medium text-[#d7e0f7]">{agencyLabel}</p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C5CFC] text-[11px] font-bold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{shortName}</p>
                <p className="text-[11px] text-[#9fb0d9]">PIO Admin</p>
              </div>
              <Link
                href="/pio-tool/settings"
                className="rounded-md p-1.5 text-[#9fb0d9] hover:bg-white/10 hover:text-white"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="rounded-md p-1.5 text-[#9fb0d9] hover:bg-white/10 hover:text-white"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-2 rounded-xl bg-white/5 p-3">
            <p className="text-xs font-medium text-[#d7e0f7]">Previewing as guest</p>
            <p className="text-[11px] leading-snug text-[#9fb0d9]">
              Sign in to unlock creating and publishing for your department.
            </p>
            <div className="flex gap-2 pt-1">
              <Link
                href={pressCenterSignInUrl()}
                className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href={pressCenterSignUpUrl()}
                className="flex-1 rounded-lg bg-[#2563EB] px-3 py-2 text-center text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
