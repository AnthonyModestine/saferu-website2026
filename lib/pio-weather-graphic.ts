import type { PostOpportunity } from "@/lib/post-generator/types"
import { trafficPostTypeLabel, isActualRoadClosure } from "@/lib/post-generator/traffic-post-label"

/**
 * Client-side generator for a 16:9 public-safety alert graphic.
 *
 * We generate this locally (via <canvas>) instead of pulling an external
 * weather image so there is never a dead-link / missing-image experience.
 * The design is universal for police / fire / EMS: a dark cinematic
 * background with subtle emergency-light glows, a bold headline on the left,
 * a divider, and the agency badge + "PUBLIC INFORMATION" lockup on the right.
 * The agency logo lives in localStorage as a data URL, so this must run
 * on the client.
 */

export type WeatherAlertGraphicOptions = {
  logoUrl?: string | null
  agencyName?: string
  headline?: string
  subtitle?: string
  accent?: string
  /** Output width in px; height is derived as 16:9. */
  width?: number
}

/**
 * Standardized template constants — every generated graphic uses the SAME
 * color, letter sizing, and layout regardless of alert type. The only thing
 * that changes is the headline/subtitle text.
 */
const STANDARD_ACCENT = "#F2B233"

type AlertGraphicKind = "weather" | "public_works" | "community"

function alertHaystack(opp: Pick<PostOpportunity, "category" | "title">): string {
  return `${opp.category} ${opp.title}`.toLowerCase()
}

const PUBLIC_WORKS_CATEGORY_RE =
  /road_closure|traffic_advisory|boil_water|water_main|utility|public_works|sewer|hydrant/
const PUBLIC_WORKS_TEXT_RE =
  /road closure|road closed|lane closure|detour|speed limit|traffic advisory|boil water|water main|water service|water outage|hydrant|sewer|gas leak|power outage|utility|construction/

/** Classifies the PIO public-information template headline style. */
export function alertGraphicKind(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): AlertGraphicKind {
  // Keep in sync with engine `isOfficialAlertTemplateTopic` weather labels.
  if (opp.sourceLabel === "Weather Alert" || opp.sourceLabel === "Weather Analysis") {
    return "weather"
  }
  const haystack = alertHaystack(opp)
  if (PUBLIC_WORKS_CATEGORY_RE.test(opp.category) || PUBLIC_WORKS_TEXT_RE.test(haystack)) {
    return "public_works"
  }
  return "community"
}

export function isWeatherAlertOpportunity(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): boolean {
  const kind = alertGraphicKind(opp)
  return kind === "weather" || kind === "public_works"
}

/** Live community cards without a source graphic get the branded PIO template. */
export function needsAlertTemplateGraphic(opp: PostOpportunity): boolean {
  if (opp.opportunitySource === "saferu_curated") return false

  const existing = opp.graphicUrl || opp.graphicThumbnailUrl || opp.curated?.graphicUrl
  if (existing?.startsWith("data:")) return false

  if (
    existing &&
    !/placeholder-\d+\.jpg/i.test(existing) &&
    opp.graphicSourceName &&
    opp.graphicSourceName !== "SaferU"
  ) {
    return false
  }

  return true
}

/**
 * Short, standardized headline text for the graphic. Sizing/color are fixed by
 * the template; only this label changes per alert type.
 */
