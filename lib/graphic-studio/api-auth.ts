import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"

export async function requireGraphicStudioAccess(
  request: Request,
  rateKey: string,
  rateLimit = 30,
  ipLimit = 60
): Promise<{ session: { email: string; memberId: string } } | NextResponse> {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive, localPreview] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
    isLocalPreviewServer(),
  ])
  if (!stripePaid && !trialActive && !localPreview) {
    return NextResponse.json({ error: "Press Center subscription required" }, { status: 403 })
  }

  if (!checkRateLimit(`${rateKey}:${session.email}`, rateLimit, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`${rateKey}-ip:${ip}`, ipLimit, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests.", code: "rate_limited" }, { status: 429 })
  }

  return { session }
}
