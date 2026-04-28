import { readFile } from "fs/promises"
import path from "path"

export type AdminUserRecord = {
  id: string
  email: string
  /** Login handle; optional if signing in with full email or email local-part */
  username?: string
  passwordHash: string
  createdAt: number
}

const FILE_PATH = path.join(process.cwd(), "data", "admin-users.json")

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as { admins: AdminUserRecord[] }
    return Array.isArray(data.admins) ? data.admins : []
  } catch {
    return []
  }
}
