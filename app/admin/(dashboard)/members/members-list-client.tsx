"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Users, CreditCard, XCircle, Trash2, Plus, ChevronDown, Sparkles, Search, UserX, UserCheck, Filter, KeyRound } from "lucide-react"
import type { MemberRow } from "@/lib/admin-members"
import { deleteMember, addMemberAdmin, grantPioTrial, setMemberDisabled, setMemberTemporaryPassword } from "@/lib/admin-members"

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function trialStatus(m: MemberRow): string | null {
  if (!m.trialEndAt) return null
  const now = Math.floor(Date.now() / 1000)
  if (m.trialEndAt <= now) return null // expired
  const daysLeft = Math.ceil((m.trialEndAt - now) / (24 * 60 * 60))
  const endDate = formatDate(m.trialEndAt)
  return daysLeft <= 1 ? `Press Center trial until ${endDate}` : `Press Center trial: ${daysLeft} days left (expires ${endDate})`
}

function isOnActiveTrial(m: MemberRow): boolean {
  if (!m.trialEndAt) return false
  return m.trialEndAt > Math.floor(Date.now() / 1000)
}

function buildCSV(members: MemberRow[]): string {
  const headers = ["Email", "Name", "Customer ID", "Paid", "Access", "Subscription status", "Joined"]
  const rows = members.map((m) => [
    m.email ?? "",
    m.name ?? "",
    m.id,
    m.paid ? "Yes" : "No",
    m.access,
    m.subscriptionStatus ?? "",
    formatDate(m.createdAt),
  ])
  const escape = (s: string) => {
    const t = String(s).replace(/"/g, '""')
    return t.includes(",") || t.includes('"') || t.includes("\n") ? `"${t}"` : t
  }
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\r\n")
}

function downloadCSV(members: MemberRow[]) {
  const csv = buildCSV(members)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `saferu-members-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  initialMembers: MemberRow[]
  total: number
  error?: string
}

export function MembersListClient({ initialMembers, total, error }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState("")
  const [addName, setAddName] = useState("")
  const [addAgency, setAddAgency] = useState("")
  const [addPassword, setAddPassword] = useState("")
  const [addError, setAddError] = useState<string | null>(null)
  const [addSaving, setAddSaving] = useState(false)
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<MemberRow | null>(null)
  const [trialGranting, setTrialGranting] = useState<string | null>(null)
  const [trialError, setTrialError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [disablingId, setDisablingId] = useState<string | null>(null)
  const [disableError, setDisableError] = useState<string | null>(null)
  const [tempPasswordMember, setTempPasswordMember] = useState<MemberRow | null>(null)
  const [tempPasswordValue, setTempPasswordValue] = useState("")
  const [tempPasswordSaving, setTempPasswordSaving] = useState(false)
  const [tempPasswordError, setTempPasswordError] = useState<string | null>(null)
  const [tempPasswordSuccess, setTempPasswordSuccess] = useState<string | null>(null)
  const [filterPaid, setFilterPaid] = useState<"all" | "paying" | "free">("all")
  const [filterTrial, setFilterTrial] = useState<"all" | "on_trial" | "not_on_trial">("all")
  const [filterJoined, setFilterJoined] = useState<"newest" | "oldest">("newest")
  const [filterDateRange, setFilterDateRange] = useState<"all" | "7d" | "30d" | "90d">("all")

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    if (!addEmail.trim()) {
      setAddError("Email is required")
      return
    }
    setAddSaving(true)
    const result = await addMemberAdmin({
      email: addEmail.trim(),
      name: addName.trim() || undefined,
      agency: addAgency.trim() || undefined,
      password: addPassword.trim() || undefined,
    })
    if (result.success) {
      setAddOpen(false)
      setAddEmail("")
      setAddName("")
      setAddAgency("")
      setAddPassword("")
      router.refresh()
    } else {
      setAddError(result.error ?? "Failed to add member")
    }
    setAddSaving(false)
  }

  const performDelete = async (member: MemberRow) => {
    setDeletingId(member.id)
    setDeleteError(null)
    setDeleteConfirmMember(null)
    const result = await deleteMember(member.id)
    if (result.success) {
      router.refresh()
    } else {
      setDeleteError(result.error ?? "Failed to delete")
    }
    setDeletingId(null)
  }

  const handleDeleteClick = (member: MemberRow) => {
    if (member.id.startsWith("example_")) {
      window.alert("This is sample data. Use \"Add member\" to add real members — then you can delete them from the list.")
      return
    }
    setDeleteConfirmMember(member)
  }

  const handleGrantTrial = async (member: MemberRow, days: number) => {
    if (member.id.startsWith("example_") || !member.email) return
    setTrialError(null)
    setTrialGranting(`${member.id}-${days}`)
    const result = await grantPioTrial(member.email, days)
    if (result.success) {
      router.refresh()
    } else {
      setTrialError(result.error ?? "Failed to grant trial")
    }
    setTrialGranting(null)
  }

  const handleSetDisabled = async (member: MemberRow, disabled: boolean) => {
    if (member.id.startsWith("example_") || !member.email) return
    setDisableError(null)
    setDisablingId(member.id)
    const result = await setMemberDisabled(member.email, disabled)
    if (result.success) {
      router.refresh()
    } else {
      setDisableError(result.error ?? "Failed to update")
    }
    setDisablingId(null)
  }

  const generateTempPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789"
    let p = ""
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
    setTempPasswordValue(p)
  }

  const handleSetTemporaryPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tempPasswordMember || tempPasswordValue.trim().length < 8) return
    setTempPasswordError(null)
    setTempPasswordSaving(true)
    const result = await setMemberTemporaryPassword(tempPasswordMember.id, tempPasswordValue.trim())
    if (result.success) {
      setTempPasswordSuccess(tempPasswordValue.trim())
    } else {
      setTempPasswordError(result.error ?? "Failed to set password")
    }
    setTempPasswordSaving(false)
  }

  const closeTempPasswordDialog = () => {
    setTempPasswordMember(null)
    setTempPasswordValue("")
    setTempPasswordError(null)
    setTempPasswordSuccess(null)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-amber-700">{error}</p>
          <p className="mt-2 text-sm text-gray-500">
            Ensure Stripe is configured (STRIPE_SECRET_KEY). Members are Stripe customers (e.g. from checkout).
          </p>
        </CardContent>
      </Card>
    )
  }

  const exampleMembers: MemberRow[] = [
    {
      id: "example_1",
      email: "jane.doe@agency.gov",
      name: "Jane Doe",
      createdAt: Math.floor(Date.now() / 1000) - 14 * 24 * 3600,
      paid: true,
      access: "Press Center Subscriber",
      subscriptionStatus: "active",
      trialEndAt: null,
      disabled: false,
    },
    {
      id: "example_2",
      email: "john.smith@pd.example.org",
      name: "John Smith",
      createdAt: Math.floor(Date.now() / 1000) - 12 * 24 * 3600,
      paid: false,
      access: "Free",
      subscriptionStatus: null,
      trialEndAt: Math.floor(Date.now() / 1000) + 5 * 24 * 3600, // 5 days from now
      disabled: false,
    },
  ]

  const membersToShow = total === 0 ? exampleMembers : initialMembers
  const isExample = total === 0

  const query = searchQuery.trim().toLowerCase()
  const now = Math.floor(Date.now() / 1000)
  const dateRangeCutoff =
    filterDateRange === "7d" ? now - 7 * 24 * 3600
    : filterDateRange === "30d" ? now - 30 * 24 * 3600
    : filterDateRange === "90d" ? now - 90 * 24 * 3600
    : 0

  let filteredMembers = membersToShow.filter((m) => {
    if (query) {
      const email = (m.email ?? "").toLowerCase()
      const name = (m.name ?? "").toLowerCase()
      const id = (m.id ?? "").toLowerCase()
      if (!email.includes(query) && !name.includes(query) && !id.includes(query)) return false
    }
    if (filterPaid === "paying" && !m.paid) return false
    if (filterPaid === "free" && m.paid) return false
    if (filterTrial === "on_trial" && !isOnActiveTrial(m)) return false
    if (filterTrial === "not_on_trial" && isOnActiveTrial(m)) return false
    if (dateRangeCutoff > 0 && m.createdAt < dateRangeCutoff) return false
    return true
  })

  filteredMembers = [...filteredMembers].sort((a, b) =>
    filterJoined === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>
            All members {total > 0 ? `(${total})` : ""}
            {isExample && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-800">
                Example data
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {total > 0 && `${initialMembers.filter((m) => m.paid).length} paying. `}
            {isExample && "Showing example rows. Real members appear when people sign up or pay. "}
            Delete members with the row action. Export downloads all members to CSV (email, name, customer ID, paid, access, join date). No passwords or card details.
          </CardDescription>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="default" onClick={() => setAddOpen(true)} className="bg-[#1470AF] hover:bg-[#1470AF]/90">
            <Plus className="mr-2 h-4 w-4" />
            Add member
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadCSV(total > 0 ? initialMembers : exampleMembers)}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV {total > 0 ? `(${total})` : "(sample)"}
          </Button>
        </div>
      </CardHeader>

      <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) setAddError(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Add a member to your list. They&apos;ll appear as a free member. Passwords are stored securely and never shown in the backend. If the email already exists, you&apos;ll get an error.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            {addError && (
              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{addError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="member@agency.gov"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Name (optional)</Label>
              <Input
                id="add-name"
                placeholder="Jane Doe"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-agency">Agency (optional)</Label>
              <Input
                id="add-agency"
                placeholder="Agency name"
                value={addAgency}
                onChange={(e) => setAddAgency(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Temporary password (optional)</Label>
              <PasswordInput
                id="add-password"
                placeholder="Min 8 characters — never shown in backend"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Stored securely. Not visible anywhere in admin or exports. Give this to the member so they can sign in later.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSaving} className="bg-[#1470AF] hover:bg-[#1470AF]/90">
                {addSaving ? "Adding…" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tempPasswordMember} onOpenChange={(open) => { if (!open) closeTempPasswordDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set temporary password</DialogTitle>
            <DialogDescription>
              {tempPasswordMember
                ? `Set a temporary password for ${tempPasswordMember.email ?? tempPasswordMember.name ?? "this member"}. They can use it to sign in and change it later in Account settings.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {tempPasswordSuccess ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
                Password set. Share this with the user so they can sign in (they can change it in Account settings).
              </p>
              <div className="flex items-center gap-2">
                <Input readOnly value={tempPasswordSuccess} className="font-mono bg-muted" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(tempPasswordSuccess ?? ""); closeTempPasswordDialog(); router.refresh() }}
                >
                  Copy
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeTempPasswordDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSetTemporaryPassword} className="space-y-4">
              {tempPasswordError && (
                <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{tempPasswordError}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="temp-password">Temporary password (min 8 characters)</Label>
                <div className="flex gap-2">
                  <Input
                    id="temp-password"
                    type="text"
                    autoComplete="off"
                    placeholder="Min 8 characters"
                    value={tempPasswordValue}
                    onChange={(e) => setTempPasswordValue(e.target.value)}
                    minLength={8}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateTempPassword}>
                    Generate
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeTempPasswordDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={tempPasswordSaving || tempPasswordValue.trim().length < 8} className="bg-[#1470AF] hover:bg-[#1470AF]/90">
                  {tempPasswordSaving ? "Setting…" : "Set password"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmMember} onOpenChange={(open) => { if (!open) setDeleteConfirmMember(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete member</DialogTitle>
            <DialogDescription>
              {deleteConfirmMember
                ? `Are you sure you want to delete ${deleteConfirmMember.email || deleteConfirmMember.name || deleteConfirmMember.id}? This will remove them from SaferU and Stripe. Their customer record and any active subscriptions will be canceled. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmMember(null)}>
              No
            </Button>
            <Button
              variant="destructive"
              disabled={!!deleteConfirmMember && deletingId === deleteConfirmMember.id}
              onClick={() => deleteConfirmMember && performDelete(deleteConfirmMember)}
            >
              {deleteConfirmMember && deletingId === deleteConfirmMember.id ? "Deleting…" : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContent>
        {deleteError && (
          <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-800">{deleteError}</p>
        )}
        {trialError && (
          <p className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{trialError}</p>
        )}
        {disableError && (
          <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-800">{disableError}</p>
        )}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by email, name, or customer ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={filterPaid} onValueChange={(v) => setFilterPaid(v as "all" | "paying" | "free")}>
              <SelectTrigger className="w-[130px]" size="sm">
                <SelectValue placeholder="Paid" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paying">Paying</SelectItem>
                <SelectItem value="free">Not paying</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTrial} onValueChange={(v) => setFilterTrial(v as "all" | "on_trial" | "not_on_trial")}>
              <SelectTrigger className="w-[130px]" size="sm">
                <SelectValue placeholder="Trial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="on_trial">On trial</SelectItem>
                <SelectItem value="not_on_trial">Not on trial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterJoined} onValueChange={(v) => setFilterJoined(v as "newest" | "oldest")}>
              <SelectTrigger className="w-[140px]" size="sm">
                <SelectValue placeholder="Date joined" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDateRange} onValueChange={(v) => setFilterDateRange(v as "all" | "7d" | "30d" | "90d")}>
              <SelectTrigger className="w-[120px]" size="sm">
                <SelectValue placeholder="Joined" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(query || filterPaid !== "all" || filterTrial !== "all" || filterDateRange !== "all") && (
            <span className="text-sm text-muted-foreground">
              Showing {filteredMembers.length} of {membersToShow.length} members
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 pr-4 font-medium">Email</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Paid</th>
                <th className="pb-3 pr-4 font-medium">Access</th>
                <th className="pb-3 pr-4 font-medium">Joined</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    {filteredMembers.length === 0 && membersToShow.length > 0
                      ? "No members match the current filters. Try changing Paid, Trial, or Date joined."
                      : query
                        ? "No members match your search. Try a different email, name, or customer ID."
                        : "No members yet."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                <tr
                  key={m.id}
                  className={`border-b border-gray-100 ${isExample && m.id.startsWith("example_") ? "bg-amber-50/50" : ""}`}
                >
                  <td className="py-3 pr-4 text-gray-900">{m.email ?? "—"}</td>
                  <td className="py-3 pr-4 text-gray-700">{m.name ?? "—"}</td>
                  <td className="py-3 pr-4">
                    {m.paid ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-800">
                        <CreditCard className="h-3.5 w-3.5" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                        <XCircle className="h-3.5 w-3.5" />
                        No
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{m.access}</td>
                  <td className="py-3 pr-4 text-gray-500">{formatDate(m.createdAt)}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.disabled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                          <UserX className="h-3.5 w-3.5" />
                          Disabled
                        </span>
                      )}
                      {trialStatus(m) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">
                          <Sparkles className="h-3.5 w-3.5" />
                          {trialStatus(m)}
                        </span>
                      )}
                      {!m.disabled && !trialStatus(m) && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={!m.id.startsWith("example_") && deletingId === m.id}
                          aria-label="Actions"
                        >
                          Actions
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.email && !m.id.startsWith("example_") && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleGrantTrial(m, 7)}
                              disabled={trialGranting === `${m.id}-7`}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {trialGranting === `${m.id}-7` ? "Granting…" : "Start 7-day Press Center trial"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleGrantTrial(m, 30)}
                              disabled={trialGranting === `${m.id}-30`}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {trialGranting === `${m.id}-30` ? "Granting…" : "Start 30-day Press Center trial"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {m.email && !m.id.startsWith("example_") && (
                          <>
                            {m.disabled ? (
                              <DropdownMenuItem
                                onClick={() => handleSetDisabled(m, false)}
                                disabled={disablingId === m.id}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                {disablingId === m.id ? "Enabling…" : "Enable user"}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleSetDisabled(m, true)}
                                disabled={disablingId === m.id}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                {disablingId === m.id ? "Disabling…" : "Disable user"}
                              </DropdownMenuItem>
                            )}
                            {m.id.startsWith("free_") && (
                              <DropdownMenuItem onClick={() => { setTempPasswordMember(m); setTempPasswordSuccess(null); setTempPasswordValue(""); setTempPasswordError(null) }}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Set temporary password
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDeleteClick(m)}
                          disabled={!m.id.startsWith("example_") && deletingId === m.id}
                          className="text-red-700 focus:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {!m.id.startsWith("example_") && deletingId === m.id ? "Deleting…" : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
