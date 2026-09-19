"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"

const NEGATIVE_REASONS = [
  { value: "logo_issue", label: "Logo problem" },
  { value: "text_hard_to_read", label: "Text hard to read" },
  { value: "wrong_visual", label: "Wrong visual / scene" },
  { value: "inaccurate", label: "Inaccurate or unsafe" },
  { value: "looks_unprofessional", label: "Looks unprofessional" },
  { value: "other", label: "Other" },
] as const

interface Props {
  graphicId: string
  onDone?: () => void
}

export function GraphicStudioFeedback({ graphicId, onDone }: Props) {
  const [step, setStep] = useState<"ask" | "reason" | "done">("ask")
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (rating: "positive" | "negative", reasonValue?: string) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graphicId,
          rating,
          reason: reasonValue,
          comment: comment.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { error?: string }).error || "Could not save feedback."))
        return
      }
      setStep("done")
      onDone?.()
    } catch {
      setError("Could not save feedback. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "done") {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Thank you — your feedback helps us improve Graphic Studio.
      </p>
    )
  }

  if (step === "reason") {
    return (
      <div className="space-y-3 rounded-xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#0f1c3f]">What could we improve?</p>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_REASONS.map((r) => (
            <Button
              key={r.value}
              type="button"
              size="sm"
              variant={reason === r.value ? "default" : "outline"}
              disabled={submitting}
              onClick={() => setReason(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Textarea
          placeholder="Optional details (what looked off, what you expected…)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={1000}
          className="text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!reason || submitting}
            onClick={() => void submit("negative", reason)}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit feedback
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={submitting}
            onClick={() => {
              setStep("ask")
              setReason("")
              setError(null)
            }}
          >
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-[#0f1c3f]">How does this graphic look?</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => void submit("positive")}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ThumbsUp className="mr-2 h-4 w-4" />
          )}
          Thumbs up
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => setStep("reason")}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          Thumbs down
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
