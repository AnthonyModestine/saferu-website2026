"use server"

import { checkAdminSession } from "@/lib/admin-auth"
import { deleteMemberFeedback as deleteInStore } from "@/lib/member-feedback-store"

async function ensureAdmin(): Promise<void> {
  const ok = await checkAdminSession()
  if (!ok) throw new Error("Unauthorized")
}

export async function deleteMemberFeedbackEntry(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await ensureAdmin()
  if (!id?.trim()) return { success: false, error: "ID required" }
  const deleted = await deleteInStore(id)
  return deleted ? { success: true } : { success: false, error: "Not found" }
}
