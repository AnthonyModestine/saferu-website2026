"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { PIOSidebar } from "@/components/pio/sidebar"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgencyProvider } from "@/lib/agency-context"
import { useMemberSession } from "@/lib/use-member-session"

export default function PIOToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { member, isLoading } = useMemberSession()
  const isDashboard = pathname === "/pio-tool" || pathname === "/pio-tool/"

  useEffect(() => {
    if (!isLoading && !member && !isDashboard) {
      router.replace("/pio-tool?guest=1")
    }
  }, [isDashboard, isLoading, member, router])

  if (!isLoading && !member && !isDashboard) return null

  return (
    <AgencyProvider>
      <div className="flex min-h-screen bg-[#eef2f8]">
        <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
          <PIOSidebar />
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[280px] border-0 bg-[#0B1B3A] p-0">
            <SheetTitle className="sr-only">Press Center navigation</SheetTitle>
            <PIOSidebar />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-[#d8e0ef] bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-[#0f1c3f]"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/pio-tool" className="font-semibold text-[#0f1c3f]">
              SaferU Press Center
            </Link>
          </div>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AgencyProvider>
  )
}
