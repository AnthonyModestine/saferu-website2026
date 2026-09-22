/**
 * Contact form submissions (tickets).
 * Neon when POSTGRES_URL / DATABASE_URL is set; otherwise data/tickets.json for local dev.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "tickets.json")

export interface Ticket {
  id: string
  name: string
  email: string
  agency?: string
  topic: string
  message: string
  createdAt: number
  repliedAt?: number
  readAt?: number
}

interface Store {
  tickets: Ticket[]
}

interface TicketRow {
  id: string
  name: string
  email: string
  agency: string | null
  topic: string
  message: string
  created_at: string | number
  replied_at: string | number | null
  read_at: string | number | null
}

function rowToTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    agency: row.agency ?? undefined,
    topic: row.topic,
    message: row.message,
    createdAt: Number(row.created_at),
    repliedAt: row.replied_at != null ? Number(row.replied_at) : undefined,
    readAt: row.read_at != null ? Number(row.read_at) : undefined,
  }
}

async function ensureFile(): Promise<Store> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as Store
    return Array.isArray(data.tickets) ? data : { tickets: [] }
  } catch {
    return { tickets: [] }
  }
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

async function maybeMigrateFileToDb(): Promise<void> {
  const existing = await getSql()`SELECT id FROM contact_tickets LIMIT 1`
  if ((existing as unknown[]).length > 0) return
  const store = await ensureFile()
  if (store.tickets.length === 0) return
  for (const t of store.tickets) {
    await getSql()`
      INSERT INTO contact_tickets (id, name, email, agency, topic, message, created_at, replied_at, read_at)
      VALUES (
        ${t.id},
        ${t.name},
        ${t.email},
        ${t.agency ?? null},
        ${t.topic},
        ${t.message},
        ${t.createdAt},
        ${t.repliedAt ?? null},
        ${t.readAt ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }
}

export async function addTicket(params: {
  name: string
  email: string
  agency?: string
  topic: string
  message: string
}): Promise<{ id: string }> {
  const id = crypto.randomUUID()
  const ticket: Ticket = {
    id,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    agency: params.agency?.trim() || undefined,
    topic: params.topic.trim(),
    message: params.message.trim(),
    createdAt: Math.floor(Date.now() / 1000),
  }

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await maybeMigrateFileToDb()
    await getSql()`
      INSERT INTO contact_tickets (id, name, email, agency, topic, message, created_at, replied_at, read_at)
      VALUES (
        ${ticket.id},
        ${ticket.name},
        ${ticket.email},
        ${ticket.agency ?? null},
        ${ticket.topic},
        ${ticket.message},
        ${ticket.createdAt},
        NULL,
        NULL
      )
    `
    return { id }
  }

  const store = await ensureFile()
  store.tickets.push(ticket)
  await writeStore(store)
  return { id }
}

export async function getTickets(): Promise<Ticket[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await maybeMigrateFileToDb()
    const rows = await getSql()`
      SELECT id, name, email, agency, topic, message, created_at, replied_at, read_at
      FROM contact_tickets
      ORDER BY created_at DESC
    `
    return (rows as TicketRow[]).map(rowToTicket)
  }
  const store = await ensureFile()
  return [...store.tickets].sort((a, b) => b.createdAt - a.createdAt)
}

export async function markTicketReplied(id: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      UPDATE contact_tickets
      SET replied_at = ${now},
          read_at = COALESCE(read_at, ${now})
      WHERE id = ${id}
      RETURNING id
    `
    return (rows as unknown[]).length > 0
  }
  const store = await ensureFile()
  const ticket = store.tickets.find((t) => t.id === id)
  if (!ticket) return false
  ticket.repliedAt = now
  if (!ticket.readAt) ticket.readAt = now
  await writeStore(store)
  return true
}

export async function markTicketRead(id: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      UPDATE contact_tickets
      SET read_at = COALESCE(read_at, ${now})
      WHERE id = ${id}
      RETURNING id
    `
    return (rows as unknown[]).length > 0
  }
  const store = await ensureFile()
  const ticket = store.tickets.find((t) => t.id === id)
  if (!ticket) return false
  if (ticket.readAt) return true
  ticket.readAt = now
  await writeStore(store)
  return true
}

export async function getUnreadTicketCount(): Promise<number> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await maybeMigrateFileToDb()
    const rows = await getSql()`
      SELECT COUNT(*)::int AS count FROM contact_tickets WHERE read_at IS NULL
    `
    return Number((rows as { count: number }[])[0]?.count ?? 0)
  }
  const store = await ensureFile()
  return store.tickets.filter((t) => !t.readAt).length
}

export async function deleteTicket(id: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      DELETE FROM contact_tickets WHERE id = ${id} RETURNING id
    `
    return (rows as unknown[]).length > 0
  }
  const store = await ensureFile()
  const before = store.tickets.length
  store.tickets = store.tickets.filter((t) => t.id !== id)
  if (store.tickets.length === before) return false
  await writeStore(store)
  return true
}
