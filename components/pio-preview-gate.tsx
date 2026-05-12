"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"

export function PIOPreviewGate({ children }: { children: React.ReactNode }) {
  const { isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const router = useRouter()

  const isLoading = sessionLoading || subLoading

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1470AF] border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isSubscribed) {
    return <>{children}</>
  }

  function handleGreyClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest('[role="tab"]')) return
    router.push("/pricing")
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl border border-[#1470AF]/20 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-[#1a365d] text-lg">Get started with Press Center</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            $30/month. Confident communication for public safety — draft press releases and community requests in minutes without compromising oversight.
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
        >
          <Link href="/pricing">Subscribe Now</Link>
        </Button>
      </div>

      {/* Form — tabs are clickable; clicking any input/textarea goes straight to Stripe */}
      <div
        className="cursor-pointer [&_input]:pointer-events-none [&_input]:opacity-50 [&_textarea]:pointer-events-none [&_textarea]:opacity-50 [&_select]:pointer-events-none [&_select]:opacity-50 [&_[role=combobox]]:pointer-events-none [&_[role=combobox]]:opacity-50 [&_button:not([role=tab])]:pointer-events-none [&_button:not([role=tab])]:opacity-50"
        onClick={handleGreyClick}
      >
        {children}
      </div>
    </div>
  )
}
