"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Public page — does not display Stripe/customer PII.
 * Checkout verification requires a matching authenticated member session
 * (/api/stripe/checkout-session enforces session + email match).
 */
function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")?.trim() ?? ""
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSignIn, setNeedsSignIn] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.")
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json().catch(() => ({}))
        const member = sessionData?.member

        if (!member) {
          if (!cancelled) {
            setNeedsSignIn(true)
            setError(
              "Payment may have completed. Sign in with the same email you used at checkout to open Press Center."
            )
          }
          return
        }

        if (member.paid) {
          if (!cancelled) window.location.replace("/pio-tool")
          return
        }

        // Confirm this checkout belongs to the signed-in member (API returns no PII to others).
        const res = await fetch(
          `/api/stripe/checkout-session?session_id=${encodeURIComponent(sessionId)}`
        )
        if (res.status === 401) {
          if (!cancelled) {
            setNeedsSignIn(true)
            setError("Please sign in to confirm your payment.")
          }
          return
        }
        if (res.status === 404) {
          if (!cancelled) {
            setError(
              "We could not match this checkout to your account. Sign in with the email used at checkout, or contact support if you were charged."
            )
          }
          return
        }
        if (!res.ok) {
          if (!cancelled) setError("Could not verify your payment.")
          return
        }

        // Successful match — token packs credit via webhook; subscriptions flip paid shortly.
        // Re-check session once; otherwise ask user to open Press Center / wait briefly.
        const again = await fetch("/api/auth/session")
        const againData = await again.json().catch(() => ({}))
        if (!cancelled && againData?.member?.paid) {
          window.location.replace("/pio-tool")
          return
        }

        if (!cancelled) {
          setError(
            "Payment received. If Press Center is not unlocked yet, wait a moment and refresh, or open Press Center from your account."
          )
        }
      } catch {
        if (!cancelled) {
          setError("Something went wrong. Please contact support if you were charged.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1470AF]" />
        <p className="text-sm text-muted-foreground">Confirming your payment…</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-lg border-amber-200">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {needsSignIn ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-[#1a365d]">Almost there</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button asChild className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold">
                <Link href="/sign-in?returnUrl=%2Fpio-tool%2Fcheckout-success">Sign in</Link>
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
              <h1 className="text-xl font-bold text-[#1a365d]">Checkout status</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button asChild variant="outline">
                <Link href="/pio-tool">Back to Press Center</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#1470AF]" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
