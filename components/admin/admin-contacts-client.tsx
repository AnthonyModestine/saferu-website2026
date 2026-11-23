"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ContactRound,
  Download,
  Loader2,
  Mail,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { AdminContact } from "@/lib/contacts-store"

export function AdminContactsClient() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [contacts, setContacts] = useState<AdminContact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (q = "") => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/contacts?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load contacts")
      setContacts(data.contacts || [])
      setSelected(new Set())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const allSelected = useMemo(
    () => contacts.length > 0 && contacts.every((c) => selected.has(c.id)),
    [contacts, selected]
  )

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(contacts.map((c) => c.id)))
    }
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    setStatus(null)
    setError(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/admin/contacts", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Import failed")
      setStatus(
        `Imported: ${data.added} added, ${data.updated} updated` +
          (data.invalid ? `, ${data.invalid} invalid skipped` : "")
      )
      await load(search)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed")
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} contact${selected.size === 1 ? "" : "s"}?`)) return
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      setStatus(`Deleted ${data.deleted} contact${data.deleted === 1 ? "" : "s"}`)
      await load(search)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    window.location.href = `/api/admin/contacts/export?q=${encodeURIComponent(search)}`
  }

  const handleSend = async (sendAll: boolean) => {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required")
      return
    }
    const count = sendAll ? contacts.length : selected.size
    if (count === 0) {
      setError(sendAll ? "No contacts to email" : "Select at least one contact")
      return
    }
    if (
      !confirm(
        `Send this email to ${count} contact${count === 1 ? "" : "s"}? This uses Resend and cannot be undone.`
      )
    ) {
      return
    }
    setSending(true)
    setStatus(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/contacts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          sendAll,
          ids: sendAll ? undefined : [...selected],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Send failed")
      setStatus(
        `Sent ${data.sent} of ${data.total}` +
          (data.failed ? ` (${data.failed} failed)` : "")
      )
      if (data.errors?.length) {
        setError(data.errors.join(" · "))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <p className="mt-1 text-gray-500">
          Outreach mailing list — separate from SaferU member accounts. Upload a CSV, export anytime, or
          email selected people via Resend.
        </p>
      </div>

      {(status || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {error || status}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" />
              Import CSV
            </CardTitle>
            <CardDescription>
              Headers: <code>email</code>, optional <code>name</code>, <code>agency</code>,{" "}
              <code>notes</code>. Duplicates merge by email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImport(file)
              }}
            />
            <Button
              type="button"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {importing ? "Importing…" : "Upload CSV"}
            </Button>
            <Button type="button" variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5" />
              Send email
            </CardTitle>
            <CardDescription>
              Optional placeholders: {"{{name}}"}, {"{{agency}}"}, {"{{email}}"}. Max 500 recipients per
              send.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="SaferU update for {{agency}}"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder={"Hi {{name}},\n\n…"}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={sending || selected.size === 0}
                onClick={() => void handleSend(false)}
              >
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send to selected ({selected.size})
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={sending || contacts.length === 0}
                onClick={() => void handleSend(true)}
              >
                Send to all listed ({contacts.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ContactRound className="h-5 w-5" />
              Contact list
            </CardTitle>
            <CardDescription>
              {loading ? "Loading…" : `${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-56 pl-8"
                placeholder="Search email, name, agency"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load(search)
                }}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => void load(search)}>
              Search
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting || selected.size === 0}
              onClick={() => void handleDelete()}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete selected
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Agency</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      Loading contacts…
                    </td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No contacts yet. Upload a CSV to get started.
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(c.id)}
                          onCheckedChange={() => toggleOne(c.id)}
                          aria-label={`Select ${c.email}`}
                        />
                      </td>
                      <td className="px-3 py-2 font-medium">{c.email}</td>
                      <td className="px-3 py-2">{c.name || "—"}</td>
                      <td className="px-3 py-2">{c.agency || "—"}</td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-muted-foreground">
                        {c.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
