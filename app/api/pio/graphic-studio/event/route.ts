import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { graphicStudioErrorPayload } from "@/lib/ai-result"
import { generateEventGraphicImage } from "@/lib/pio-graphic-studio-ai"
import { saveGraphicStudioRecord, resolveMemberAgencyLogo } from "@/lib/graphic-studio-store"
import { isEventGraphicStyle, isEventGraphicType } from "@/lib/pio-graphic-studio-types"

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

  if (!checkRateLimit(`pio-graphic-event:${session.email}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many graphic requests this hour.", code: "rate_limited" },
      { status: 429 }
    )
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-graphic-event-ip:${ip}`, 40, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests.", code: "rate_limited" }, { status: 429 })
  }

  try {
    const body = await request.json()
    const eventType = String(body.eventType || "").trim()
    const eventName = String(body.eventName || "").trim()
    const date = String(body.date || "").trim()
    const time = String(body.time || "").trim()
    const location = String(body.location || "").trim()
    const style = String(body.style || "Let SaferU Decide").trim()

    if (!isEventGraphicType(eventType) || !isEventGraphicStyle(style)) {
      return NextResponse.json({ error: "Choose an event type and style." }, { status: 400 })
    }
    if (!eventName || !date || !location) {
      return NextResponse.json(
        { error: "Event name, date, and location are required." },
        { status: 400 }
      )
    }

    const agencyLogoUrl = await resolveMemberAgencyLogo(
      session.memberId,
      typeof body.agencyLogoUrl === "string" ? body.agencyLogoUrl : null
    )

    const result = await generateEventGraphicImage({
      eventType,
      eventName,
      date,
      time,
      location,
      description: String(body.description || ""),
      cta: String(body.cta || ""),
      contact: String(body.contact || ""),
      style,
      agencyLogoUrl,
    })

    if (!result.ok) {
      return NextResponse.json(graphicStudioErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const graphicId = crypto.randomUUID()
    const saved = await saveGraphicStudioRecord({
      graphic_id: graphicId,
      agency_id: String(body.agencyName || session.email),
      user_id: session.email,
      graphic_type: "event",
      category: eventType,
      audience: "General Community",
      original_user_request: eventName,
      approved_headline: eventName,
      approved_supporting_line: `${date} ${time}`.trim(),
      approved_body_copy: location,
      approved_emergency_message: "",
      visual_style: style,
      research_json: null,
      source_records: [],
      image_prompt: eventName,
      agency_logo_used: Boolean(agencyLogoUrl),
      generation_model: result.data.model,
      generated_at: new Date().toISOString(),
      revision_count: 0,
      status: "generated",
    })
    if (!saved) {
      console.warn("[api/pio/graphic-studio/event] generation record not persisted")
    }

    return NextResponse.json({
      imageDataUrl: result.data.dataUrl,
      generationModel: result.data.model,
      graphicId,
    })
  } catch (err) {
    console.error("[api/pio/graphic-studio/event]", err)
    return NextResponse.json({ error: "Failed to create event graphic." }, { status: 500 })
  }
}
