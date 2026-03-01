"use server"

import { checkAdminSession } from "@/lib/admin-auth"
import { markTicketReplied as markRepliedInStore, deleteTicket as deleteTicketInStore } from "@/lib/tickets-store"

async function ensureAdmin(): Promise<void> {
  const ok = await checkAdminSession()
  if (!ok) throw new Error("Unauthorized")
}

/** Mark a ticket as replied (admin only). */
export async function markTicketReplied(id: string): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  if (!id?.trim()) return { success: false, error: "Ticket ID required" }
  const updated = await markRepliedInStore(id)
  return updated ? { success: true } : { success: false, error: "Ticket not found" }
}

/** Delete a ticket (admin only). */
export async function deleteTicket(id: string): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  if (!id?.trim()) return { success: false, error: "Ticket ID required" }
  const deleted = await deleteTicketInStore(id)
  return deleted ? { success: true } : { success: false, error: "Ticket not found" }
}
