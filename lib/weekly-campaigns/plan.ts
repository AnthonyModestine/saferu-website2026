import "server-only"

import { z } from "zod"
import { researchModel } from "@/lib/graphic-studio/constants"
import type {
  CampaignTheme,
  WeeklyCampaign,
  WeeklyCampaignBatch,
  WeeklyCampaignPost,
} from "@/lib/weekly-campaigns/types"
import { saveWeeklyCampaignBatch } from "@/lib/weekly-campaigns/store"

const planSchema = z.object({
  weekLabel: z.string().min(1),
  campaigns: z
    .array(
      z.object({
        title: z.string().min(1),
        summary: z.string().min(1),
        theme: z.enum(["seasonal", "weather", "crime_trend", "holiday", "community_safety"]),
        whyThisWeek: z.string().min(1),
        posts: z
          .array(
            z.object({
              topic: z.string().min(1),
              headline: z.string().min(1).max(80),
              message: z.string().min(1).max(400),
              messageFormat: z.enum(["paragraph", "callout", "bullets"]).default("paragraph"),
              visualConcept: z.string().min(1),
              importantVisualDetails: z.array(z.string()).default([]),
              caption: z.string().min(1),
            })
          )
          .min(4)
          .max(6),
      })
    )
    .min(2)
    .max(3),
})

function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function weekContext(): string {
  const now = new Date()
  const month = now.toLocaleString("en-US", { month: "long", timeZone: "America/New_York" })
  const weekday = now.toLocaleString("en-US", { weekday: "long", timeZone: "America/New_York" })
  const day = now.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  })
  return `Today is ${weekday}, ${day} (US Eastern). Current month: ${month}.`
}

export async function planWeeklyCampaignBatch(): Promise<WeeklyCampaignBatch> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set")

  const { default: OpenAI } = await import("openai")
  const openai = new OpenAI({ apiKey })

  const system = `You are SaferU's weekly public-safety content strategist.
SaferU publishes free safety campaigns for police, fire, EMS, emergency management, and local government agencies.

Create 2 or 3 distinct campaign options for THIS week only.
Prioritize:
- seasonal timing (back to school, holidays, summer heat, winter weather)
- weather threats that are currently relevant in the US (hurricanes, severe storms, flooding, heat, freeze, wildfire smoke when in season)
- timely crime / scam / traffic safety trends that agencies commonly post about
- community safety education that feels timely, not generic filler

Rules:
- Each campaign must have a clear theme and 4 to 6 social posts.
- Every on-graphic message must include WHAT + WHY + WHAT TO DO in plain English.
- Headlines: 3–8 words, concrete.
- Messages: short (~25–45 words), official public-safety tone, no fearmongering.
- Captions: Facebook/Instagram ready, 2–4 sentences, SaferU voice, no hashtag stuffing.
- Visual concepts must teach the lesson (hazard or safer action), not generic sirens/tape.
- Do not invent fake statistics, laws, or agency names.
- Campaigns should feel different from each other (not three versions of the same tip).
- Branding note: graphics will carry the SaferU logo; do not put agency names in copy.

Return JSON only.`

  const user = `${weekContext()}

Plan this week's SaferU Safety Campaign options for What's New.
Return JSON with weekLabel and campaigns[].`

  const completion = await openai.chat.completions.create({
    model: researchModel(),
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: `${user}

Return a JSON object with:
- weekLabel (string)
- campaigns (array of 2–3): title, summary, theme (seasonal|weather|crime_trend|holiday|community_safety), whyThisWeek, posts (array of 4–6 with topic, headline, message, messageFormat, visualConcept, importantVisualDetails, caption)`,
      },
    ],
  })
  const raw = completion.choices[0]?.message?.content?.trim()
  if (!raw) throw new Error("Campaign planner returned empty response")
  const result = planSchema.safeParse(JSON.parse(raw))
  if (!result.success) throw new Error(`Campaign planner invalid JSON: ${result.error.message}`)
  const parsed = result.data

  const now = new Date().toISOString()
  const campaigns: WeeklyCampaign[] = parsed.campaigns.map((c) => {
    const posts: WeeklyCampaignPost[] = c.posts.map((p) => ({
      id: id("post"),
      topic: p.topic.trim(),
      headline: p.headline.trim(),
      message: p.message.trim(),
      messageFormat: p.messageFormat,
      visualConcept: p.visualConcept.trim(),
      importantVisualDetails: p.importantVisualDetails.map((d) => d.trim()).filter(Boolean),
      caption: p.caption.trim(),
      imageUrl: null,
      status: "planned",
    }))
    return {
      id: id("camp"),
      title: c.title.trim(),
      summary: c.summary.trim(),
      theme: c.theme as CampaignTheme,
      whyThisWeek: c.whyThisWeek.trim(),
      posts,
      status: "pending_graphics",
    }
  })

  const batch: WeeklyCampaignBatch = {
    id: id("week"),
    weekLabel: parsed.weekLabel.trim(),
    createdAt: now,
    updatedAt: now,
    status: "open",
    campaigns,
  }

  await saveWeeklyCampaignBatch(batch)
  return batch
}
