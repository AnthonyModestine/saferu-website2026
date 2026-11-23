import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import {
  deleteContacts,
  listContacts,
  upsertContacts,
} from "@/lib/contacts-store"
import { csvRowsToObjects, mapContactCsvRow, parseCsv } from "@/lib/parse-csv"

export async function GET(request: Request) {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("q") || ""
  const contacts = await listContacts(search)
  return NextResponse.json({ contacts, total: contacts.length })
}

export async function POST(request: Request) {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("multipart/form-data") || contentType.includes("text/csv")) {
      let csvText = ""
      if (contentType.includes("multipart/form-data")) {
        const form = await request.formData()
        const file = form.get("file")
        if (!(file instanceof File)) {
          return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
        }
        csvText = await file.text()
      } else {
        csvText = await request.text()
      }

      const rows = parseCsv(csvText)
      if (rows.length < 2) {
        return NextResponse.json(
          { error: "CSV needs a header row and at least one contact" },
          { status: 400 }
        )
      }
      const objects = csvRowsToObjects(rows)
      const mapped = objects.map(mapContactCsvRow)
      const result = await upsertContacts(mapped.map((r) => ({ ...r, source: "csv" })))
      return NextResponse.json({ ok: true, ...result })
    }

    const body = await request.json()
    if (Array.isArray(body.contacts)) {
      const result = await upsertContacts(
        body.contacts.map((c: Record<string, string>) => ({
          email: c.email || "",
          name: c.name || "",
          agency: c.agency || "",
          notes: c.notes || "",
          source: c.source || "manual",
        }))
      )
      return NextResponse.json({ ok: true, ...result })
    }

    return NextResponse.json({ error: "Provide a CSV file or contacts array" }, { status: 400 })
  } catch (err) {
    console.error("[admin/contacts] import failed:", err)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : []
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 })
    }
    const deleted = await deleteContacts(ids)
    return NextResponse.json({ ok: true, deleted })
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
