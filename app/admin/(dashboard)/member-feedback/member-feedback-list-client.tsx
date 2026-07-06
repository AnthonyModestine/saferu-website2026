"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MessageSquareQuote, User, Building2, Calendar, Star, Trash2 } from "lucide-react"
import type { MemberFeedback } from "@/lib/member-feedback-store"
import { formatHelpedWithLabels } from "@/lib/member-feedback-constants"
import { formatDepartmentLabel } from "@/lib/department-types"
import { deleteMemberFeedbackEntry } from "@/lib/admin-member-feedback"

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MemberFeedbackListClient({ feedback }: { feedback: MemberFeedback[] }) {
  const router = useRouter()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const positiveCount = feedback.filter((f) => f.helpfulnessRating >= 3).length
  const negativeCount = feedback.length - positiveCount

  const handleDeleteConfirm = async () => {
    const id = deleteConfirmId
    if (!id) return
    setError(null)
    setDeletingId(id)
    setDeleteConfirmId(null)
    const result = await deleteMemberFeedbackEntry(id)
    if (result.success) router.refresh()
    else setError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareQuote className="h-5 w-5" />
            Member feedback
          </CardTitle>
          <CardDescription>
            {feedback.length === 0
              ? "No responses yet. Free members see this survey 20 days after signup until they respond."
              : `${feedback.length} response${feedback.length !== 1 ? "s" : ""} — ${positiveCount} positive (3–5), ${negativeCount} needs improvement (1–2).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {feedback.length === 0 ? (
            <p className="text-sm text-gray-500">Responses will appear here.</p>
          ) : (
            feedback.map((entry) => {
              const isPositive = entry.helpfulnessRating >= 3
              const helpedLabels = formatHelpedWithLabels(
                entry.helpedWith,
                entry.helpedWithOther
              )

              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            isPositive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-amber-100 text-amber-900 hover:bg-amber-100"
                          }
                        >
                          {entry.helpfulnessRating}/5 — {isPositive ? "Positive" : "Needs improvement"}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="h-3.5 w-3.5" />
                          {entry.helpfulnessRating}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-gray-400" />
                          {entry.memberName || entry.email}
                        </span>
                        {entry.agency && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {entry.agency}
                          </span>
                        )}
                        <span className="text-gray-500">
                          {formatDepartmentLabel(entry.departmentType, entry.departmentOther)}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{entry.email}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-red-600 hover:text-red-700"
                      disabled={deletingId === entry.id}
                      onClick={() => setDeleteConfirmId(entry.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>

                  {isPositive && helpedLabels.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {helpedLabels.map((label) => (
                        <Badge key={label} variant="secondary">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {entry.testimonial && (
                    <blockquote className="mt-4 border-l-4 border-[#1470AF] bg-[#1470AF]/5 px-4 py-3 text-sm text-gray-800">
                      &ldquo;{entry.testimonial}&rdquo;
                    </blockquote>
                  )}

                  {entry.improvementFeedback && (
                    <div className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-950">
                      <p className="font-medium">What to improve</p>
                      <p className="mt-1 whitespace-pre-wrap">{entry.improvementFeedback}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the response permanently. The member could submit again if you delete
              their only response.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDeleteConfirm()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
