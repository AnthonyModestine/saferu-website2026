"use client"

import { useState, useEffect } from "react"

/**
 * Returns the current user's Press Center subscription status (paid = access to press release generator and community request).
 * Uses member session; paid status comes from Stripe (active subscription or successful charge).
 */
export function useSubscription(): { isSubscribed: boolean; isLoading: boolean } {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
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
    return () => { cancelled = true }
  }, [])

  return { isSubscribed, isLoading }
}
