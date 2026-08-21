import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { aiErrorPayload } from "@/lib/ai-result"
import { formatDepartmentLabel } from "@/lib/department-types"
import {
  createSafetyTipGraphicPackage,
  SAFETY_TIP_CATEGORIES,
} from "@/lib/pio-graphic-studio-ai"

export const maxDuration = 90

export async function POST(request: Request) {
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

  if (!checkRateLimit(`pio-graphic-safety:${session.email}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many graphic requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-graphic-safety-ip:${ip}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests.", code: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const category = String(body.category || "").trim()
    const residentNeed = String(body.residentNeed || body.prompt || "").trim()

    if (!SAFETY_TIP_CATEGORIES.includes(category as (typeof SAFETY_TIP_CATEGORIES)[number])) {
      return NextResponse.json({ error: "Choose a safety tip category." }, { status: 400 })
    }
    if (residentNeed.length < 8) {
      return NextResponse.json(
        { error: "Tell us what residents should know (at least a short sentence)." },
        { status: 400 }
      )
    }

    const agencyType = formatDepartmentLabel(
      String(body.agencyType || body.departmentType || ""),
      String(body.agencyTypeOther || body.departmentOther || "")
    )

    const result = await createSafetyTipGraphicPackage({
      category,
      residentNeed,
      agencyName: String(body.agencyName || ""),
      agencyType,
      city: String(body.city || ""),
      state: String(body.state || ""),
    })

    if (!result.ok) {
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error("[api/pio/graphic-studio/safety-tip]", err)
    return NextResponse.json({ error: "Failed to create safety tip graphic." }, { status: 500 })
  }
}
