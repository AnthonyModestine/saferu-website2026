"use server"

import { cookies } from "next/headers"
import { listAdminUsers } from "@/lib/admin-users-store"
import { verifyPassword } from "@/lib/password"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ""
const ADMIN_COOKIE_NAME = "saferu_admin_session"
const ADMIN_SESSION_VALUE = "authenticated"

async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

/**
 * @param identifier Username, full email, or email local-part (before @). Empty string = legacy env password only.
 */
export async function verifyAdminPassword(identifier: string, password: string): Promise<boolean> {
  const id = identifier.trim()
  const lower = id.toLowerCase()

  if (!id && password === ADMIN_PASSWORD) {
    await setAdminSessionCookie()
    return true
  }

  const admins = await listAdminUsers()
  for (const admin of admins) {
    const email = admin.email.trim().toLowerCase()
    const emailMatch = email === lower
    const userMatch = admin.username?.trim().toLowerCase() === lower
    const localPart = email.includes("@") ? email.split("@")[0]! : ""
    const localMatch = localPart.length > 0 && localPart === lower
    if (!emailMatch && !userMatch && !localMatch) continue

    if (await verifyPassword(password, admin.passwordHash)) {
      await setAdminSessionCookie()
      return true
    }
    return false
  }

  if (lower === "admin" && password === ADMIN_PASSWORD) {
    await setAdminSessionCookie()
    return true
  }

  return false
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)
  return session?.value === ADMIN_SESSION_VALUE
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}
