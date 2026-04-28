"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function SignInForm() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/"
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const email = (form.querySelector("#email") as HTMLInputElement)?.value?.trim()
    const password = (form.querySelector("#password") as HTMLInputElement)?.value ?? ""
    if (!email || !password) {
      setError("Email and password are required")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Invalid email or password")
        return
      }
      window.location.href = returnUrl
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 block">
            <Image
              src="/images/saferu-logo.png"
              alt="SaferU"
              width={160}
              height={45}
              className="h-12 w-auto"
              style={{ filter: "brightness(0.4) contrast(1.2)" }}
            />
          </Link>
          <CardTitle className="text-2xl font-bold text-[#1a365d]">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@agency.gov"
                className="placeholder:text-muted-foreground/60"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="placeholder:text-muted-foreground/60"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#1a365d] text-white hover:bg-[#1a365d]/90"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/sign-up" className="text-primary font-medium hover:underline">
              Sign up for free
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SignInForm />
    </Suspense>
  )
}
