/**
 * OpenAI image generation for holiday greeting backgrounds.
 * Server-only — backgrounds are composited client-side with logo + slogan.
 */

import type { AiResult } from "./ai-result"
import type { HolidayTheme } from "./pio-holiday-graphic"

const BASE_RULES =
  "Wide cinematic 16:9 festive greeting-card background. Bold, bright, celebratory colors. Large proportionate decorations that fill the frame. Keep the center area relatively clear for text overlay. No text, no letters, no logos, no watermarks, no people's faces."

/**
 * Distinct prompt per HOLIDAY (not per theme). Several holidays share a
 * "patriotic" theme but must look clearly different — Veterans Day, Memorial
 * Day, Labor Day, Fourth of July, and Presidents' Day each get their own scene.
 * Keyed by lowercased holiday label.
 */
const HOLIDAY_PROMPTS: Record<string, string> = {
  "new year's":
    "New Year's Eve midnight celebration: gold and silver champagne sparkles, massive colorful fireworks over a city skyline, glitter, champagne bubbles and clock striking twelve motif, joyful and bright.",
  "valentine's day":
    "Valentine's Day: rich romantic pink and deep red, oversized glossy hearts, rose petals and roses, soft bokeh lighting, warm and loving.",
  "presidents' day":
    "Presidents' Day: dignified deep blue and gold, subtle American eagle and laurel motifs, white marble monument columns, gold stars, stately and formal — NO fireworks.",
  easter:
    "Easter spring morning: soft pastel decorated eggs, blooming tulips and lilies, fluffy bunnies and butterflies, bright green meadow and blue sky, cheerful daylight.",
  "mother's day":
    "Mother's Day: soft pink lavender and cream florals, large blooming peonies and roses, warm gentle spring sunshine, delicate and heartfelt — NO flags.",
  "memorial day":
    "Memorial Day remembrance: solemn but warm red white and blue, American flags at a peaceful cemetery lawn, red poppies, folded ribbon, soft golden dawn light, respectful and dignified — NO fireworks, NO party.",
  "father's day":
    "Father's Day: confident navy and warm gold, rugged outdoorsy elements like mountains or fishing and tools motifs, warm afternoon sunlight, bold and grounded — NO flags, NO hearts.",
  "fourth of july":
    "Fourth of July Independence Day: explosive vivid red white and blue, huge golden and blue fireworks bursting across a twilight sky, American flag bunting, sparklers and confetti, high-energy celebration.",
  "labor day":
    "Labor Day: proud red white and blue with industrial and craftsmanship motifs like gears hard hats and tools, end-of-summer picnic warmth, bright daytime sky, energetic and hardworking — NO fireworks.",
  halloween:
    "Halloween: vivid orange and purple, large friendly carved jack-o'-lanterns, bats and a full moon, autumn leaves and candy, spooky-but-fun moonlit scene, bold not gory.",
  "veterans day":
    "Veterans Day: honorable red white and blue, waving American flag, military service ribbons and gold stars, saluting eagle silhouette, dignified daytime sky, proud and respectful — NO fireworks, NO party confetti.",
  thanksgiving:
    "Thanksgiving harvest: burnt orange gold and amber, cornucopia overflowing with pumpkins gourds and autumn produce, large maple leaves, warm golden-hour glow, cozy and abundant.",
  hanukkah:
    "Hanukkah: deep blue and silver, large glowing nine-branch menorah with lit candles, Star of David and dreidel motifs, sparkling lights, festive night.",
  christmas:
    "Christmas winter wonderland: deep evergreen and crimson, decorated Christmas tree, large snowflakes and twinkling string lights, soft snowfall, cozy warm glow, bright not gloomy.",
  kwanzaa:
    "Kwanzaa: bold black red and green, seven-candle kinara alight, woven African-inspired patterns, harvest fruits and unity cup, warm celebratory light.",
}

const THEME_FALLBACK: Partial<Record<HolidayTheme, string>> = {
  patriotic:
    "Patriotic American holiday: bold red white and blue, waving flag and gold stars, bright sky, dignified and proud.",
  new_year: HOLIDAY_PROMPTS["new year's"],
  winter: HOLIDAY_PROMPTS.christmas,
  valentine: HOLIDAY_PROMPTS["valentine's day"],
  easter: HOLIDAY_PROMPTS.easter,
  mothers_day: HOLIDAY_PROMPTS["mother's day"],
  fathers_day: HOLIDAY_PROMPTS["father's day"],
  autumn: HOLIDAY_PROMPTS.thanksgiving,
  halloween: HOLIDAY_PROMPTS.halloween,
  hanukkah: HOLIDAY_PROMPTS.hanukkah,
  kwanzaa: HOLIDAY_PROMPTS.kwanzaa,
  default:
    "General holiday celebration: confetti, ribbons, bright streamers, colorful balloons, cheerful party atmosphere.",
}

export function holidayBackgroundPrompt(holidayLabel: string, theme: HolidayTheme): string {
  const key = holidayLabel.trim().toLowerCase()
  const style =
    HOLIDAY_PROMPTS[key] ?? THEME_FALLBACK[theme] ?? THEME_FALLBACK.default!
  return `${BASE_RULES} Occasion: ${holidayLabel}. ${style}`
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") || "image/png"
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export async function generateHolidayBackgroundImage(
  holidayLabel: string,
  theme: HolidayTheme
): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const prompt = holidayBackgroundPrompt(holidayLabel, theme)

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    // Prefer gpt-image-1 — always returns b64_json; do NOT pass response_format
    // (that param is rejected by the current Images API and was silently failing).
    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
        quality: "medium",
      })
      const b64 = response.data?.[0]?.b64_json
      if (b64) return { ok: true, data: `data:image/png;base64,${b64}` }
    } catch (gptErr) {
      const detail = gptErr instanceof Error ? gptErr.message : String(gptErr)
      console.warn("[pio-holiday-image-ai] gpt-image-1 failed, trying dall-e-3:", detail)
    }

    // Fallback: dall-e-3 returns a temporary URL when response_format is omitted.
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    })
    const item = response.data?.[0]
    if (item?.b64_json) {
      return { ok: true, data: `data:image/png;base64,${item.b64_json}` }
    }
    if (item?.url) {
      const dataUrl = await fetchImageAsDataUrl(item.url)
      if (dataUrl) return { ok: true, data: dataUrl }
    }
    return { ok: false, reason: "empty_response" }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[pio-holiday-image-ai] image error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index], index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  )
  return results
}

export type HolidayBackgroundRequest = {
  id: string
  label: string
  theme: HolidayTheme
}

export async function generateHolidayBackgroundsBatch(
  holidays: HolidayBackgroundRequest[],
  concurrency = 2
): Promise<Record<string, string>> {
  const backgrounds: Record<string, string> = {}
  await mapWithConcurrency(holidays, concurrency, async (holiday) => {
    const result = await generateHolidayBackgroundImage(holiday.label, holiday.theme)
    if (result.ok) backgrounds[holiday.id] = result.data
  })
  return backgrounds
}
