"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")?.trim() ?? ""
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.")
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const res = await fetch(
          `/api/stripe/checkout-session?session_id=${encodeURIComponent(sessionId)}`
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          if (!cancelled) setError(data.error || "Could not verify your payment.")
          return
        }

        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json().catch(() => ({}))
        if (!cancelled && sessionData?.member?.paid) {
          window.location.replace("/pio-tool")
          return
        }

        if (!cancelled) {
          setError("Payment received, but your account is not signed in. Please sign in to open Press Center.")
        }
      } catch {
        if (!cancelled) setError("Something went wrong. Please contact support if you were charged.")
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
          {error.includes("not signed in") ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-[#1a365d]">Payment successful</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button asChild className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold">
                <Link href="/sign-in?returnUrl=%2Fpio-tool">Sign in to Press Center</Link>
              </Button>
            </>
          ) : (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
              <h1 className="text-xl font-bold text-[#1a365d]">We couldn&apos;t verify checkout</h1>
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
