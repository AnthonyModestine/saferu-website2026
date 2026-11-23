"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useMemberSession } from "@/lib/use-member-session"

/** Client gate for free-member content (e.g. What's New articles). */
export function MemberOnlyGate({
  children,
  returnUrl,
  title = "Members only",
  description = "Sign in with your free SaferU account to view this content.",
}: {
  children: React.ReactNode
  returnUrl: string
  title?: string
  description?: string
}) {
  const { member, isLoading } = useMemberSession()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-[#F0F4F8]">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center bg-[#F0F4F8] px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F5] bg-white px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f2b233]/20">
              <Lock className="h-6 w-6 text-[#b45309]" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#1A365D]">{title}</h1>
            <p className="mt-3 text-base leading-relaxed text-[#42536e]">{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#f2b233] font-semibold text-[#1a365d] hover:bg-[#f2b233]/90"
              >
                <Link href={`/sign-up?returnUrl=${encodeURIComponent(returnUrl)}`}>
                  Create Free Account
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent">
                <Link href={`/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`}>Sign In</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return <>{children}</>
}
