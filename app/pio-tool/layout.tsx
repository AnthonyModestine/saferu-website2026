"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { PIOSidebar } from "@/components/pio/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AgencyProvider } from "@/lib/agency-context"

export default function PIOToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AgencyProvider>
      <div className="flex min-h-screen flex-col">
        {/* Main Site Header */}
        <Header />

        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <PIOSidebar />
          </div>

          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <PIOSidebar />
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <div className="flex flex-1 flex-col">
            {/* Mobile menu button */}
            <div className="flex items-center border-b border-border bg-card p-4 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <span className="ml-3 font-semibold">Press Center</span>
            </div>
            <main className="flex-1 overflow-auto bg-muted/30 p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AgencyProvider>
  )
}
