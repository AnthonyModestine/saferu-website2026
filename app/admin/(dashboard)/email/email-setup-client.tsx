"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle2, AlertTriangle } from "lucide-react"
import type { EmailConfigStatus } from "@/lib/email-config"

export function EmailSetupClient() {
  const [status, setStatus] = useState<EmailConfigStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [testEmail, setTestEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email")
      if (res.ok) setStatus(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setTestResult(null)
    setTestError(null)
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        setTestResult(data.message ?? "Test email sent.")
      } else {
        setTestError(data.error ?? "Failed to send test email")
      }
    } catch {
      setTestError("Could not reach the server.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email status
          </CardTitle>
          <CardDescription>
            Password reset uses Resend. Configure on the <strong>saferu-backend</strong> Vercel project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : status ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">API key</p>
                  <p className="font-medium flex items-center gap-2 mt-1">
                    {status.apiKeySet ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        RESEND_API_KEY is set
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        Not configured
                      </>
                    )}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">From address</p>
                  <p className="font-medium mt-1 text-sm break-all">{status.fromAddress}</p>
                </div>
              </div>

              {status.issues.length > 0 && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
                  <p className="font-medium text-amber-900">Issues</p>
                  <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
                    {status.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-2">
                <p className="font-medium">Setup checklist</p>
                <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                  {status.setupSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-700">Could not load email status.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send test email</CardTitle>
          <CardDescription>
            Confirms Resend can deliver mail. With the test domain, only your Resend account email will receive messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTest} className="flex flex-col gap-4 sm:flex-row sm:items-end max-w-lg">
            <div className="flex-1 space-y-2">
              <Label htmlFor="test-email">Send to</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="you@agency.gov"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={sending || !testEmail.trim()} className="bg-[#1470AF] hover:bg-[#1470AF]/90">
              {sending ? "Sending…" : "Send test"}
            </Button>
          </form>
          {testResult && (
            <p className="mt-3 text-sm text-green-700 bg-green-50 rounded-lg p-3">{testResult}</p>
          )}
          {testError && (
            <p className="mt-3 text-sm text-red-800 bg-red-50 rounded-lg p-3">{testError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
