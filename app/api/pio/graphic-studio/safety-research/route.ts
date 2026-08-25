import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { formatDepartmentLabel } from "@/lib/department-types"
import { draftSafetyTipGraphicCopy } from "@/lib/pio-graphic-studio-ai"
import {
  isSafetyAudience,
  isSafetyGraphicStyle,
  isSafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"

export const maxDuration = 60

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

  if (!checkRateLimit(`pio-graphic-research:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many graphic requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-graphic-research-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests.", code: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const category = String(body.category || "").trim()
    const residentNeed = String(body.residentNeed || body.prompt || "").trim()
    const audience = String(body.audience || "General Community").trim()
    const style = String(body.style || "Let SaferU Decide").trim()
    const visualRequest = String(body.visualRequest || "").trim()

    if (!isSafetyTipCategory(category)) {
      return NextResponse.json({ error: "Choose a safety graphic category." }, { status: 400 })
    }
    if (!isSafetyAudience(audience)) {
      return NextResponse.json({ error: "Choose an audience." }, { status: 400 })
    }
    if (!isSafetyGraphicStyle(style)) {
      return NextResponse.json({ error: "Choose a style." }, { status: 400 })
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

    const result = await draftSafetyTipGraphicCopy({
      category,
      residentNeed,
      audience,
      style,
      visualRequest,
      agencyName: String(body.agencyName || ""),
      agencyType,
      city: String(body.city || ""),
      state: String(body.state || ""),
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    return NextResponse.json(result.data)
  } catch (err) {
    console.error("[api/pio/graphic-studio/safety-research]", err)
    return NextResponse.json({ error: "Failed to research this safety topic." }, { status: 500 })
  }
}
