import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit } from "@/lib/rate-limit"
import { aiErrorPayload } from "@/lib/ai-result"
import {
  customizeCuratedMessage,
  generateMessageFromOpportunity,
} from "@/lib/post-generator-ai"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import type { CustomizeMessageMode } from "@/lib/post-generator/types"

export const maxDuration = 30

const CUSTOMIZE_MODES: CustomizeMessageMode[] = [
  "shorten",
  "conversational",
  "formal",
  "facebook",
  "instagram",
  "twitter",
  "add_emojis",
  "remove_emojis",
]

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

  if (!checkRateLimit(`pio-customize:${session.email}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const action = String(body.action || "customize")

    if (action === "generate") {
      const fitRaw = String(body.jurisdictionFit || "")
      const jurisdictionFit =
        fitRaw === "own" || fitRaw === "nearby" || fitRaw === "regional" || fitRaw === "unknown"
          ? fitRaw
          : undefined
      const result = await generateMessageFromOpportunity(
        String(body.title || ""),
        String(body.whyItMatters || ""),
        Array.isArray(body.verifiedFacts) ? body.verifiedFacts.map(String) : [],
        Array.isArray(body.doNotClaim) ? body.doNotClaim.map(String) : [],
        Array.isArray(body.publicCallToAction) ? body.publicCallToAction.map(String) : [],
        String(body.recommendedAction || ""),
        String(body.agencyName || ""),
        String(body.city || ""),
        String(body.state || ""),
        String(body.summary || ""),
        String(body.sourceLabel || ""),
        String(body.agencyType || body.departmentType || ""),
        String(body.agencyTypeOther || body.departmentOther || ""),
        String(body.messagingAngle || body.whyThisAgency || ""),
        jurisdictionFit
      )
      if (!result.ok) {
        return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
      }
      return NextResponse.json({ message: result.data })
    }

    const mode = String(body.mode || "shorten") as CustomizeMessageMode
    if (!CUSTOMIZE_MODES.includes(mode)) {
      return NextResponse.json({ error: "Invalid customize mode." }, { status: 400 })
    }

    const verifiedFactsRaw = Array.isArray(body.verifiedFacts) ? body.verifiedFacts.map(String) : []
    const verifiedFacts = verifiedFactsRaw.map((text, index) => ({
      id: `fact-${index + 1}`,
      text,
    }))

    const result = await customizeCuratedMessage(
      String(body.message || ""),
      mode,
      String(body.agencyName || ""),
      {
        city: String(body.city || ""),
        state: String(body.state || ""),
      },
      {
        agencyType: String(body.agencyType || body.departmentType || ""),
        verifiedFacts,
      }
    )
    if (!result.ok) {
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }
    return NextResponse.json({ message: result.data })
  } catch (e) {
    console.error("Customize message error:", e)
    return NextResponse.json({ error: "Failed to customize message." }, { status: 500 })
  }
}
