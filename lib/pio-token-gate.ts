import { NextResponse } from "next/server"
import { OUT_OF_TOKENS_MESSAGE } from "@/lib/pio-generations"
import { tokensOrEstimate } from "@/lib/openai-usage"
import {
  releaseReservation,
  reserveTokens,
  settleReservation,
} from "@/lib/pio-token-balances"

export function outOfTokensResponse() {
  return NextResponse.json({ error: OUT_OF_TOKENS_MESSAGE }, { status: 403 })
}

/**
 * Atomically reserve an estimate before calling the AI provider.
 * Concurrent requests with insufficient combined balance: only one reserve succeeds.
 */
export async function reserveAiTokens(
  email: string,
  estimate: number
): Promise<
  | { ok: true; reservationId: string; reserved: number }
  | { ok: false; response: NextResponse }
> {
  const amount = tokensOrEstimate(null, estimate)
  const result = await reserveTokens(email, amount)
  if (!result.ok) {
    return { ok: false, response: outOfTokensResponse() }
  }
  return {
    ok: true,
    reservationId: result.reservationId,
    reserved: result.reserved,
  }
}

/** Refund reserved tokens after a failed AI generation. */
export async function abandonAiTokens(
  email: string,
  reservationId: string,
  reserved: number
): Promise<void> {
  await releaseReservation(email, reservationId, reserved)
}

/** Finalize after success; adjust for actual vs reserved usage. */
export async function settleAiTokens(
  email: string,
  reservationId: string,
  reserved: number,
  actual: number | undefined | null
): Promise<{ amount: number }> {
  const amount = tokensOrEstimate(actual, reserved)
  return settleReservation(email, reservationId, reserved, amount)
}

/** @deprecated Prefer reserveAiTokens — kept for transitional call sites. */
export async function rejectIfOutOfTokens(email: string): Promise<NextResponse | null> {
  const { getTokenStatus } = await import("@/lib/pio-generations")
  const status = await getTokenStatus(email)
  if (status.remaining === 0) return outOfTokensResponse()
  return null
}

/**
 * @deprecated Prefer reserveAiTokens + settleAiTokens.
 * Direct debit after generation (still atomic consume).
 */
export async function debitAiTokens(
  email: string,
  actual: number | undefined | null,
  estimate: number
): Promise<{ ok: boolean; amount: number }> {
  const amount = tokensOrEstimate(actual, estimate)
  const { consumeTokens } = await import("@/lib/pio-generations")
  const ok = await consumeTokens(email, amount)
  return { ok, amount }
}
