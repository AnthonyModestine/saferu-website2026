import React from "react"
import { redirect } from "next/navigation"
import { checkAdminSession } from "@/lib/admin-auth"
import { AdminSidebar, AdminMobileHeader } from "@/components/admin/admin-sidebar"
import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuthenticated = await checkAdminSession()
  
  if (!isAuthenticated) {
    redirect("/admin/login")
  }

  await Promise.all([loadCmsAdditions(), loadVisibility()])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden shrink-0 lg:block">
        <AdminSidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
