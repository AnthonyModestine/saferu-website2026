"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Mail, MessageSquare, User, Building2, Calendar, CheckCircle, Filter } from "lucide-react"
import type { Ticket } from "@/lib/tickets-store"
import { markTicketReplied, deleteTicket } from "@/lib/admin-tickets"

const TOPIC_LABELS: Record<string, string> = {
  general: "General Inquiry",
  content: "Content Request",
  feedback: "Feedback",
  bug: "Report an Issue",
  partnership: "Partnership",
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type FilterStatus = "all" | "new" | "replied"

export function TicketsListClient({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterStatus>("all")
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = tickets.filter((t) => {
    if (filter === "new") return !t.repliedAt
    if (filter === "replied") return !!t.repliedAt
    return true
  })

  const handleMarkReplied = async (id: string) => {
    setError(null)
    setMarkingId(id)
    const result = await markTicketReplied(id)
    if (result.success) router.refresh()
    else setError(result.error ?? "Failed to mark as replied")
    setMarkingId(null)
  }

  const handleDeleteClick = (id: string) => setDeleteConfirmId(id)

  const handleDeleteConfirm = async () => {
    const id = deleteConfirmId
    if (!id) return
    setError(null)
    setDeletingId(id)
    setDeleteConfirmId(null)
    const result = await deleteTicket(id)
    if (result.success) router.refresh()
    else setError(result.error ?? "Failed to delete")
    setDeletingId(null)
  }

  const newCount = tickets.filter((t) => !t.repliedAt).length
  const repliedCount = tickets.filter((t) => !!t.repliedAt).length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Tickets
            </CardTitle>
            <CardDescription>
              {tickets.length === 0
                ? "No tickets yet."
                : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} — ${newCount} new, ${repliedCount} replied. Filter and mark as replied when you've sent a message.`}
            </CardDescription>
          </div>
          {tickets.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500 shrink-0" />
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>
        )}
        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-sm text-gray-500">
            {tickets.length === 0
              ? "When someone submits the form on the Contact page, their message will appear here."
              : `No ${filter === "new" ? "new" : "replied"} tickets. Try another filter.`}
          </p>
        ) : (
          <ul className="space-y-6">
            {filtered.map((ticket) => (
              <li
                key={ticket.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1470AF]/10 px-2.5 py-1 text-[#1470AF]">
                      {TOPIC_LABELS[ticket.topic] ?? ticket.topic}
                    </span>
                    {ticket.repliedAt && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-green-800">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Replied
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!ticket.repliedAt && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={markingId === ticket.id}
                        onClick={() => handleMarkReplied(ticket.id)}
                      >
                        {markingId === ticket.id ? "Marking…" : "Mark as replied"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-700 hover:bg-red-50 hover:text-red-800"
                      disabled={deletingId === ticket.id}
                      onClick={() => handleDeleteClick(ticket.id)}
                    >
                      {deletingId === ticket.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>{ticket.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <a href={`mailto:${ticket.email}`} className="text-[#1470AF] hover:underline">
                      {ticket.email}
                    </a>
                  </div>
                  {ticket.agency && (
                    <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                      <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
                      <span>{ticket.agency}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{ticket.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this contact submission. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
