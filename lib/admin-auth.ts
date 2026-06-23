"use server"

import { listAdminUsers } from "@/lib/admin-users-store"
import { verifyPassword } from "@/lib/password"
import { createAdminSession, getAdminSession, clearAdminSession } from "@/lib/admin-session"

/** Bootstrap admin when no admin-users.json entries exist (set ADMIN_PASSWORD_HASH on Vercel). */
async function verifyBootstrapAdmin(password: string): Promise<{ id: string; email: string } | null> {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim()
  if (!hash) return null
  const valid = await verifyPassword(password, hash)
  if (!valid) return null
  const email = (process.env.ADMIN_LOGIN_EMAIL ?? "admin@saferu.com").trim().toLowerCase()
  return { id: "env_bootstrap", email }
}

/**
 * @param identifier Username, full email, or email local-part (before @).
 */
export async function verifyAdminPassword(identifier: string, password: string): Promise<boolean> {
  const id = identifier.trim()
  const lower = id.toLowerCase()

  const admins = await listAdminUsers()
  for (const admin of admins) {
    const email = admin.email.trim().toLowerCase()
    const emailMatch = email === lower
    const userMatch = admin.username?.trim().toLowerCase() === lower
    const localPart = email.includes("@") ? email.split("@")[0]! : ""
    const localMatch = localPart.length > 0 && localPart === lower
    if (!emailMatch && !userMatch && !localMatch) continue

    if (await verifyPassword(password, admin.passwordHash)) {
      await createAdminSession({ adminId: admin.id, email: admin.email })
      return true
    }
    return false
  }

  if (admins.length === 0) {
    const bootstrap = await verifyBootstrapAdmin(password)
    if (bootstrap) {
      await createAdminSession({ adminId: bootstrap.id, email: bootstrap.email })
      return true
    }
  }

  return false
}

export async function checkAdminSession(): Promise<boolean> {
  const session = await getAdminSession()
  return session !== null
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession()
}
