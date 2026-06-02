import React from "react"
import { redirect } from "next/navigation"
import { checkAdminSession } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
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
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
