/**
 * Tracks AI token usage per member (Press Center allowance).
 * Monthly quota resets automatically. Purchased token packs carry over.
 *
 * Production: atomic Neon balances (see lib/pio-token-balances.ts).
 * Local: file-backed balances with the same reserve/debit semantics.
 */

import {
  MONTHLY_TOKEN_QUOTA as QUOTA,
  OUT_OF_TOKENS_MESSAGE as OUT_MSG,
} from "@/lib/pio-generations-constants"
import {
  atomicConsumeTokens,
  atomicCreditTokens,
  getAtomicTokenStatus,
  purgeTokenBalances,
} from "@/lib/pio-token-balances"

export const MONTHLY_TOKEN_QUOTA = QUOTA
export const OUT_OF_TOKENS_MESSAGE = OUT_MSG

export type TokenStatus = {
  used: number
  quota: number
  monthlyRemaining: number
  packs: number
  remaining: number
}

/** Returns token usage for the current UTC month. */
export async function getTokenStatus(email: string): Promise<TokenStatus> {
  return getAtomicTokenStatus(email)
}

/** @deprecated Prefer getTokenStatus — same shape, token units. */
export const getGenerationStatus = getTokenStatus

/**
 * Debit tokens atomically. Returns true if the full amount was consumed.
 */
export async function consumeTokens(email: string, amount: number): Promise<boolean> {
  return atomicConsumeTokens(email, amount)
}

/** @deprecated Prefer consumeTokens(email, amount). */
export async function consumeGeneration(email: string, amount = 1): Promise<boolean> {
  return consumeTokens(email, amount)
}

/** Add purchased token pack credits to a member's account. */
export async function addTokenPack(email: string, count: number): Promise<void> {
  await atomicCreditTokens(email, count)
}

/** @deprecated Prefer addTokenPack. */
export const addGenerationPack = addTokenPack

/** Batch lookup for admin member list. */
export async function getTokenStatuses(
  emails: string[]
): Promise<Map<string, TokenStatus>> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async (email) => [email, await getTokenStatus(email)] as const)
  )
  return new Map(entries)
}

/** @deprecated Prefer getTokenStatuses. */
export const getGenerationStatuses = getTokenStatuses

/** Used by account purge. */
export async function purgeGenerationsForEmail(email: string): Promise<void> {
  await purgeTokenBalances(email)
}
