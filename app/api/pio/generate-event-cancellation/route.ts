import { NextResponse } from "next/server"
import { generateEventCancellationWithAI } from "@/lib/event-cancellation-ai"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { consumeGeneration, getGenerationStatus } from "@/lib/pio-generations"
import { aiErrorPayload } from "@/lib/ai-result"

function cap(val: unknown, max = 2000): string {
  return String(val ?? "").trim().slice(0, max)
}

export async function POST(request: Request) {
  const session = await getMemberSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [stripePaid, trialActive] = await Promise.all([
    getIsPaidByEmail(session.email),
    isOnActiveTrial(session.email),
  ])
  if (!stripePaid && !trialActive) {
    return NextResponse.json({ error: "Press Center subscription required" }, { status: 403 })
  }

  if (!checkRateLimit(`pio-cancel:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-cancel-ip:${ip}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const status = await getGenerationStatus(session.email)
  if (status.remaining === 0) {
    return NextResponse.json(
      {
        error:
          "You have used all your generations for this month. Purchase a generation pack to continue.",
      },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const eventName = cap(body.title ?? body.eventName, 200)
    const cancellationReason = cap(body.cancellationReason ?? body.reason, 2000)
    const newEventDateRaw = cap(body.newEventDate, 20)
    const newEventDate =
      newEventDateRaw && /^\d{4}-\d{2}-\d{2}$/.test(newEventDateRaw) ? newEventDateRaw : ""
    const locationName = cap(body.location ?? body.locationName, 300)
    const eventDate = cap(body.eventDate, 20)
    const channelRaw = cap(body.channel, 40).toLowerCase()
    const channel =
      channelRaw === "x" || channelRaw === "twitter" || channelRaw === "x/twitter"
        ? ("X" as const)
        : ("Facebook" as const)

    if (!eventName) {
      return NextResponse.json({ error: "Event title is required." }, { status: 400 })
    }
    if (!cancellationReason || cancellationReason.length < 5) {
      return NextResponse.json(
        { error: "Add a short cancellation reason (at least 5 characters)." },
        { status: 400 }
      )
    }
    if (!locationName) {
      return NextResponse.json({ error: "Event location is required." }, { status: 400 })
    }
    if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return NextResponse.json({ error: "A valid event date is required." }, { status: 400 })
    }

    const result = await generateEventCancellationWithAI({
      organizationName: cap(body.agencyName ?? body.organizationName, 100) || "Public Safety Agency",
      organizationType:
        cap(body.organizationType ?? body.agencyType, 100) || "public safety agency",
      agencyRole: cap(body.hostingRole ?? "hosting", 40) || "hosting",
      hostOrganization: cap(body.hostOrganization, 200) || undefined,
      eventName,
      eventDate,
      startTime: cap(body.startTime, 40) || undefined,
      endTime: body.endTime != null ? cap(body.endTime, 40) : undefined,
      locationName,
      fullAddress: cap(body.address ?? body.fullAddress, 300) || undefined,
      cancellationReason,
      newEventDate: newEventDate || undefined,
      channel,
    })

    if (!result.ok) {
      console.error("[generate-event-cancellation] AI failed:", result.reason, result.detail ?? "")
      return NextResponse.json(aiErrorPayload(result.reason, result.detail), { status: 503 })
    }

    const consumed = await consumeGeneration(session.email)
    if (!consumed) {
      return NextResponse.json(
        {
          error:
            "You have used all your generations for this month. Purchase a generation pack to continue.",
        },
        { status: 403 }
      )
    }

    const today = new Date().toISOString().slice(0, 10)
    return NextResponse.json({
      post: {
        key: "cancellation",
        postDate: today,
        postTime: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        timingLabel: newEventDate ? "Reschedule Notice" : "Cancellation Notice",
        ...result.data,
      },
      rescheduled: Boolean(newEventDate),
      newEventDate: newEventDate || null,
    })
  } catch (err) {
    console.error("[generate-event-cancellation]", err)
    return NextResponse.json({ error: "Failed to generate cancellation message." }, { status: 500 })
  }
}
