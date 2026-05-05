"use client"

import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"

/**
 * Wraps Press Center form content.
 * - Subscribed users: full interactive form.
 * - Everyone else: form is fully visible but all inputs are disabled.
 *   A banner at the top explains how to unlock.
 */
export function PIOPreviewGate({ children }: { children: React.ReactNode }) {
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()

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

  return (
    <div className="space-y-6">
      {/* Unlock banner */}
      <div className="rounded-xl border border-[#1470AF]/30 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-[#1470AF] mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-[#1a365d]">
              Subscribe to access Press Center
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Preview how it works below. Sign in to your account to begin drafting.
            </p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          {member ? (
            <Button
              asChild
              className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90 font-semibold"
            >
              <Link href="/pio-tool/subscribe">Subscribe — $30/month</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90 font-semibold"
              >
                <Link href="/sign-in?redirect=/pio-tool/subscribe">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/member-site">Join Free</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Form — fully visible, inputs/textareas disabled but tabs remain clickable */}
      <div className="[&_input]:pointer-events-none [&_input]:opacity-50 [&_textarea]:pointer-events-none [&_textarea]:opacity-50 [&_select]:pointer-events-none [&_select]:opacity-50 [&_[role=combobox]]:pointer-events-none [&_[role=combobox]]:opacity-50">
        {children}
      </div>
    </div>
  )
}
