"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { User, CreditCard, Loader2, KeyRound, Trash2, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function AccountPage() {
  const router = useRouter()
  const [member, setMember] = useState<{ email: string; name: string | null; paid: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalMessage, setPortalMessage] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.member) setMember(data.member)
        else router.replace("/sign-in?returnUrl=/account")
      })
      .catch(() => router.replace("/sign-in?returnUrl=/account"))
      .finally(() => setLoading(false))
  }, [router])

  const handleManageBilling = async () => {
    setPortalMessage(null)
    setPortalLoading(true)
    try {
      const res = await fetch("/api/account/portal")
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setPortalMessage(
        data?.error || "You don’t have a billing account yet. Subscribe to the Press Center to add a payment method and manage your subscription."
      )
    } catch {
      setPortalMessage("Something went wrong. Please try again.")
    } finally {
      setPortalLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters." })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirmation do not match." })
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordMessage({ type: "success", text: data.message ?? "Password updated. Use your new password next time you sign in." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordMessage({ type: "error", text: data.error ?? "Failed to update password." })
      }
    } catch {
      setPasswordMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      const res = await fetch("/api/account/delete", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        router.replace("/")
      } else {
        setDeleteError(data.error ?? "Something went wrong. Please try again.")
        setDeleteLoading(false)
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.")
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!member) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground">Account</h1>
          <p className="mt-1 text-muted-foreground">View your profile and manage billing.</p>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Basic information for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-0.5 text-foreground">{member.email}</p>
              </div>
              {member.name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="mt-0.5 text-foreground">{member.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access</p>
                <p className="mt-0.5 text-foreground">
                  {member.paid ? "Press Center subscriber (press release & video request access)" : "Free member (What's New content)"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change password
              </CardTitle>
              <CardDescription>
                Update your sign-in password. Use your new password the next time you sign in.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordMessage && (
                  <p className={`text-sm rounded-lg p-3 ${passwordMessage.type === "success" ? "text-green-800 bg-green-50" : "text-red-800 bg-red-50"}`}>
                    {passwordMessage.text}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <PasswordInput
                    id="current-password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Re-enter new password"
                  />
                </div>
                <Button type="submit" disabled={passwordLoading} className="bg-[#1470AF] hover:bg-[#1470AF]/90">
                  {passwordLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & payment
              </CardTitle>
              <CardDescription>
                Update your payment method, view invoices, or manage your Press Center subscription.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="bg-[#1470AF] hover:bg-[#1470AF]/90"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening…
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Update payment method / Manage subscription
                  </>
                )}
              </Button>
              {portalMessage && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">{portalMessage}</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                You’ll be taken to our secure billing page. If you don’t have a subscription yet, you can{" "}
                <Link href="/pio-tool/subscribe" className="text-primary hover:underline">
                  subscribe to the Press Center
                </Link>{" "}
                from the pricing page.
              </p>
            </CardContent>
          </Card>
          {/* Delete Account */}
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete my account
                </Button>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Are you sure you want to delete your account?</p>
                      <p className="text-sm text-red-700 mt-1">
                        This will permanently remove your account and sign you out. There are no refunds for any remaining subscription period. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  {deleteError && (
                    <p className="text-sm text-red-700 bg-red-100 rounded p-2">{deleteError}</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
                      disabled={deleteLoading}
                    >
                      No, keep my account
                    </Button>
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting…
                        </>
                      ) : (
                        "Yes, delete my account"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
