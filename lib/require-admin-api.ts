import { NextResponse } from "next/server"
import { isAdminRequest } from "@/lib/validate-admin-session"

/**
 * Call at the top of any admin API route handler.
 * Returns a 401 NextResponse if the caller is not an authenticated admin,
 * or null if the session is valid (meaning the route can proceed).
 */
export async function unauthorizedIfNotAdmin(): Promise<NextResponse | null> {
  const isAdmin = await isAdminRequest()
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
