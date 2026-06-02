"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"

const SUBSCRIBE_PATH = "/pio-tool/subscribe"
const PRICING_PATH = "/pricing"

export function PIOPreviewGate({ children }: { children: React.ReactNode }) {
  const { member, isLoading: sessionLoading } = useMemberSession()
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

  function getUpgradePath(): string {
    if (member) return SUBSCRIBE_PATH
    return PRICING_PATH
  }

  function handleGreyClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest('[role="tab"]')) return
    router.push(getUpgradePath())
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#1470AF]/20 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-[#1a365d] text-lg">
            {member ? "Upgrade to Press Center" : "Get started with Press Center"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {member
              ? "You're signed in with a free account. Subscribe to draft press releases and video requests."
              : "$30/month. Confident communication for public safety — draft press releases and video requests in minutes without compromising oversight."}
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
        >
          {member ? (
            <Link href={SUBSCRIBE_PATH}>Subscribe Now</Link>
          ) : (
            <Link href={PRICING_PATH}>See plans</Link>
          )}
        </Button>
      </div>

      <div
        className="cursor-pointer [&_input]:pointer-events-none [&_input]:opacity-50 [&_textarea]:pointer-events-none [&_textarea]:opacity-50 [&_select]:pointer-events-none [&_select]:opacity-50 [&_[role=combobox]]:pointer-events-none [&_[role=combobox]]:opacity-50 [&_button:not([role=tab])]:pointer-events-none [&_button:not([role=tab])]:opacity-50"
        onClick={handleGreyClick}
      >
        {children}
      </div>
    </div>
  )
}
