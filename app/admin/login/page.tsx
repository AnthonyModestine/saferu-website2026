"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Shield, Lock, AlertCircle } from "lucide-react"
import { verifyAdminPassword } from "@/lib/admin-auth"

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const isValid = await verifyAdminPassword(identifier.trim(), password)
      if (isValid) {
        router.push("/admin")
        router.refresh()
      } else {
        setError("Invalid username or password. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-[#1a365d] to-[#0f2744] p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f2b233]">
            <Shield className="h-8 w-8 text-[#1a365d]" />
          </div>
          <h1 className="text-2xl font-bold text-white">SaferU Admin</h1>
          <p className="mt-2 text-[#a0c4e8]">Content Management System</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Lock className="h-5 w-5" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Sign in with your admin username or email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="identifier">Username or email</Label>
                  <Input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. amodesti or your admin email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="h-12 bg-[#1470AF] text-white hover:bg-[#1470AF]/90" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-[#a0c4e8]">
          This area is restricted to SaferU administrators only.
        </p>
      </div>
    </div>
  )
}
