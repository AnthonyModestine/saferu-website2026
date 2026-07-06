"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { MEMBER_FEEDBACK_HELP_OPTIONS } from "@/lib/member-feedback-constants"
import { cn } from "@/lib/utils"

type Step = "rating" | "helped" | "testimonial" | "improvement" | "done"

export function MemberFeedbackPrompt() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [step, setStep] = useState<Step>("rating")
  const [rating, setRating] = useState<number | null>(null)
  const [helpedWith, setHelpedWith] = useState<string[]>([])
  const [helpedWithOther, setHelpedWithOther] = useState("")
  const [testimonial, setTestimonial] = useState("")
  const [improvementFeedback, setImprovementFeedback] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdminRoute = pathname.startsWith("/admin")

  const checkEligibility = useCallback(async () => {
    if (isAdminRoute) return
    try {
      const res = await fetch("/api/members/feedback")
      const data = await res.json()
      if (data?.shouldShow && !dismissed) {
        setOpen(true)
      }
    } catch {
      // ignore
    }
  }, [isAdminRoute, dismissed])

  useEffect(() => {
    setDismissed(false)
  }, [pathname])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkEligibility()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [checkEligibility, pathname, isAdminRoute])

  const handleOpenChange = (next: boolean) => {
    if (!next && step !== "done") {
      setDismissed(true)
    }
    setOpen(next)
  }

  const handleRatingSelect = (value: number) => {
    setRating(value)
    setError(null)
    if (value >= 3) {
      setStep("helped")
    } else {
      setStep("improvement")
    }
  }

  const toggleHelped = (value: string, checked: boolean) => {
    setHelpedWith((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    )
    setError(null)
  }

  const handleSubmit = async () => {
    if (rating == null) return
    setError(null)
    setSubmitting(true)

    try {
      const body =
        rating >= 3
          ? {
              helpfulnessRating: rating,
              helpedWith,
              helpedWithOther: helpedWith.includes("other") ? helpedWithOther : undefined,
              testimonial,
            }
          : {
              helpfulnessRating: rating,
              improvementFeedback,
            }

      const res = await fetch("/api/members/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to submit. Please try again.")
        return
      }
      setStep("done")
    } catch {
      setError("Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (isAdminRoute) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {step === "done" ? (
          <>
            <DialogHeader>
              <DialogTitle>Thank you</DialogTitle>
              <DialogDescription>
                Your feedback helps us improve SaferU and show other departments how it can help
                their community messaging.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : step === "rating" ? (
          <>
            <DialogHeader>
              <DialogTitle>Quick feedback</DialogTitle>
              <DialogDescription>
                You&apos;ve been using SaferU for a few weeks — we&apos;d love to hear how it&apos;s
                going.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-foreground">
                How helpful has SaferU been for your department?
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingSelect(value)}
                    className={cn(
                      "flex flex-col items-center rounded-lg border px-2 py-3 text-center transition-colors hover:border-[#1470AF] hover:bg-[#1470AF]/5",
                      rating === value && "border-[#1470AF] bg-[#1470AF]/10"
                    )}
                  >
                    <span className="text-lg font-bold text-[#1470AF]">{value}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Not helpful</span>
                <span>Extremely helpful</span>
              </div>
            </div>
          </>
        ) : step === "helped" ? (
          <>
            <DialogHeader>
              <DialogTitle>What helped most?</DialogTitle>
              <DialogDescription>Select all that apply.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-foreground">
                What has SaferU helped your department with the most?
              </p>
              <div className="space-y-2">
                {MEMBER_FEEDBACK_HELP_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start gap-3">
                    <Checkbox
                      id={`help-${option.value}`}
                      checked={helpedWith.includes(option.value)}
                      onCheckedChange={(checked) =>
                        toggleHelped(option.value, checked === true)
                      }
                    />
                    <Label htmlFor={`help-${option.value}`} className="font-normal leading-snug">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              {helpedWith.includes("other") && (
                <Input
                  placeholder="Please describe"
                  value={helpedWithOther}
                  onChange={(e) => setHelpedWithOther(e.target.value)}
                />
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setStep("rating")}>
                Back
              </Button>
              <Button
                type="button"
                className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                onClick={() => {
                  if (helpedWith.length === 0) {
                    setError("Select at least one option")
                    return
                  }
                  if (helpedWith.includes("other") && !helpedWithOther.trim()) {
                    setError("Please describe the other option")
                    return
                  }
                  setError(null)
                  setStep("testimonial")
                }}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : step === "testimonial" ? (
          <>
            <DialogHeader>
              <DialogTitle>Share your experience</DialogTitle>
              <DialogDescription>
                This can be a sentence or two about your experience, what you&apos;ve found useful,
                or why it may be worth trying.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-foreground">
                What would you tell another department that is considering using SaferU?
              </p>
              <Textarea
                rows={4}
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="Share your experience in your own words..."
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setStep("helped")}>
                Back
              </Button>
              <Button
                type="button"
                className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Submitting..." : "Submit feedback"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Help us improve</DialogTitle>
              <DialogDescription>
                Tell us what felt missing, unclear, difficult to use, or not valuable enough.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm font-medium text-foreground">
                What could we improve to make SaferU more useful for your department?
              </p>
              <Textarea
                rows={4}
                value={improvementFeedback}
                onChange={(e) => setImprovementFeedback(e.target.value)}
                placeholder="Your suggestions..."
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setStep("rating")}>
                Back
              </Button>
              <Button
                type="button"
                className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Submitting..." : "Submit feedback"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
