import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import { contactsToCsv, listContacts } from "@/lib/contacts-store"

export async function GET(request: Request) {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("q") || ""
  const contacts = await listContacts(search)
  const csv = contactsToCsv(contacts)
  const stamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="saferu-contacts-${stamp}.csv"`,
    },
  })
}
