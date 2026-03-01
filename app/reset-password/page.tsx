"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4">
              <Image src="/images/saferu-logo.png" alt="SaferU" width={160} height={45} className="h-12 w-auto" />
            </Link>
            <CardTitle className="text-2xl font-bold text-[#1a365d]">Invalid link</CardTitle>
            <CardDescription>This reset link is missing or invalid. Please request a new one from the forgot password page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }
      setSuccess(true)
      setTimeout(() => {
        window.location.href = "/sign-in"
      }, 2000)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-4">
              <Image src="/images/saferu-logo.png" alt="SaferU" width={160} height={45} className="h-12 w-auto" />
            </Link>
            <CardTitle className="text-2xl font-bold text-[#1a365d]">Password updated</CardTitle>
            <CardDescription>Redirecting you to sign in…</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Link href="/sign-in">Sign in now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4">
            <Image
              src="/images/saferu-logo.png"
              alt="SaferU"
              width={160}
              height={45}
              className="h-12 w-auto"
            />
          </Link>
          <CardTitle className="text-2xl font-bold text-[#1a365d]">Set new password</CardTitle>
          <CardDescription>Enter your new password below (min 8 characters).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="placeholder:text-muted-foreground/60"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-[#1470AF] text-white hover:bg-[#1470AF]/90" disabled={loading}>
              {loading ? "Updating…" : "Update password"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="text-primary font-medium hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
