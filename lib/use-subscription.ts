"use client"

import { useState, useEffect } from "react"
import { isLocalGuestPreviewClient, isLocalPreviewClient } from "@/lib/local-preview"

/**
 * Returns the current user's Press Center subscription status (paid = access to press release generator and video request).
 * Uses member session; paid status comes from Stripe (active subscription or successful charge).
 * On localhost in development, always treated as subscribed for local rebuilding.
 * Use ?guest=1 to preview the unpaid / logged-out experience.
 */
export function useSubscription(): { isSubscribed: boolean; isLoading: boolean } {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (isLocalGuestPreviewClient()) {
      setIsSubscribed(false)
      setIsLoading(false)
      return
    }

    if (isLocalPreviewClient()) {
      setIsSubscribed(true)
      setIsLoading(false)
      return
    }

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setIsSubscribed(data?.member?.paid === true)
      })
      .catch(() => {
        if (!cancelled) setIsSubscribed(false)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { isSubscribed, isLoading }
}
