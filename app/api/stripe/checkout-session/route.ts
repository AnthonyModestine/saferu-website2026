import { NextResponse } from "next/server"
import { getCompletedCheckoutSession } from "@/lib/stripe-checkout-session"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { getMemberSession } from "@/lib/member-session"

export async function GET(request: Request) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`stripe-cs:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const member = await getMemberSession()
  if (!member?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() ?? ""
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  const summary = await getCompletedCheckoutSession(sessionId)
  if (!summary) {
    return NextResponse.json({ error: "Checkout session not found or not completed" }, { status: 404 })
  }

  const checkoutEmail = summary.email.trim().toLowerCase()
  const memberEmail = member.email.trim().toLowerCase()
  if (checkoutEmail !== memberEmail) {
    return NextResponse.json({ error: "Checkout session not found or not completed" }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    productId: summary.productId,
  })
}
