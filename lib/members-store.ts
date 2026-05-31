/**
 * Free member accounts. Uses Neon Postgres in production (POSTGRES_URL / DATABASE_URL).
 * Falls back to data/free-members.json when no database is configured (local dev).
 * Passwords are stored hashed only; never expose passwordHash in admin or exports.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { hashPassword } from "@/lib/password"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "free-members.json")

export interface FreeMember {
  id: string
  email: string
  name: string
  agency?: string
  createdAt: number // Unix seconds
  /** Hashed password; never send to client or include in exports */
  passwordHash?: string
}

interface Store {
  members: FreeMember[]
}

interface MemberRow {
  id: string
  email: string
  name: string
  agency: string | null
  password_hash: string | null
  created_at: string | number
}

function rowToMember(row: MemberRow): FreeMember {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    agency: row.agency ?? undefined,
    passwordHash: row.password_hash ?? undefined,
    createdAt: Number(row.created_at),
  }
}

async function ensureFile(): Promise<Store> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as Store
    return Array.isArray(data.members) ? data : { members: [] }
  } catch {
    return { members: [] }
  }
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function getFreeMembers(): Promise<FreeMember[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT id, email, name, agency, password_hash, created_at
      FROM free_members
      ORDER BY created_at DESC
    `
    return (rows as MemberRow[]).map(rowToMember)
  }

  const store = await ensureFile()
  return store.members
}

export async function getFreeMemberByEmail(email: string): Promise<FreeMember | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT id, email, name, agency, password_hash, created_at
      FROM free_members
      WHERE email = ${normalized}
      LIMIT 1
    `
    const row = (rows as MemberRow[])[0]
    return row ? rowToMember(row) : null
  }

  const store = await ensureFile()
  return store.members.find((m) => m.email.toLowerCase() === normalized) ?? null
}

export async function addFreeMember(params: {
  email: string
  name: string
  agency?: string
  password?: string
}): Promise<{ id: string } | { error: string }> {
  const email = params.email.trim().toLowerCase()
  if (!email) return { error: "Email is required" }

  const id = crypto.randomUUID()
  const name = params.name.trim() || email
  const agency = params.agency?.trim() || null
  const createdAt = Math.floor(Date.now() / 1000)
  let passwordHash: string | null = null
  if (params.password?.trim()) {
    passwordHash = await hashPassword(params.password.trim())
  }

  if (isDatabaseConfigured()) {
    try {
      await ensureSchema()
      await getSql()`
        INSERT INTO free_members (id, email, name, agency, password_hash, created_at)
        VALUES (${id}, ${email}, ${name}, ${agency}, ${passwordHash}, ${createdAt})
      `
      return { id }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes("unique") || message.includes("duplicate")) {
        return { error: "This email is already registered" }
      }
      throw err
    }
  }

  const store = await ensureFile()
  if (store.members.some((m) => m.email.toLowerCase() === email)) {
    return { error: "This email is already registered" }
  }

  const member: FreeMember = {
    id,
    email,
    name,
    agency: agency ?? undefined,
    createdAt,
    ...(passwordHash && { passwordHash }),
  }
  store.members.push(member)
  await writeStore(store)
  return { id }
}

export async function updateMemberPassword(memberId: string, newPassword: string): Promise<boolean> {
  const plain = newPassword.trim()
  if (!plain) return false
  const passwordHash = await hashPassword(plain)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      UPDATE free_members
      SET password_hash = ${passwordHash}
      WHERE id = ${memberId}
      RETURNING id
    `
    return (rows as { id: string }[]).length > 0
  }

  const store = await ensureFile()
  const member = store.members.find((m) => m.id === memberId)
  if (!member) return false
  member.passwordHash = passwordHash
  await writeStore(store)
  return true
}

export async function deleteFreeMember(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      DELETE FROM free_members
      WHERE id = ${id}
      RETURNING id
    `
    return (rows as { id: string }[]).length > 0
  }

  const store = await ensureFile()
  const before = store.members.length
  store.members = store.members.filter((m) => m.id !== id)
  if (store.members.length === before) return false
  await writeStore(store)
  return true
}
