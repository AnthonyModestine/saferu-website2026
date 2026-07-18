"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSubscription } from "@/lib/use-subscription"
import { CheckCircle, Flame } from "lucide-react"

const DEPARTMENT_TYPES = [
  "Volunteer fire department",
  "Volunteer EMS agency",
  "Combination department",
]

export function VolunteerPricingModal() {
  const { isSubscribed } = useSubscription()
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [departmentType, setDepartmentType] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const value = (id: string) =>
      (form.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement)?.value?.trim() ?? ""

    if (!departmentType) {
      setError("Please select a department type.")
      return
    }
    if (!confirmed) {
      setError("Please confirm the agency operates primarily with volunteer personnel.")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/volunteer-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentName: value("vp-department"),
          city: value("vp-city"),
          state: value("vp-state"),
          departmentType,
          applicantName: value("vp-name"),
          applicantRole: value("vp-role"),
          website: value("vp-website"),
          additionalInfo: value("vp-info"),
          confirmed,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-[#1a365d] px-8 font-semibold text-white hover:bg-[#1a365d]/90"
        >
          Request Volunteer Pricing
        </Button>
      </DialogTrigger>

      {!isSubscribed ? (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-[#1a365d]">
              <Flame className="h-5 w-5 text-[#E07C3E]" />
              Volunteer agency pricing
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed text-[#42536e]">
              Volunteer agency pricing is applied after subscription. Subscribe to Press Center,
              then submit the verification form from your account.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-[#F0F4F8] p-4 text-sm leading-relaxed text-[#42536e]">
            Once approved, you&rsquo;ll receive a 50% refund on your initial payment and 50% off
            future renewals — $49.50/month or $499.50/year, with the same features, users, and AI
            usage as standard Press Center.
          </div>
          <Button
            className="w-full bg-[#1470AF] py-5 font-semibold text-white hover:bg-[#1470AF]/90"
            onClick={() => {
              setOpen(false)
              document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })
            }}
          >
            View Press Center Plan
          </Button>
        </DialogContent>
      ) : (
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center" aria-live="polite">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF7EF]">
                <CheckCircle className="h-8 w-8 text-[#4A9D6B]" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#1a365d]">Request submitted</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#42536e]">
                Your request has been submitted. If approved, SaferU will refund 50% of your
                initial payment and apply the volunteer rate to future renewals.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-[#1a365d]">
                  <Flame className="h-5 w-5 text-[#E07C3E]" />
                  Volunteer pricing verification
                </DialogTitle>
                <DialogDescription>
                  Tell us about your agency. SaferU may verify eligibility using publicly
                  available agency information.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="vp-department">Department name</Label>
                  <Input id="vp-department" placeholder="Your department name" required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vp-city">City</Label>
                    <Input id="vp-city" placeholder="City" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vp-state">State</Label>
                    <Input id="vp-state" placeholder="State" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vp-type">Department type</Label>
                  <Select value={departmentType} onValueChange={setDepartmentType}>
                    <SelectTrigger id="vp-type" className="w-full">
                      <SelectValue placeholder="Select department type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vp-name">Applicant name</Label>
                    <Input id="vp-name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vp-role">Applicant role</Label>
                    <Input id="vp-role" placeholder="Chief, PIO, etc." required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vp-website">Department website or public agency page</Label>
                  <Input id="vp-website" placeholder="https://" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vp-info">
                    Additional information{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea id="vp-info" rows={3} placeholder="Anything else we should know" />
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-[#E2E8F5] bg-[#F7FAFD] p-3.5 text-sm leading-relaxed text-[#42536e]">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(v) => setConfirmed(v === true)}
                    className="mt-0.5"
                  />
                  I confirm that this agency operates primarily with volunteer personnel and that
                  the information provided is accurate.
                </label>

                <Button
                  type="submit"
                  className="w-full bg-[#1470AF] py-5 font-semibold text-white hover:bg-[#1470AF]/90"
                  disabled={sending}
                >
                  {sending ? "Submitting…" : "Submit for Review"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
