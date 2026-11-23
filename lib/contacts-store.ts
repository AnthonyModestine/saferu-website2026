/**
 * Admin mailing contacts (CSV import list).
 * These are outreach emails — NOT SaferU member accounts.
 * Neon when configured; otherwise data/admin-contacts.json for local dev.
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "admin-contacts.json")

export type AdminContact = {
  id: string
  email: string
  name: string
  agency: string
  notes: string
  source: string
  createdAt: number
  updatedAt: number
}

type FileStore = { contacts: AdminContact[] }

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function newId(): string {
  return `ctc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as FileStore
    return Array.isArray(data.contacts) ? data : { contacts: [] }
  } catch {
    return { contacts: [] }
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function listContacts(search = ""): Promise<AdminContact[]> {
  const q = search.trim().toLowerCase()
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = q
      ? await getSql()`
          SELECT id, email, name, agency, notes, source, created_at, updated_at
          FROM admin_contacts
          WHERE email ILIKE ${"%" + q + "%"}
             OR COALESCE(name, '') ILIKE ${"%" + q + "%"}
             OR COALESCE(agency, '') ILIKE ${"%" + q + "%"}
          ORDER BY created_at DESC
          LIMIT 5000
        `
      : await getSql()`
          SELECT id, email, name, agency, notes, source, created_at, updated_at
          FROM admin_contacts
          ORDER BY created_at DESC
          LIMIT 5000
        `
    return (rows as Record<string, unknown>[]).map((row) => ({
      id: String(row.id),
      email: String(row.email),
      name: String(row.name || ""),
      agency: String(row.agency || ""),
      notes: String(row.notes || ""),
      source: String(row.source || "csv"),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }))
  }

  const store = await readFileStore()
  const list = [...store.contacts].sort((a, b) => b.createdAt - a.createdAt)
  if (!q) return list
  return list.filter(
    (c) =>
      c.email.includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.agency.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
  )
}

export async function upsertContacts(
  rows: Array<{ email: string; name?: string; agency?: string; notes?: string; source?: string }>
): Promise<{ added: number; updated: number; skipped: number; invalid: number }> {
  let added = 0
  let updated = 0
  let skipped = 0
  let invalid = 0
  const now = Date.now()

  const cleaned = rows
    .map((r) => ({
      email: normalizeEmail(r.email || ""),
      name: (r.name || "").trim().slice(0, 200),
      agency: (r.agency || "").trim().slice(0, 200),
      notes: (r.notes || "").trim().slice(0, 1000),
      source: (r.source || "csv").trim().slice(0, 40) || "csv",
    }))
    .filter((r) => {
      if (!r.email) {
        invalid += 1
        return false
      }
      if (!isValidEmail(r.email)) {
        invalid += 1
        return false
      }
      return true
    })

  // Dedupe within this import (last wins)
  const byEmail = new Map<string, (typeof cleaned)[0]>()
  for (const row of cleaned) byEmail.set(row.email, row)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    for (const row of byEmail.values()) {
      const existing = await getSql()`
        SELECT id FROM admin_contacts WHERE email = ${row.email} LIMIT 1
      `
      if ((existing as unknown[]).length > 0) {
        await getSql()`
          UPDATE admin_contacts
          SET
            name = CASE WHEN ${row.name} = '' THEN name ELSE ${row.name} END,
            agency = CASE WHEN ${row.agency} = '' THEN agency ELSE ${row.agency} END,
            notes = CASE WHEN ${row.notes} = '' THEN notes ELSE ${row.notes} END,
            updated_at = ${now}
          WHERE email = ${row.email}
        `
        updated += 1
      } else {
        await getSql()`
          INSERT INTO admin_contacts (id, email, name, agency, notes, source, created_at, updated_at)
          VALUES (
            ${newId()},
            ${row.email},
            ${row.name || null},
            ${row.agency || null},
            ${row.notes || null},
            ${row.source},
            ${now},
            ${now}
          )
        `
        added += 1
      }
    }
    return { added, updated, skipped, invalid }
  }

  const store = await readFileStore()
  const index = new Map(store.contacts.map((c, i) => [c.email, i]))
  for (const row of byEmail.values()) {
    const idx = index.get(row.email)
    if (idx != null) {
      const prev = store.contacts[idx]
      store.contacts[idx] = {
        ...prev,
        name: row.name || prev.name,
        agency: row.agency || prev.agency,
        notes: row.notes || prev.notes,
        updatedAt: now,
      }
      updated += 1
    } else {
      const contact: AdminContact = {
        id: newId(),
        email: row.email,
        name: row.name,
        agency: row.agency,
        notes: row.notes,
        source: row.source,
        createdAt: now,
        updatedAt: now,
      }
      store.contacts.push(contact)
      index.set(row.email, store.contacts.length - 1)
      added += 1
    }
  }
  await writeFileStore(store)
  return { added, updated, skipped, invalid }
}

export async function deleteContacts(ids: string[]): Promise<number> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  if (unique.length === 0) return 0

  if (isDatabaseConfigured()) {
    await ensureSchema()
    let deleted = 0
    for (const id of unique) {
      const result = await getSql()`DELETE FROM admin_contacts WHERE id = ${id} RETURNING id`
      deleted += (result as unknown[]).length
    }
    return deleted
  }

  const store = await readFileStore()
  const before = store.contacts.length
  const remove = new Set(unique)
  store.contacts = store.contacts.filter((c) => !remove.has(c.id))
  await writeFileStore(store)
  return before - store.contacts.length
}

export async function getContactsByIds(ids: string[]): Promise<AdminContact[]> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  if (unique.length === 0) return []
  const all = await listContacts()
  const set = new Set(unique)
  return all.filter((c) => set.has(c.id))
}

export function contactsToCsv(contacts: AdminContact[]): string {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
  const lines = ["email,name,agency,notes,source,createdAt"]
  for (const c of contacts) {
    lines.push(
      [
        escape(c.email),
        escape(c.name),
        escape(c.agency),
        escape(c.notes),
        escape(c.source),
        escape(new Date(c.createdAt).toISOString()),
      ].join(",")
    )
  }
  return lines.join("\n")
}
