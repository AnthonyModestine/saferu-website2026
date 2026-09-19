import { NextResponse } from "next/server"
import {
  consumeTokens,
  getTokenStatus,
  OUT_OF_TOKENS_MESSAGE,
} from "@/lib/pio-generations"
import { tokensOrEstimate } from "@/lib/openai-usage"

export async function rejectIfOutOfTokens(email: string): Promise<NextResponse | null> {
  const status = await getTokenStatus(email)
  if (status.remaining === 0) {
    return NextResponse.json({ error: OUT_OF_TOKENS_MESSAGE }, { status: 403 })
  }
  return null
}

export async function debitAiTokens(
  email: string,
  actual: number | undefined | null,
  estimate: number
): Promise<{ ok: boolean; amount: number }> {
  const amount = tokensOrEstimate(actual, estimate)
  const ok = await consumeTokens(email, amount)
  return { ok, amount }
}

export function outOfTokensResponse() {
  return NextResponse.json({ error: OUT_OF_TOKENS_MESSAGE }, { status: 403 })
}
