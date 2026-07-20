/**
 * SaferU Event Message campaign: timing slots + prompt templates.
 * Selects only prompts whose recommended post date is still ahead (or today).
 */

export type EventCampaignKey =
  | "initial_announcement"
  | "event_highlight"
  | "one_week_reminder"
  | "what_to_expect"
  | "day_before"
  | "event_day"
  | "optional_final"
  | "thank_you"

export type EventSharedFacts = {
  organizationName: string
  organizationType: string
  eventName: string
  eventCategory: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  locationName: string
  fullAddress: string
  eventDescription: string
  eventHighlights: string
  contactEmail: string
  contactPhone: string
  isRecurring: string
  /** hosting | co_hosting | promoting | participating */
  agencyRole: string
  hostOrganization: string
  postEventNotes?: string
  eventPartners?: string
  photosAvailable?: string
  nextStep?: string
  audience?: string
  parking?: string
  registration?: string
  registrationRequired?: boolean
  registrationDeadline?: string
  registrationUrl?: string
  cost?: string
  accessibility?: string
  arrivalInstructions?: string
  website?: string
  primaryImage?: string
  additionalAssets?: string
  capacityStatus?: string
  weatherPlan?: string
  /** Whether optional final reminder is appropriate */
  allowOptionalFinalReminder?: boolean
}

export type CampaignSlot = {
  key: EventCampaignKey
  timingLabel: string
  recommendedPostDate: string
  recommendedPostTime: string
  timeUntilEvent: string
  strategicPurpose: string
  promptBody: string
}

export const EVENT_STAGE_PURPOSES: Record<EventCampaignKey, string> = {
  initial_announcement: "Build awareness early and give the community enough information to plan.",
  event_highlight: "Create a fresh reason to attend by spotlighting one or two supported benefits.",
  one_week_reminder: "Turn awareness into intent with a timely logistics-focused reminder.",
  what_to_expect: "Reduce uncertainty by helping prospective attendees picture the experience.",
  day_before: "Convert intent into attendance with an accurate tomorrow reminder.",
  event_day: "Reach people who can still attend with a concise, time-accurate same-day message.",
  optional_final: "Give eligible nearby audiences one final low-pressure opportunity to attend.",
  thank_you: "Close the campaign, recognize supported contributions, and sustain the relationship.",
}

const SHARED_RULES = `You are an experienced event marketing manager who helps public safety agencies, local governments, nonprofits, schools, and community organizations promote events.

Write a ready-to-share community message using only the event information provided.

Agency role controls voice and ownership (critical — messages must sound different by role):

HOSTING (agencyRole = "hosting"):
- Speak as the organizer: "We're hosting…", "Join us for…", "Our [department/agency] invites you…"
- Own the invite, logistics emphasis, and welcome.
- Natural for the agency to highlight its own staff, apparatus, and station.

CO-HOSTING (agencyRole = "co_hosting"):
- Speak as an equal partner, not the sole host.
- Name both {organizationName} and {hostOrganization} early (first or second sentence).
- Prefer partnership language: "Together with…", "We're partnering with…", "Join {organizationName} and {hostOrganization} for…"
- Do NOT write as if the agency alone is running the event.
- Do NOT bury the partner or write a standard host announcement with a small "partners" footnote.
- Share credit for the invitation; either organization can "welcome" the community as long as both are clear.

PROMOTING (agencyRole = "promoting"):
- Speak as a supporter amplifying someone else's event.
- Host is {hostOrganization}. Never claim {organizationName} is hosting.
- Prefer: "We're helping spread the word…", "Check out this event from…", "Mark your calendars for an event hosted by…"
- Agency may encourage attendance or public safety tips related to the event, but ownership stays with the host.

PARTICIPATING (agencyRole = "participating"):
- Speak as a guest presence at a larger event hosted by {hostOrganization}.
- Lead with what people can find from {organizationName} there (booth, truck, demos, safety checks) if highlights support that.
- Prefer: "Find us at…", "Stop by our [booth/apparatus] at…", "We'll be at {eventName} hosted by…"
- Do not claim the agency is organizing the full event.

When hostOrganization is provided, name it accurately. Do not invent a host or invent the agency's role.

Follow these rules:
- Do not invent activities, registration requirements, costs, parking details, sponsors, weather information, or other facts.
- Omit information that was not provided.
- Use a professional, approachable, and community-focused tone.
- Make the message easy to scan and understand.
- Avoid sounding corporate or overly promotional.
- Do not repeat the same opening used in earlier campaign messages.
- Do not place every event highlight into every message.
- Use the exact event date, time, and location when they are important.
- Include a clear next step or invitation that fits the agencyRole.
- Use emojis sparingly and only when appropriate.
- Do not add hashtags unless specifically requested.
- Do not mention that the message was generated by AI.

Return ONLY valid JSON with:
- postTitle (string)
- message (string)
- callToAction (string)
- suggestedImage (string)
- detailsToVerify (string array)`

