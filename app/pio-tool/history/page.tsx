"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Search, MoreHorizontal, Download, Copy, FileText, Eye, Trash2, Check } from "lucide-react"
import Link from "next/link"
import {
  getPioHistoryItems,
  deletePioHistoryItem,
  type PioHistoryItem,
} from "@/lib/pio-history-store"
import { useSubscription } from "@/lib/use-subscription"
import { useAgency } from "@/lib/agency-context"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"
import { downloadPressReleasePDF } from "@/lib/pdf-export"

function formatHistoryReleaseDate(dateStr: string): string {
  const parsed = new Date(`${dateStr}T12:00:00`)
  if (Number.isFinite(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function extractPressReleaseBody(content: string): string {
  const withoutContact = content.split(/\n\n(?:\*\*)?Media Contact/i)[0]?.trim() || content
  const afterHeader = withoutContact.replace(/^[\s\S]*?For Immediate Release\n+/i, "").trim()
  return afterHeader || withoutContact || content
}

export default function HistoryPage() {
  const { isSubscribed } = useSubscription()
  const { settings: agencySettings } = useAgency()
  const [items, setItems] = useState<PioHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItem, setSelectedItem] = useState<PioHistoryItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)

  useEffect(() => {
    setItems(getPioHistoryItems())
  }, [])

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handlePreview = (item: PioHistoryItem) => {
    setSelectedItem(item)
    setPreviewOpen(true)
  }

  const handleCopy = async (item: PioHistoryItem) => {
    setCopyError(null)
    const ok = await copyTextToClipboard(item.content)
    if (ok) {
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
      return
    }
    setCopyError("Could not copy to clipboard. Try selecting the text manually.")
    setTimeout(() => setCopyError(null), 4000)
  }

  const handleExportPDF = async (item: PioHistoryItem) => {
    setExportingId(item.id)
    try {
      const isPressRelease = item.format === "Press Release"
      await downloadPressReleasePDF({
        agencyName: agencySettings.agencyName || "Agency Name",
        city: agencySettings.city || "City",
        state: agencySettings.state || "State",
        releaseDate: formatHistoryReleaseDate(item.date),
        content: isPressRelease ? extractPressReleaseBody(item.content) : item.content,
        contactName: agencySettings.contactName || "Contact Name",
        contactPhone: agencySettings.contactPhone || "Phone Number",
        contactPhone2: agencySettings.contactPhone2 || undefined,
        contactEmail: agencySettings.contactEmail || "email@agency.gov",
        logoUrl: agencySettings.logoUrl || undefined,
        boilerplate: isPressRelease ? agencySettings.boilerplate || undefined : undefined,
        documentLabel: isPressRelease ? "PRESS RELEASE" : "VIDEO REQUEST",
        includeContactSection: isPressRelease,
      })
    } finally {
      setExportingId(null)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteTarget(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deletePioHistoryItem(deleteTarget)
      setItems(getPioHistoryItems())
    }
    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {!isSubscribed && (
        <div className="rounded-xl border border-[#1470AF]/20 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#1a365d] text-lg">Get started with Press Center</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              $30/month. Confident communication for public safety — draft press releases and video requests in minutes without compromising oversight.
            </p>
          </div>
          <Button asChild className="shrink-0 bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold">
            <Link href="/pricing">Subscribe Now</Link>
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#1a365d]">History</h1>
        <p className="text-muted-foreground">
          View, export, and manage your press releases and video requests from the past 30 days. Items older than 30 days are automatically removed.
        </p>
        {copyError && (
          <p className="text-sm text-destructive mt-2">{copyError}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Items</CardTitle>
              <CardDescription>
                Last 30 days · {items.length} item{items.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{item.title}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.type}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{item.format}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.lastModified}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePreview(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleCopy(item)}>
                              {copiedId === item.id ? (
                                <Check className="mr-2 h-4 w-4" />
                              ) : (
                                <Copy className="mr-2 h-4 w-4" />
                              )}
                              {copiedId === item.id ? "Copied!" : "Copy"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void handleExportPDF(item)}>
                              <Download className="mr-2 h-4 w-4" />
                              {exportingId === item.id ? "Opening print dialog..." : "Export PDF"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No items found matching your search."
                  : "Nothing here yet. Create your first press release or video request. Items appear here for 30 days."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              {selectedItem?.format} · {selectedItem?.lastModified}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans rounded-lg border border-border bg-muted/50 p-4">
              {selectedItem?.content}
            </pre>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => selectedItem && void handleCopy(selectedItem)}
            >
              {selectedItem && copiedId === selectedItem.id ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              disabled={!selectedItem || exportingId === selectedItem.id}
              onClick={() => selectedItem && void handleExportPDF(selectedItem)}
            >
              <Download className="mr-2 h-4 w-4" />
              {selectedItem && exportingId === selectedItem.id ? "Opening print dialog..." : "Export PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