export function weatherAlertHeadline(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): string {
  const haystack = alertHaystack(opp)
  const kind = alertGraphicKind(opp)

  if (kind === "community") {
    if (/scam|fraud|phish|ic3|impersonation/.test(haystack)) return "Scam Alert"
    if (/missing person|amber|endangered/.test(haystack)) return "Missing Person"
    if (/wildfire|structure fire|fire department|smoke/.test(haystack)) return "Fire Alert"
    if (/police|suspect|crime|shooting|robbery|theft/.test(haystack)) return "Police Alert"
    if (/school|student|district/.test(haystack)) return "School Notice"
    if (/health|air quality|outbreak/.test(haystack)) return "Health Notice"
    if (/law|ordinance|legislation|statute/.test(haystack)) return "Community Notice"
    if (opp.sourceLabel === "National Safety Alert" || opp.sourceLabel === "Federal Advisory") {
      return "Public Safety Alert"
    }
    if (
      /community_event|celebration|festival|gathering|night out|meeting|community day/.test(haystack)
    ) {
      return "Community Event"
    }
    return "Community Update"
  }

  // ----- Weather -----
  if (/tornado warning/.test(haystack)) return "Tornado Warning"
  if (/tornado watch/.test(haystack)) return "Tornado Watch"
  if (/severe thunderstorm warning|thunderstorm warning/.test(haystack)) {
    return "Thunderstorm Warning"
  }
  if (/severe thunderstorm watch|thunderstorm watch/.test(haystack)) {
    return "Thunderstorm Watch"
  }
  if (/severe thunderstorm|thunderstorm/.test(haystack)) return "Thunderstorm Alert"
  if (/winter storm warning/.test(haystack)) return "Winter Storm Warning"
  if (/winter weather advisory|winter storm watch|ice storm|blizzard/.test(haystack)) {
    return "Winter Weather Alert"
  }
  if (/flash flood warning|flood warning/.test(haystack)) return "Flood Warning"
  if (/flood watch|flood advisory/.test(haystack)) return "Flood Watch"

  // ----- Public works -----
  const trafficLabel = trafficPostTypeLabel(haystack)
  if (trafficLabel) return trafficLabel

  if (/boil water/.test(haystack)) return "Boil Water Advisory"
  if (/water main/.test(haystack)) return "Water Main Break"
  if (/hydrant/.test(haystack)) return "Hydrant Flushing"
  if (/water service|water outage|water shut/.test(haystack)) return "Water Service Alert"
  if (/gas leak/.test(haystack)) return "Gas Leak"
  if (/power outage|utility/.test(haystack)) return "Utility Notice"
  if (isActualRoadClosure(haystack)) return "Road Closure"
  if (/traffic/.test(haystack)) return "Traffic Advisory"
  if (/scam|fraud|phish|ic3|impersonation/.test(haystack)) return "Scam Alert"
  if (/law|ordinance|legislation|statute/.test(haystack)) return "Community Notice"
  if (opp.sourceLabel === "National Safety Alert" || opp.sourceLabel === "Federal Advisory") {
    return "Public Safety Alert"
  }

  // ----- Fallbacks -----
  if (kind === "public_works") return "Public Works Notice"
  if (/heat|hot/.test(haystack)) return "Heat Alert"
  if (/winter|snow|ice|freez/.test(haystack)) return "Winter Weather Alert"
  if (/flood/.test(haystack)) return "Flood Alert"
  if (/tornado/.test(haystack)) return "Tornado Alert"
  return "Weather Alert"
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return `rgba(96,165,250,${alpha})`
  const num = parseInt(clean, 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const FONT_STACK = '"Segoe UI", "Helvetica Neue", Arial, sans-serif'

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string): void {
  try {
    // Supported in Chromium-based browsers (the app's runtime).
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value
  } catch {
    // no-op where unsupported
  }
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string
): void {
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, "#0d1526")
  base.addColorStop(1, "#05080f")
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Red emergency glow (bottom-left).
  const red = ctx.createRadialGradient(w * 0.12, h * 0.92, 0, w * 0.12, h * 0.92, w * 0.5)
  red.addColorStop(0, "rgba(220,38,38,0.30)")
  red.addColorStop(1, "rgba(220,38,38,0)")
  ctx.fillStyle = red
  ctx.fillRect(0, 0, w, h)

  // Blue emergency glow (upper-right of the text area).
  const blue = ctx.createRadialGradient(w * 0.6, h * 0.12, 0, w * 0.6, h * 0.12, w * 0.55)
  blue.addColorStop(0, "rgba(37,99,235,0.32)")
  blue.addColorStop(1, "rgba(37,99,235,0)")
  ctx.fillStyle = blue
  ctx.fillRect(0, 0, w, h)

  // Subtle hazard-tinted glow so the accent reads through.
  const acc = ctx.createRadialGradient(w * 0.32, h * 0.52, 0, w * 0.32, h * 0.52, w * 0.5)
  acc.addColorStop(0, hexToRgba(accent, 0.14))
  acc.addColorStop(1, hexToRgba(accent, 0))
  ctx.fillStyle = acc
  ctx.fillRect(0, 0, w, h)

  // Vignette for depth and text contrast.
  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.78)
  vig.addColorStop(0, "rgba(0,0,0,0)")
  vig.addColorStop(1, "rgba(0,0,0,0.55)")
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

/**
 * Renders a 16:9 alert graphic. Returns a PNG data URL, or an empty string
 * if canvas is unavailable.
 */
