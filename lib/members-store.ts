/**
 * File-based store for free members (sign up without Stripe).
 * Uses data/free-members.json. On serverless (e.g. Vercel) the filesystem may be read-only;
 * for production at scale, replace with a database.
 * Passwords are stored hashed only; never expose passwordHash in admin or exports.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { hashPassword } from "@/lib/password"

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
  const store = await ensureFile()
  return store.members
}

export async function getFreeMemberByEmail(email: string): Promise<FreeMember | null> {
  const store = await ensureFile()
  const normalized = email.trim().toLowerCase()
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
  const store = await ensureFile()
  if (store.members.some((m) => m.email.toLowerCase() === email)) {
    return { error: "This email is already registered" }
  }
  const id = crypto.randomUUID()
  let passwordHash: string | undefined
  if (params.password && params.password.trim()) {
    passwordHash = await hashPassword(params.password.trim())
  }
  const member: FreeMember = {
    id,
    email,
    name: params.name.trim() || email,
    agency: params.agency?.trim(),
    createdAt: Math.floor(Date.now() / 1000),
    ...(passwordHash && { passwordHash }),
  }
  store.members.push(member)
  await writeStore(store)
  return { id }
}

export async function updateMemberPassword(memberId: string, newPassword: string): Promise<boolean> {
  const plain = newPassword.trim()
  if (!plain) return false
  const store = await ensureFile()
  const member = store.members.find((m) => m.id === memberId)
  if (!member) return false
  member.passwordHash = await hashPassword(plain)
  await writeStore(store)
  return true
}

export async function deleteFreeMember(id: string): Promise<boolean> {
  const store = await ensureFile()
  const before = store.members.length
  store.members = store.members.filter((m) => m.id !== id)
  if (store.members.length === before) return false
  await writeStore(store)
  return true
}
