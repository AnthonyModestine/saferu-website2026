"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const benefits = [
  "Access to What's New — updated every week",
  "Full content library for your agency",
  "Crime prevention templates",
  "Fire safety resources",
  "Weather preparedness guides",
]

export default function SignUpPage() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const email = (form.querySelector("#email") as HTMLInputElement)?.value?.trim()
    const firstName = (form.querySelector("#firstName") as HTMLInputElement)?.value?.trim()
    const lastName = (form.querySelector("#lastName") as HTMLInputElement)?.value?.trim()
    const agency = (form.querySelector("#agency") as HTMLInputElement)?.value?.trim()
    const password = (form.querySelector("#password") as HTMLInputElement)?.value ?? ""
    if (!email) {
      setError("Email is required")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName, agency, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Sign up failed")
        return
      }
      const loginRes = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (loginRes.ok) {
        window.location.href = "/"
        return
      }
      setSuccess(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#1a365d]">You&apos;re a member</h2>
            <p className="mt-2 text-muted-foreground">Start exploring What&apos;s New and our free content.</p>
            <Button asChild className="mt-6 bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Link href="/">Go to SaferU</Link>
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
          <Link href="/" className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/images/saferu-logo.png"
              alt="SaferU"
              width={180}
              height={52}
              className="h-13 w-auto"
              style={{ filter: "brightness(0.4) contrast(1.2)" }}
            />
          </Link>
          <CardTitle className="text-2xl font-bold text-[#1a365d]">Create Your Free Account</CardTitle>
          <CardDescription>Become a member and get weekly access to What&apos;s New — plus our full library of ready-to-share safety content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">As a free member you get:</p>
            <ul className="space-y-1">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First Name"
                  className="placeholder:text-muted-foreground/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  className="placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency">Agency Name</Label>
              <Input
                id="agency"
                placeholder="Agency Name"
                className="placeholder:text-muted-foreground/60"
              />
            </div>
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
              <Label htmlFor="password">Password (min 8 characters)</Label>
              <PasswordInput
                id="password"
                placeholder="Create a password"
                className="placeholder:text-muted-foreground/60"
                minLength={8}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create Free Account"}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Want access to the Press Center?{" "}
            <Link href="/pio-tool/subscribe" className="text-primary hover:underline">
              View subscription plans
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
