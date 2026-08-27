import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { aiErrorPayload } from "@/lib/ai-result"
import { formatDepartmentLabel } from "@/lib/department-types"
import { generatePostOpportunityPackage } from "@/lib/post-opportunity-package-ai"
import { resolveMemberAgencyLogo } from "@/lib/graphic-studio-store"

export const maxDuration = 120

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

  if (!checkRateLimit(`pio-post-package:${session.email}`, 24, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many post package requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-post-package-ip:${ip}`, 48, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests.", code: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const title = String(body.title || "").trim()
    if (!title) {
      return NextResponse.json({ error: "Post title is required." }, { status: 400 })
    }

    const agencyType = formatDepartmentLabel(
      String(body.agencyType || body.departmentType || ""),
      String(body.agencyTypeOther || body.departmentOther || "")
    )
    const agencyLogoUrl = await resolveMemberAgencyLogo(
      session.memberId,
      typeof body.agencyLogoUrl === "string" ? body.agencyLogoUrl : null
    )

    const result = await generatePostOpportunityPackage({
      title,
      whyItMatters: String(body.whyItMatters || body.summary || title),
      verifiedFacts: Array.isArray(body.verifiedFacts) ? body.verifiedFacts.map(String) : [],
      doNotClaim: Array.isArray(body.doNotClaim) ? body.doNotClaim.map(String) : [],
      publicCallToAction: Array.isArray(body.publicCallToAction)
        ? body.publicCallToAction.map(String)
        : [],
      recommendedAction: String(body.recommendedAction || ""),
      summary: String(body.summary || ""),
      sourceLabel: String(body.sourceLabel || ""),
      category: String(body.category || ""),
      messagingAngle: String(body.messagingAngle || body.whyThisAgency || ""),
      jurisdictionFit:
        body.jurisdictionFit === "own" ||
        body.jurisdictionFit === "nearby" ||
        body.jurisdictionFit === "regional" ||
        body.jurisdictionFit === "unknown"
          ? body.jurisdictionFit
          : undefined,
      visualConcept: String(body.visualConcept || ""),
      agencyName: String(body.agencyName || ""),
      agencyType,
      city: String(body.city || ""),
      state: String(body.state || ""),
      agencyLogoUrl,
      seedMessage: String(body.seedMessage || ""),
    })

    if (!result.ok) {
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    return NextResponse.json({
      message: result.data.message,
      imageDataUrl: result.data.imageDataUrl,
      generationModel: result.data.generationModel,
    })
  } catch (err) {
    console.error("[api/pio/generate-post-package]", err)
    return NextResponse.json({ error: "Failed to generate post package." }, { status: 500 })
  }
}
