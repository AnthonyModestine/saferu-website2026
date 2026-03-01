"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"

const SUBSCRIBE_PATH = "/pio-tool/subscribe"
const SIGN_IN_PATH = "/sign-in"

/**
 * Wraps Press Center content that requires a paid subscription (press release generator, community request).
 * Requires sign-in first; then redirects to subscribe if not paid.
 */
export function PIOPaywall({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (sessionLoading || subLoading) return
    if (hasRedirected.current) return
    if (!member) {
      hasRedirected.current = true
      router.replace(`${SIGN_IN_PATH}?returnUrl=${encodeURIComponent(pathname || "/pio-tool")}`)
      return
    }
    if (!isSubscribed) {
      hasRedirected.current = true
      router.replace(SUBSCRIBE_PATH)
    }
  }, [member, isSubscribed, sessionLoading, subLoading, router, pathname])

  const isLoading = sessionLoading || subLoading
  if (isLoading || !member || !isSubscribed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1470AF] border-t-transparent" />
        <p className="text-sm text-muted-foreground">Checking access...</p>
      </div>
    )
  }

  return <>{children}</>
}