export async function createWeatherAlertImage(
  opts: WeatherAlertGraphicOptions
): Promise<string> {
  if (typeof document === "undefined") return ""
  const W = opts.width ?? 1600
  const H = Math.round((W * 9) / 16)
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  const accent = opts.accent ?? STANDARD_ACCENT
  const headline = opts.headline ?? "Public Information"

  drawBackground(ctx, W, H, accent)

  const padding = Math.round(W * 0.05)
  const dividerX = Math.round(W * 0.68)

  // ----- Left: alert type headline only -----
  const leftMaxWidth = dividerX - padding - Math.round(W * 0.04)

  const headlineSize = Math.round(H * 0.135)
  const headlineLetterSpacing = `${Math.max(1, Math.round(headlineSize * 0.008))}px`
  ctx.font = `800 ${headlineSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, headlineLetterSpacing)
  const headlineLines = wrapLines(ctx, headline, leftMaxWidth)

  const headlineLineHeight = headlineSize * 1.04
  const blockHeight = headlineLines.length * headlineLineHeight
  let cursorY = (H - blockHeight) / 2 + headlineSize

  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = `800 ${headlineSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, headlineLetterSpacing)
  ctx.shadowColor = "rgba(0,0,0,0.45)"
  ctx.shadowBlur = Math.round(H * 0.02)
  ctx.shadowOffsetY = Math.round(H * 0.004)
  headlineLines.forEach((line) => {
    ctx.fillText(line, padding, cursorY)
    cursorY += headlineLineHeight
  })
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // ----- Divider -----
  ctx.fillStyle = "rgba(255,255,255,0.22)"
  ctx.fillRect(dividerX, padding, Math.max(2, Math.round(W * 0.0015)), H - padding * 2)

  // ----- Right: agency logo with agency name below -----
  const rightPad = Math.round(W * 0.03)
  const rightLeft = dividerX + rightPad
  const rightRight = W - rightPad
  const rightWidth = rightRight - rightLeft
  const rightCenterX = (rightLeft + rightRight) / 2
  const name = (opts.agencyName ?? "").trim()
  const nameSize = Math.round(H * 0.034)

  ctx.font = `600 ${nameSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, "0px")
  const nameLines = name ? wrapLines(ctx, name, rightWidth).slice(0, 2) : []
  const nameLineHeight = nameSize * 1.25
  const logoGap = nameLines.length ? Math.round(H * 0.035) : 0

  const logoMax = Math.min(rightWidth, Math.round(H * 0.42))

  let logo: HTMLImageElement | null = null
  if (opts.logoUrl) {
    try {
      logo = await loadImage(opts.logoUrl)
    } catch {
      logo = null
    }
  }

  let logoDrawW = 0
  let logoDrawH = 0
  if (logo) {
    const scale = Math.min(logoMax / logo.width, logoMax / logo.height)
    logoDrawW = logo.width * scale
    logoDrawH = logo.height * scale
  } else {
    logoDrawW = logoMax * 0.8
    logoDrawH = logoMax * 0.8
  }

  const nameBlockHeight = nameLines.length * nameLineHeight
  const groupHeight = logoDrawH + logoGap + nameBlockHeight
  const logoY = (H - groupHeight) / 2

  if (logo) {
    ctx.drawImage(logo, rightCenterX - logoDrawW / 2, logoY, logoDrawW, logoDrawH)
  } else {
    const r = logoDrawH / 2
    const cx = rightCenterX
    const cy = logoY + r
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255,255,255,0.06)"
    ctx.fill()
    ctx.lineWidth = Math.max(2, Math.round(H * 0.004))
    ctx.strokeStyle = hexToRgba(accent, 0.8)
    ctx.stroke()
    const initials = name
      ? name
          .split(/\s+/)
          .slice(0, 3)
          .map((word) => word[0]?.toUpperCase() ?? "")
          .join("")
      : "PIO"
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `800 ${Math.round(r * 0.7)}px ${FONT_STACK}`
    setLetterSpacing(ctx, "0px")
    ctx.fillText(initials || "PIO", cx, cy)
  }

  if (nameLines.length) {
    let textY = logoY + logoDrawH + logoGap + nameSize
    ctx.textAlign = "center"
    ctx.textBaseline = "alphabetic"
    ctx.font = `600 ${nameSize}px ${FONT_STACK}`
    setLetterSpacing(ctx, "0px")
    ctx.fillStyle = accent
    nameLines.forEach((line) => {
      ctx.fillText(line, rightCenterX, textY)
      textY += nameLineHeight
    })
  }

  setLetterSpacing(ctx, "0px")
  return canvas.toDataURL("image/png")
}

/**
 * Attaches a standardized generated graphic to live community opportunities
 * that do not already carry a self-contained (data URL) graphic.
 * Mutates and returns the same array for convenience.
 */
export async function attachWeatherAlertGraphics(
  opportunities: PostOpportunity[],
  opts: { logoUrl?: string | null; agencyName?: string }
): Promise<PostOpportunity[]> {
  await Promise.all(
    opportunities.map(async (opp) => {
      if (!needsAlertTemplateGraphic(opp)) return
      try {
        const hasLocalGraphic = opp.graphicUrl?.startsWith("data:")
        if (hasLocalGraphic) return
        const headline = weatherAlertHeadline(opp)
        const dataUrl = await createWeatherAlertImage({
          logoUrl: opts.logoUrl,
          agencyName: opts.agencyName,
          headline,
        })
        if (!dataUrl) return
        opp.graphicUrl = dataUrl
        opp.graphicThumbnailUrl = dataUrl
        opp.graphicAltText = `${headline} public information graphic${
          opts.agencyName ? ` for ${opts.agencyName}` : ""
        }`
        opp.graphicSourceName = undefined
        opp.graphicSourceUrl = undefined
      } catch (err) {
        console.warn("[attachWeatherAlertGraphics] skipped graphic for", opp.id, err)
      }
    })
  )
  return opportunities
}