function roleWritingBrief(agencyRole: string, organizationName: string, hostOrganization: string): string {
  const org = organizationName || "the agency"
  const host = hostOrganization || "the host organization"
  switch (agencyRole) {
    case "co_hosting":
      return `VOICE FOR THIS CAMPAIGN: CO-HOST
- Write every post as a joint invitation from ${org} and ${host}.
- Mention both organizations by name in each message.
- Do not sound like a solo host announcement. Avoid openings such as "We're hosting…" or "Our department presents…" unless both co-hosts are included in the same sentence.
- Call-to-action should feel shared (come celebrate with both organizations / join us and our partners).`
    case "promoting":
      return `VOICE FOR THIS CAMPAIGN: PROMOTING
- ${host} is the host. ${org} is only helping promote.
- Do not use host language for ${org} ("we're hosting", "our event" as sole owner).
- Frame as community awareness / sharing an upcoming event from ${host}.
- CTA should point people to the event details, not imply ${org} runs registration or owns the event unless that fact was provided.`
    case "participating":
      return `VOICE FOR THIS CAMPAIGN: PARTICIPATING
- ${host} hosts the overall event. ${org} will be there as a participant.
- Emphasize where to find ${org} at the event (booth, apparatus, demos) when highlights support it.
- Avoid implying ${org} is the main organizer.
- CTA can invite people to stop by ${org}'s presence at the larger event.`
    default:
      return `VOICE FOR THIS CAMPAIGN: HOSTING
- ${org} is hosting. Write as the organizer inviting the community.
- Partner/hostOrganization is not required for sole-host framing.`
  }
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y!, m! - 1, d!, 12, 0, 0, 0)
}

function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDays(ymd: string, delta: number): string {
  const d = parseYmd(ymd)
  d.setDate(d.getDate() + delta)
  return formatYmd(d)
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const a = parseYmd(fromYmd).getTime()
  const b = parseYmd(toYmd).getTime()
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

function parseStartHour(startTime: string): number | null {
  const raw = startTime.trim()
  if (!raw || /^tbd$/i.test(raw)) return null
  // HH:MM (24h) or h:mm AM/PM
  const m24 = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (m24) return Math.min(23, Math.max(0, Number(m24[1])))
  const m12 = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m12) {
    let h = Number(m12[1]) % 12
    if (/pm/i.test(m12[3]!)) h += 12
    return h
  }
  return null
}

function eventDayPostHoursBefore(startTime: string): { hoursBefore: number; label: string } {
  const hour = parseStartHour(startTime)
  if (hour == null) return { hoursBefore: 3, label: "about 3 hours before start" }
  if (hour < 10) return { hoursBefore: 1.5, label: "1–2 hours before start" }
  if (hour < 14) return { hoursBefore: 2.5, label: "2–3 hours before start" }
  if (hour < 18) return { hoursBefore: 3.5, label: "3–4 hours before start" }
  return { hoursBefore: 5, label: "4–6 hours before start" }
}

