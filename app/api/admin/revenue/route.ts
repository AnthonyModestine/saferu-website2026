import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import { getRevenueSummary } from "@/lib/admin-members"

export async function GET() {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const result = await getRevenueSummary()
  return NextResponse.json(result)
}
