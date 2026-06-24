import { NextResponse } from "next/server"
import { getCompletedCheckoutSession } from "@/lib/stripe-checkout-session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`stripe-cs:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? ""
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  const summary = await getCompletedCheckoutSession(sessionId)
  if (!summary) {
    return NextResponse.json({ error: "Checkout session not found or not completed" }, { status: 404 })
  }

  return NextResponse.json({
    email: summary.email,
    productId: summary.productId,
  })
}
