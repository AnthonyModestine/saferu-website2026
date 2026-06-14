"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { submitPioFeedback } from "@/lib/pio-analytics-client"

const NEGATIVE_REASONS = [
  { value: "missing_information", label: "Missing Information" },
  { value: "too_long", label: "Too Long" },
  { value: "too_short", label: "Too Short" },
  { value: "wrong_tone", label: "Wrong Tone" },
  { value: "formatting_issue", label: "Formatting Issue" },
  { value: "other", label: "Other" },
] as const

interface Props {
  generationSessionId: string
  onDone?: () => void
}

export function GenerationFeedback({ generationSessionId, onDone }: Props) {
  const [step, setStep] = useState<"ask" | "reason" | "done">("ask")
  const [reason, setReason] = useState<string>("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const submit = async (rating: "positive" | "negative", reasonValue?: string) => {
    setSubmitting(true)
    const ok = await submitPioFeedback({
      generationSessionId,
      rating,
      reason: reasonValue,
      comment: comment.trim() || undefined,
    })
    setSubmitting(false)
    if (ok) {
      setStep("done")
      onDone?.()
    }
  }

  if (step === "done") {
    return (
      <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
        Thank you for your feedback.
      </p>
    )
  }

  if (step === "reason") {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">What could be improved?</p>
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
          placeholder="Optional comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          disabled={!reason || submitting}
          onClick={() => void submit("negative", reason)}
        >
          Submit feedback
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground mb-3">Was this helpful?</p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => void submit("positive")}
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          Yes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => setStep("reason")}
        >
          <ThumbsDown className="mr-2 h-4 w-4" />
          No
        </Button>
      </div>
    </div>
  )
}
