/**
 * File-based store for contact form submissions (tickets).
 * Uses data/tickets.json. For production at scale, replace with a database.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "tickets.json")

export interface Ticket {
  id: string
  name: string
  email: string
  agency?: string
  topic: string
  message: string
  createdAt: number // Unix seconds
  /** Set when admin has replied; used to filter "replied" vs "new" */
  repliedAt?: number
}

interface Store {
  tickets: Ticket[]
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

export async function addTicket(params: {
  name: string
  email: string
  agency?: string
  topic: string
  message: string
}): Promise<{ id: string }> {
  const store = await ensureFile()
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
  store.tickets.push(ticket)
  await writeStore(store)
  return { id }
}

export async function getTickets(): Promise<Ticket[]> {
  const store = await ensureFile()
  return [...store.tickets].sort((a, b) => b.createdAt - a.createdAt)
}

/** Mark a ticket as replied (admin has sent a message). */
export async function markTicketReplied(id: string): Promise<boolean> {
  const store = await ensureFile()
  const ticket = store.tickets.find((t) => t.id === id)
  if (!ticket) return false
  ticket.repliedAt = Math.floor(Date.now() / 1000)
  await writeStore(store)
  return true
}

/** Delete a ticket by id. */
export async function deleteTicket(id: string): Promise<boolean> {
  const store = await ensureFile()
  const before = store.tickets.length
  store.tickets = store.tickets.filter((t) => t.id !== id)
  if (store.tickets.length === before) return false
  await writeStore(store)
  return true
}
