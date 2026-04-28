import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"

/**
 * Call at the top of any admin API route handler.
 * Returns a 401 NextResponse if the caller is not an authenticated admin,
 * or null if the session is valid (meaning the route can proceed).
 */
export async function unauthorizedIfNotAdmin(): Promise<NextResponse | null> {
  const isAdmin = await checkAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
