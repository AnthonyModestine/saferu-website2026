import { NextResponse } from "next/server"
import { generateEventPostsWithAI } from "@/lib/event-posts-ai"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { consumeGeneration, getGenerationStatus } from "@/lib/pio-generations"
import { aiErrorPayload } from "@/lib/ai-result"

const MAX = 1000

function cap(val: unknown, max = MAX): string {
  return String(val ?? "").trim().slice(0, max)
}

function asStringList(val: unknown, maxItems = 20): string[] {
  if (Array.isArray(val)) {
    return val.map((v) => String(v).trim()).filter(Boolean).slice(0, maxItems)
  }
  if (typeof val === "string" && val.trim()) {
    return val
      .split(/[,|\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, maxItems)
  }
  return []
}

function isValidYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
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

  if (!checkRateLimit(`pio-events:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
  }

  const ip = getClientIp(request)
  if (!checkRateLimit(`pio-events-ip:${ip}`, 60, 60 * 60 * 1000)) {
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
    const eventDescription = cap(body.description ?? body.eventDescription, 4500)
    const locationName = cap(body.location ?? body.locationName, 300)
    const eventDate = cap(body.eventDate, 20)
    const startTime = cap(body.startTime, 40)
    const endTime = body.endTime != null ? cap(body.endTime, 40) : ""
    const organizationName = cap(body.agencyName ?? body.organizationName, 100)
    const organizationType = cap(body.organizationType ?? body.agencyType, 100)
    const eventCategory = cap(body.category ?? body.eventCategory, 120)
    const eventType = cap(body.eventType, 120)
    const fullAddress = cap(body.address ?? body.fullAddress, 300)
    const highlights = asStringList(body.highlights ?? body.eventHighlights)
    const contactEmail = cap(body.contactEmail, 120)
    const contactPhone = cap(body.contactPhone, 60)
    const isRecurring = Boolean(body.recurring ?? body.isRecurring)
    const hostingRole = cap(body.hostingRole ?? "hosting", 40) || "hosting"
    const hostOrganization = cap(body.hostOrganization, 200)
    const postEventNotes = cap(body.postEventNotes, 2000)
    const eventPartners = cap(body.eventPartners, 500)
    const photosAvailable = cap(body.photosAvailable, 200)
    const nextStep = cap(body.nextStep, 400)
    const audience = cap(body.audience, 500)
    const parking = cap(body.parking, 1000)
    const registration = cap(body.registration, 1000)
    const registrationDeadline = cap(body.registrationDeadline, 20)
    const registrationUrl = cap(body.registrationUrl, 500)
    const cost = cap(body.cost, 200)
    const accessibility = cap(body.accessibility, 1000)
    const arrivalInstructions = cap(body.arrivalInstructions, 1000)
    const website = cap(body.website, 500)
    const primaryImage = cap(body.primaryImage, 500)
    const additionalAssets = cap(body.additionalAssets, 1000)
    const capacityStatus = cap(body.capacityStatus, 300)
    const weatherPlan = cap(body.weatherPlan, 1000)
    const audienceGoals = cap(body.audienceGoals, 2000)
    const contentPrefs = cap(body.contentPrefs, 2000)
    const keys = Array.isArray(body.keys)
      ? body.keys.map((k: unknown) => String(k).trim()).filter(Boolean).slice(0, 8)
      : body.key
        ? [cap(body.key, 60)]
        : undefined
    const channelRaw = cap(body.channel, 40).toLowerCase()
    const channel =
      channelRaw === "x" || channelRaw === "twitter" || channelRaw === "x/twitter"
        ? "X"
        : channelRaw === "nextdoor"
          ? "Nextdoor"
          : channelRaw === "email"
            ? "Email"
            : channelRaw === "website"
              ? "Website"
              : "Facebook"

    const registrationOnly =
      /registration|rsvp required|ticket|sold.?out|private|limited capac/i.test(
        `${audienceGoals} ${contentPrefs} ${eventDescription} ${registration} ${capacityStatus}`
      )
    const allowOptionalFinalReminder =
      body.allowOptionalFinalReminder === false ? false : !registrationOnly

    if (!eventName) {
      return NextResponse.json({ error: "Event title is required." }, { status: 400 })
    }
    if (!isValidYmd(eventDate)) {
      return NextResponse.json({ error: "A valid event date is required." }, { status: 400 })
    }
    if (
      registrationDeadline &&
      (!isValidYmd(registrationDeadline) || registrationDeadline > eventDate)
    ) {
      return NextResponse.json(
        { error: "Registration deadline must be a valid date on or before the event." },
        { status: 400 }
      )
    }
    if (!locationName) {
      return NextResponse.json({ error: "Event location is required." }, { status: 400 })
    }
    if (!eventDescription || eventDescription.length < 20) {
      return NextResponse.json(
        { error: "Add a short description of the event so AI can draft useful posts." },
        { status: 400 }
      )
    }
    if (hostingRole !== "hosting" && !hostOrganization) {
      return NextResponse.json(
        { error: "Add the host organization when your agency is not the sole host." },
        { status: 400 }
      )
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`
    const currentTime = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    const descriptionWithContext = [
      eventDescription,
      audienceGoals ? `Audience & goals: ${audienceGoals}` : "",
      contentPrefs ? `Content preferences: ${contentPrefs}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    const result = await generateEventPostsWithAI({
      organizationName: organizationName || "Public Safety Agency",
      organizationType: organizationType || "public safety agency",
      eventName,
      eventCategory,
      eventType,
      eventDate,
      startTime: startTime || "",
      endTime: endTime || "",
      locationName,
      fullAddress,
      eventDescription: descriptionWithContext,
      eventHighlights: highlights.join(", "),
      contactEmail,
      contactPhone,
      isRecurring: isRecurring ? "yes" : "no",
      agencyRole: hostingRole,
      hostOrganization,
      postEventNotes: postEventNotes || undefined,
      eventPartners: eventPartners || undefined,
      photosAvailable: photosAvailable || undefined,
      nextStep: nextStep || undefined,
      allowOptionalFinalReminder,
      audience: audience || undefined,
      parking: parking || undefined,
      registration: registration || undefined,
      registrationRequired: Boolean(body.registrationRequired),
      registrationDeadline: registrationDeadline || undefined,
      registrationUrl: registrationUrl || undefined,
      cost: cost || undefined,
      accessibility: accessibility || undefined,
      arrivalInstructions: arrivalInstructions || undefined,
      website: website || undefined,
      primaryImage: primaryImage || undefined,
      additionalAssets: additionalAssets || undefined,
      capacityStatus: capacityStatus || undefined,
      weatherPlan: weatherPlan || undefined,
      today,
      currentTime,
      keys,
      channel,
    })

    if (!result.ok) {
      console.error("[generate-event-posts] AI failed:", result.reason, result.detail ?? "")
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

    return NextResponse.json({
      posts: result.data.posts,
      campaignCount: result.data.posts.length,
      status: result.data.status,
      strategy: result.data.strategy,
      detailsToVerify: result.data.detailsToVerify,
      humanReviewReason: result.data.humanReviewReason,
    })
  } catch (err) {
    console.error("[generate-event-posts]", err)
    return NextResponse.json({ error: "Failed to generate event posts." }, { status: 500 })
  }
}
