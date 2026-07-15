import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { aiErrorPayload } from "@/lib/ai-result"
import {
  demoLocalIdeas,
  generateLocalIdeasWithAI,
  parseServiceZips,
} from "@/lib/local-ideas-ai"
import { isLocalPreviewServer } from "@/lib/local-preview-server"

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

  if (!checkRateLimit(`pio-ideas:${session.email}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }
  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-ideas-ip:${ip}`, 80, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const state = String(body.state || "").trim()
    const city = String(body.city || "").trim()
    const agencyName = String(body.agencyName || "").trim()
    const serviceZips = parseServiceZips(
      Array.isArray(body.serviceZips)
        ? body.serviceZips.join(" ")
        : String(body.serviceZips || body.zips || "")
    )

    if (!state || serviceZips.length === 0) {
      return NextResponse.json(
        {
          error:
            "Add your state and at least one service ZIP code so ideas match your coverage area.",
        },
        { status: 400 }
      )
    }

    const payload = { agencyName, city, state, serviceZips }
    const result = await generateLocalIdeasWithAI(payload)
    if (!result.ok) {
      // Localhost / missing key: still return useful demo ideas tied to location
      if (localPreview || result.reason === "missing_api_key") {
        return NextResponse.json({
          ideas: demoLocalIdeas(payload),
          demo: true,
        })
      }
      console.error("[local-ideas] AI failed:", result.reason, result.detail ?? "")
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    return NextResponse.json({ ideas: result.data, demo: false })
  } catch (e) {
    console.error("Local ideas error:", e)
    return NextResponse.json({ error: "Failed to generate local ideas." }, { status: 500 })
  }
}