function subtractHoursFromStart(eventDate: string, startTime: string, hoursBefore: number): {
  postDate: string
  postTime: string
} {
  const hour = parseStartHour(startTime) ?? 12
  const minuteMatch = startTime.match(/:(\d{2})/)
  const minute = minuteMatch ? Number(minuteMatch[1]) : 0
  const d = parseYmd(eventDate)
  d.setHours(hour, minute, 0, 0)
  d.setTime(d.getTime() - hoursBefore * 60 * 60 * 1000)
  return {
    postDate: formatYmd(d),
    postTime: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
}

function fill(template: string, facts: EventSharedFacts & {
  recommendedPostDate: string
  recommendedPostTime: string
  timeUntilEvent: string
}): string {
  return template
    .replaceAll("{organizationName}", facts.organizationName || "not provided")
    .replaceAll("{organizationType}", facts.organizationType || "not provided")
    .replaceAll("{eventName}", facts.eventName)
    .replaceAll("{eventCategory}", facts.eventCategory || "not provided")
    .replaceAll("{eventType}", facts.eventType || "not provided")
    .replaceAll("{eventDate}", facts.eventDate)
    .replaceAll("{startTime}", facts.startTime || "not provided")
    .replaceAll("{endTime}", facts.endTime || "not provided")
    .replaceAll("{locationName}", facts.locationName || "not provided")
    .replaceAll("{fullAddress}", facts.fullAddress || "not provided")
    .replaceAll("{eventDescription}", facts.eventDescription || "not provided")
    .replaceAll("{eventHighlights}", facts.eventHighlights || "not provided")
    .replaceAll("{contactEmail}", facts.contactEmail || "not provided")
    .replaceAll("{contactPhone}", facts.contactPhone || "not provided")
    .replaceAll("{isRecurring}", facts.isRecurring)
    .replaceAll("{agencyRole}", facts.agencyRole || "hosting")
    .replaceAll("{hostOrganization}", facts.hostOrganization || "not provided")
    .replaceAll("{recommendedPostDate}", facts.recommendedPostDate)
    .replaceAll("{recommendedPostTime}", facts.recommendedPostTime)
    .replaceAll("{timeUntilEvent}", facts.timeUntilEvent)
    .replaceAll("{postEventNotes}", facts.postEventNotes || "not provided")
    .replaceAll("{eventPartners}", facts.eventPartners || "not provided")
    .replaceAll("{photosAvailable}", facts.photosAvailable || "not provided")
    .replaceAll("{nextStep}", facts.nextStep || "not provided")
}

const PROMPTS: Record<
  EventCampaignKey,
  (ctx: { recommendedPostDate: string; recommendedPostTime: string; timeUntilEvent: string }) => string
> = {
  initial_announcement: () => `Create the initial announcement for {eventName}.

Introduce the event to the community and explain:
- What the event is
- Who it is intended for
- When and where it will take place
- Why someone may want to attend
- One or two of the strongest event highlights

This is the first message in the campaign, so it should create awareness and help people begin planning.

Include the event date, start time, location, and a welcoming call to action.

Do not overload the message with every available detail. Recommend using the official event flyer or primary event image.`,

  event_highlight: () => `Create an event highlight message for {eventName}.

Choose one or two relevant items from {eventHighlights} and make them the main focus of the message.

Explain what attendees can experience, receive, learn, or participate in. Make the event sound worthwhile without exaggerating.

Do not simply repeat the initial announcement. The message should reveal a specific reason to attend.

Include enough date, time, and location information for the message to make sense on its own.

Recommend an image connected to the selected highlight, such as an activity photo, staff photo, demonstration photo, food photo, or picture from a previous event.`,

  one_week_reminder: () => `Create a one-week reminder for {eventName}.

Clearly tell the community that the event is one week away.

Include:
- Event date
- Start and end time
- Location
- Main reason to attend
- One or two important highlights
- Clear invitation or next step

The message should be more direct than the initial announcement while remaining friendly and community-focused.

Do not open with the exact phrase used in earlier posts. Recommend the official flyer, a countdown graphic, or a strong event photo.`,

  what_to_expect: () => `Create a “what to expect” message for {eventName}.

Help potential attendees understand what the experience will be like.

Use the event description and highlights to explain:
- What attendees will be able to do
- Who they may meet
- What activities or services will be available
- Who the event is best suited for
- Any useful arrival or preparation information that was actually provided

Do not invent parking instructions, accessibility details, items to bring, schedules, or requirements.

Include the event date, time, and location. Recommend an activity photo, event-location photo, previous event photo, or image showing staff preparing for the event.`,

  day_before: () => `Create a final day-before reminder for {eventName}.

Clearly communicate that the event is happening tomorrow.

Include:
- Event name
- Date
- Start time
- End time when useful
- Location
- Full address when available
- Important event highlights
- Contact information when useful
- A strong but welcoming invitation to attend

Only mention parking, weather, registration, accessibility, schedule changes, or preparation instructions when that information was provided.

Do not claim that the event is confirmed because of weather unless confirmation information was supplied.

Recommend the official flyer, event location, preparation photo, parking map if provided, or a countdown image.`,

  event_day: () => `Create the main event-day reminder for {eventName}.

This message is scheduled for {recommendedPostTime}, approximately {timeUntilEvent} before the event begins.

Tell the community that the event is happening today.

Keep the message concise and include:
- Event name
- Start time
- Location
- One or two appealing highlights
- A direct invitation to attend

Use wording that is accurate for the scheduled posting time. Do not say “this morning,” “this afternoon,” or “tonight” unless it correctly matches the event and posting time.

Do not repeat the entire event description.

Recommend the official flyer, event setup photo, staff preparation photo, venue photo, or a simple “Today” graphic.`,

  optional_final: () => `Create a brief final reminder for {eventName}, which begins in approximately {timeUntilEvent}.

This is a last opportunity to reach people who can still make a spontaneous decision to attend.

Keep the message short and energetic.

Include:
- How soon the event begins
- Start time
- Location
- One strong reason to attend
- A direct invitation to come by

Do not make the message sound urgent or alarming.

Do not generate this post for registration-only, sold-out, early-morning, private, limited-capacity, or travel-dependent events.

Recommend a live setup photo, staff photo, venue photo, event sign, or official flyer.`,

  thank_you: () => `Create a post-event thank-you message for {eventName}.

Thank the community members who attended and acknowledge staff, volunteers, partners, or sponsors only when they were provided.

Use {postEventNotes} to mention meaningful results, activities, or moments from the event.

Do not invent attendance numbers, outcomes, quotes, partner names, or event results.

When no post-event details have been provided, write a general thank-you message that does not make unsupported claims.

Encourage the organization to attach event photos. Include {nextStep} when available, such as following the organization, viewing resources, attending another event, or watching for future updates.

Recommend a group photo, community interaction photo, activity photo, staff photo, or event photo collection.`,
}

/**
 * Build an adaptive campaign plan from today → event date.
 * When there aren't 30 days left, compress / reshuffle so remaining
 * posts still make a useful schedule (never leave past "30-day" holes).
 */
export function buildEventCampaignPlan(
  facts: EventSharedFacts,
  todayYmd: string,
  opts?: { includePast?: boolean; onlyKeys?: EventCampaignKey[] }
): CampaignSlot[] {
  const slots: CampaignSlot[] = []
  const eventDate = facts.eventDate
  const includePast = opts?.includePast === true
  const onlyKeys = opts?.onlyKeys
  const daysLeft = daysBetween(todayYmd, eventDate)

  const candidates = buildAdaptiveCandidates(facts, todayYmd, daysLeft)

  for (const c of candidates) {
    if (onlyKeys && onlyKeys.length > 0 && !onlyKeys.includes(c.key)) continue
    if (!includePast) {
      if (c.recommendedPostDate < todayYmd) continue
    }

    const ctx = {
      recommendedPostDate: c.recommendedPostDate,
      recommendedPostTime: c.recommendedPostTime,
      timeUntilEvent: c.timeUntilEvent,
    }
    const promptBody = fill(PROMPTS[c.key](ctx), { ...facts, ...ctx })
    slots.push({
      key: c.key,
      timingLabel: c.timingLabel,
      recommendedPostDate: c.recommendedPostDate,
      recommendedPostTime: c.recommendedPostTime,
      timeUntilEvent: c.timeUntilEvent,
      strategicPurpose: EVENT_STAGE_PURPOSES[c.key],
      promptBody,
    })
  }

  return slots
}

type PlanCandidate = {
  key: EventCampaignKey
  timingLabel: string
  recommendedPostDate: string
  recommendedPostTime: string
  timeUntilEvent: string
}

function daysLabel(n: number): string {
  if (n <= 0) return "today"
  if (n === 1) return "1 day"
  return `${n} days`
}

function buildAdaptiveCandidates(
  facts: EventSharedFacts,
  todayYmd: string,
  daysLeft: number
): PlanCandidate[] {
  const eventDate = facts.eventDate
  const out: PlanCandidate[] = []

  /** Push a slot only if its date is today or later (or thank-you on event day). */
  function push(
    key: EventCampaignKey,
    timingLabel: string,
    daysBefore: number,
    time: string,
    timeUntil: string
  ) {
    const date = addDays(eventDate, -daysBefore)
    if (date < todayYmd && key !== "thank_you") return
    // Avoid duplicate dates for pre-event posts (keep first purpose for that day)
    if (
      key !== "event_day" &&
      key !== "optional_final" &&
      key !== "thank_you" &&
      out.some((c) => c.recommendedPostDate === date && c.key !== "thank_you")
    ) {
      return
    }
    out.push({
      key,
      timingLabel,
      recommendedPostDate: date < todayYmd ? todayYmd : date,
      recommendedPostTime: time,
      timeUntilEvent: timeUntil,
    })
  }

  // Event already passed — thank-you only on the day after
  if (daysLeft < 0) {
    if (daysLeft === -1) {
      out.push({
        key: "thank_you",
        timingLabel: "Day-After Thank You",
        recommendedPostDate: addDays(eventDate, 1),
        recommendedPostTime: "10:00 AM",
        timeUntilEvent: "the day after the event",
      })
    }
    return out
  }

  // Event is today
  if (daysLeft === 0) {
    const dayTiming = eventDayPostHoursBefore(facts.startTime)
    const eventDayWhen = subtractHoursFromStart(eventDate, facts.startTime, dayTiming.hoursBefore)
    out.push({
      key: "event_day",
      timingLabel: "Event Day Reminder",
      recommendedPostDate: eventDayWhen.postDate < todayYmd ? todayYmd : eventDayWhen.postDate,
      recommendedPostTime: eventDayWhen.postTime,
      timeUntilEvent: dayTiming.label,
    })
    if (facts.allowOptionalFinalReminder !== false) {
      const startHour = parseStartHour(facts.startTime)
      if (startHour == null || startHour >= 8) {
        const finalWhen = subtractHoursFromStart(eventDate, facts.startTime, 1.5)
        out.push({
          key: "optional_final",
          timingLabel: "Final Reminder",
          recommendedPostDate: finalWhen.postDate,
          recommendedPostTime: finalWhen.postTime,
          timeUntilEvent: "1–2 hours",
        })
      }
    }
    out.push({
      key: "thank_you",
      timingLabel: "Day-After Thank You",
      recommendedPostDate: addDays(eventDate, 1),
      recommendedPostTime: "10:00 AM",
      timeUntilEvent: "the day after the event",
    })
    return out
  }

  // Build pre-event offsets based on how much time remains
  type Offset = { key: EventCampaignKey; daysBefore: number; label: string; time: string }
  const pre: Offset[] = []

  if (daysLeft >= 30) {
    pre.push(
      { key: "initial_announcement", daysBefore: 30, label: "30-Day Save the Date", time: "10:00 AM" },
      { key: "event_highlight", daysBefore: 14, label: "14-Day Reminder", time: "10:00 AM" },
      { key: "one_week_reminder", daysBefore: 7, label: "7-Day Reminder", time: "10:00 AM" },
      { key: "what_to_expect", daysBefore: 3, label: "3-Day What to Expect", time: "11:00 AM" },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else if (daysLeft >= 21) {
    pre.push(
      {
        key: "initial_announcement",
        daysBefore: daysLeft,
        label: `${daysLeft}-Day Save the Date`,
        time: "10:00 AM",
      },
      { key: "event_highlight", daysBefore: 14, label: "14-Day Reminder", time: "10:00 AM" },
      { key: "one_week_reminder", daysBefore: 7, label: "7-Day Reminder", time: "10:00 AM" },
      { key: "what_to_expect", daysBefore: 3, label: "3-Day What to Expect", time: "11:00 AM" },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else if (daysLeft >= 14) {
    pre.push(
      {
        key: "initial_announcement",
        daysBefore: daysLeft,
        label: `${daysLeft}-Day Save the Date`,
        time: "10:00 AM",
      },
      {
        key: "event_highlight",
        daysBefore: Math.max(7, Math.floor(daysLeft / 2)),
        label: `${Math.max(7, Math.floor(daysLeft / 2))}-Day Reminder`,
        time: "10:00 AM",
      },
      { key: "what_to_expect", daysBefore: 3, label: "3-Day What to Expect", time: "11:00 AM" },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else if (daysLeft >= 8) {
    pre.push(
      {
        key: "initial_announcement",
        daysBefore: daysLeft,
        label: "Save the Date",
        time: "10:00 AM",
      },
      {
        key: "one_week_reminder",
        daysBefore: Math.min(7, daysLeft - 1),
        label: `${Math.min(7, daysLeft - 1)}-Day Reminder`,
        time: "10:00 AM",
      },
      { key: "what_to_expect", daysBefore: 3, label: "3-Day What to Expect", time: "11:00 AM" },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else if (daysLeft >= 4) {
    pre.push(
      {
        key: "initial_announcement",
        daysBefore: daysLeft,
        label: "Announce the Event",
        time: "10:00 AM",
      },
      {
        key: "what_to_expect",
        daysBefore: Math.max(2, Math.floor(daysLeft / 2)),
        label: "What to Expect",
        time: "11:00 AM",
      },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else if (daysLeft === 3) {
    pre.push(
      { key: "initial_announcement", daysBefore: 3, label: "Announce the Event", time: "10:00 AM" },
      { key: "what_to_expect", daysBefore: 2, label: "What to Expect", time: "11:00 AM" },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else if (daysLeft === 2) {
    pre.push(
      { key: "initial_announcement", daysBefore: 2, label: "Announce the Event", time: "10:00 AM" },
      { key: "day_before", daysBefore: 1, label: "Day-Before Reminder", time: "4:00 PM" }
    )
  } else {
    // 1 day left
    pre.push({
      key: "initial_announcement",
      daysBefore: 1,
      label: "Tomorrow Reminder",
      time: "10:00 AM",
    })
  }

  // Deduplicate by daysBefore (keep first)
  const seenDays = new Set<number>()
  for (const item of pre) {
    if (item.daysBefore < 0) continue
    if (item.daysBefore > daysLeft) {
      // clamp first announcement to today
      if (item.key === "initial_announcement" && !seenDays.has(daysLeft)) {
        push(
          item.key,
          item.label,
          daysLeft,
          item.time,
          daysLabel(daysLeft)
        )
        seenDays.add(daysLeft)
      }
      continue
    }
    if (seenDays.has(item.daysBefore)) continue
    seenDays.add(item.daysBefore)
    push(item.key, item.label, item.daysBefore, item.time, daysLabel(item.daysBefore))
  }

  // Event day + optional final
  const dayTiming = eventDayPostHoursBefore(facts.startTime)
  const eventDayWhen = subtractHoursFromStart(eventDate, facts.startTime, dayTiming.hoursBefore)
  out.push({
    key: "event_day",
    timingLabel: "Event Day Reminder",
    recommendedPostDate: eventDayWhen.postDate,
    recommendedPostTime: eventDayWhen.postTime,
    timeUntilEvent: dayTiming.label,
  })

  if (facts.allowOptionalFinalReminder !== false) {
    const startHour = parseStartHour(facts.startTime)
    if (startHour == null || startHour >= 8) {
      const finalWhen = subtractHoursFromStart(eventDate, facts.startTime, 1.5)
      out.push({
        key: "optional_final",
        timingLabel: "Final Reminder",
        recommendedPostDate: finalWhen.postDate,
        recommendedPostTime: finalWhen.postTime,
        timeUntilEvent: "1–2 hours",
      })
    }
  }

  out.push({
    key: "thank_you",
    timingLabel: "Day-After Thank You",
    recommendedPostDate: addDays(eventDate, 1),
    recommendedPostTime: "10:00 AM",
    timeUntilEvent: "the day after the event",
  })

  // Sort by date then time-ish key order
  const keyOrder: EventCampaignKey[] = [
    "initial_announcement",
    "event_highlight",
    "one_week_reminder",
    "what_to_expect",
    "day_before",
    "event_day",
    "optional_final",
    "thank_you",
  ]
  out.sort((a, b) => {
    const d = a.recommendedPostDate.localeCompare(b.recommendedPostDate)
    if (d !== 0) return d
    return keyOrder.indexOf(a.key) - keyOrder.indexOf(b.key)
  })

  return out
}

export function eventCampaignSystemPrompt(): string {
  return SHARED_RULES
}

export function buildBatchUserPrompt(
  facts: EventSharedFacts,
  slots: CampaignSlot[],
  opts?: { channel?: string }
): string {
  const shared = {
    organizationName: facts.organizationName,
    organizationType: facts.organizationType,
    eventName: facts.eventName,
    eventCategory: facts.eventCategory,
    eventType: facts.eventType,
    eventDate: facts.eventDate,
    startTime: facts.startTime,
    endTime: facts.endTime,
    locationName: facts.locationName,
    fullAddress: facts.fullAddress,
    eventDescription: facts.eventDescription,
    eventHighlights: facts.eventHighlights,
    contactEmail: facts.contactEmail,
    contactPhone: facts.contactPhone,
    isRecurring: facts.isRecurring,
    agencyRole: facts.agencyRole,
    hostOrganization: facts.hostOrganization,
    postEventNotes: facts.postEventNotes ?? "",
    eventPartners: facts.eventPartners ?? "",
    photosAvailable: facts.photosAvailable ?? "",
    nextStep: facts.nextStep ?? "",
  }

  const channel = (opts?.channel || "Facebook").trim()
  const isX = /^x$/i.test(channel) || /twitter/i.test(channel)
  const channelRules = isX
    ? `TARGET CHANNEL: X (Twitter)
- Write each message as a post for X.
- Hard limit: the "message" field must be 280 characters or fewer (count carefully).
- Make it punchy and scannable. Prefer 1–2 short sentences.
- Skip long CTAs; keep callToAction very short or empty.
- Do not stuff hashtags. At most one hashtag only if it clearly helps.
- Do not use Facebook-style length or multi-paragraph posts.`
    : `TARGET CHANNEL: Facebook
- Write each message as a Facebook community post.
- A short paragraph or two is fine. Keep it readable on mobile.`

  return `Generate a SaferU event campaign using ONLY this shared event information:

${JSON.stringify(shared, null, 2)}

${roleWritingBrief(facts.agencyRole, facts.organizationName, facts.hostOrganization)}

${channelRules}

Generate exactly one message for each campaign slot below, in order.
The post dates are already adapted to how much time is left before the event — write each message for its given timingLabel and timeUntilEvent (do not assume a full 30-day campaign if the labels say otherwise).
Each message must have a different purpose, opening, focus, and suggestedImage.
Every message must match the agencyRole voice above — co-host, promote, and participate campaigns must NOT read like a sole-host campaign.
Do not invent facts that are missing (use omit / empty rather than guessing).
Set "channel" on each post to "${isX ? "X" : "Facebook"}".

Return JSON:
{
  "posts": [
    {
      "key": "<campaign key>",
      "channel": "${isX ? "X" : "Facebook"}",
      "postTitle": "...",
      "message": "...",
      "callToAction": "...",
      "suggestedImage": "...",
      "detailsToVerify": ["..."]
    }
  ]
}

Campaign slots:
${slots
  .map(
    (s, i) =>
      `${i + 1}. key=${s.key}
timingLabel=${s.timingLabel}
recommendedPostDate=${s.recommendedPostDate}
recommendedPostTime=${s.recommendedPostTime}
timeUntilEvent=${s.timeUntilEvent}

${s.promptBody}`
  )
  .join("\n\n---\n\n")}`
}
