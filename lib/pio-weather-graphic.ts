import type { PostOpportunity } from "@/lib/post-generator/types"

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

type AlertGraphicKind = "weather" | "public_works"

function alertHaystack(opp: Pick<PostOpportunity, "category" | "title">): string {
  return `${opp.category} ${opp.title}`.toLowerCase()
}

const PUBLIC_WORKS_CATEGORY_RE = /road_closure|boil_water|water_main|utility|public_works|sewer|hydrant/
const PUBLIC_WORKS_TEXT_RE =
  /road closure|road closed|lane closure|detour|boil water|water main|water service|water outage|hydrant|sewer|gas leak|power outage|utility|construction/

/** Which opportunities receive a standardized generated graphic (and what kind). */
export function alertGraphicKind(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): AlertGraphicKind | null {
  if (opp.sourceLabel === "Weather Alert") return "weather"
  const haystack = alertHaystack(opp)
  if (PUBLIC_WORKS_CATEGORY_RE.test(opp.category) || PUBLIC_WORKS_TEXT_RE.test(haystack)) {
    return "public_works"
  }
  return null
}

export function isWeatherAlertOpportunity(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): boolean {
  return alertGraphicKind(opp) !== null
}

/**
 * Short, standardized headline text for the graphic. Sizing/color are fixed by
 * the template; only this label changes per alert type.
 */
export function weatherAlertHeadline(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): string {
  const haystack = alertHaystack(opp)

  // ----- Weather -----
  if (/tornado warning/.test(haystack)) return "TORNADO WARNING"
  if (/tornado watch/.test(haystack)) return "TORNADO WATCH"
  if (/severe thunderstorm warning|thunderstorm warning/.test(haystack)) return "STORM WARNING"
  if (/severe thunderstorm watch|thunderstorm watch/.test(haystack)) return "STORM WATCH"
  if (/severe thunderstorm|thunderstorm/.test(haystack)) return "STORM ALERT"
  if (/winter storm warning/.test(haystack)) return "WINTER STORM WARNING"
  if (/winter weather advisory|winter storm watch|ice storm|blizzard/.test(haystack)) {
    return "WINTER WEATHER ALERT"
  }
  if (/flash flood warning|flood warning/.test(haystack)) return "FLOOD WARNING"
  if (/flood watch|flood advisory/.test(haystack)) return "FLOOD WATCH"

  // ----- Public works -----
  if (/boil water/.test(haystack)) return "BOIL WATER ADVISORY"
  if (/water main/.test(haystack)) return "WATER MAIN BREAK"
  if (/hydrant/.test(haystack)) return "HYDRANT FLUSHING"
  if (/water service|water outage|water shut/.test(haystack)) return "WATER SERVICE ALERT"
  if (/gas leak/.test(haystack)) return "GAS LEAK"
  if (/power outage|utility/.test(haystack)) return "UTILITY NOTICE"
  if (/road closure|road closed|lane closure|detour|closure|closed/.test(haystack)) {
    return "ROAD CLOSURE"
  }
  if (/traffic/.test(haystack)) return "TRAFFIC ADVISORY"

  // ----- Fallbacks -----
  if (alertGraphicKind(opp) === "public_works") return "PUBLIC WORKS NOTICE"
  if (/heat|hot/.test(haystack)) return "HEAT ALERT"
  if (/winter|snow|ice|freez/.test(haystack)) return "WINTER WEATHER ALERT"
  if (/flood/.test(haystack)) return "FLOOD ALERT"
  if (/tornado/.test(haystack)) return "TORNADO ALERT"
  return "WEATHER ALERT"
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
  const headline = (opts.headline ?? "WEATHER ALERT").toUpperCase()

  drawBackground(ctx, W, H, accent)

  const padding = Math.round(W * 0.05)
  const dividerX = Math.round(W * 0.68)

  // ----- Left: headline + subtitle -----
  const leftMaxWidth = dividerX - padding - Math.round(W * 0.04)

  // Fixed headline sizing for a consistent template across every alert.
  // Text wraps rather than resizing, so letter sizing is identical everywhere.
  const headlineSize = Math.round(H * 0.135)
  const headlineLetterSpacing = `${Math.max(1, Math.round(headlineSize * 0.01))}px`
  ctx.font = `800 ${headlineSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, headlineLetterSpacing)
  const headlineLines = wrapLines(ctx, headline, leftMaxWidth)

  const headlineLineHeight = headlineSize * 1.04
  const subtitle = (opts.subtitle ?? "").trim()
  const subtitleSize = Math.round(H * 0.038)
  let subtitleLines: string[] = []
  if (subtitle) {
    ctx.font = `500 ${subtitleSize}px ${FONT_STACK}`
    setLetterSpacing(ctx, "0px")
    subtitleLines = wrapLines(ctx, subtitle, leftMaxWidth).slice(0, 2)
  }

  const subtitleGap = subtitle ? Math.round(H * 0.05) : 0
  const subtitleLineHeight = subtitleSize * 1.28
  const blockHeight =
    headlineLines.length * headlineLineHeight +
    subtitleGap +
    subtitleLines.length * subtitleLineHeight
  let cursorY = (H - blockHeight) / 2 + headlineSize

  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = `800 ${headlineSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, `${Math.max(1, Math.round(headlineSize * 0.01))}px`)
  // Soft shadow for legibility over the background.
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

  if (subtitleLines.length) {
    cursorY += subtitleGap - headlineLineHeight + headlineSize * 0.15
    ctx.font = `500 ${subtitleSize}px ${FONT_STACK}`
    setLetterSpacing(ctx, "0px")
    ctx.fillStyle = "rgba(255,255,255,0.82)"
    subtitleLines.forEach((line) => {
      ctx.fillText(line, padding, cursorY)
      cursorY += subtitleLineHeight
    })
  }

  // ----- Divider -----
  ctx.fillStyle = "rgba(255,255,255,0.22)"
  ctx.fillRect(dividerX, padding, Math.max(2, Math.round(W * 0.0015)), H - padding * 2)

  // ----- Right: agency identity lockup -----
  const rightPad = Math.round(W * 0.03)
  const rightLeft = dividerX + rightPad
  const rightRight = W - rightPad
  const rightWidth = rightRight - rightLeft
  const rightCenterX = (rightLeft + rightRight) / 2

  const labelSize = Math.round(H * 0.05)
  const nameSize = Math.round(H * 0.032)
  const name = (opts.agencyName ?? "").trim()

  // Measure the text block so the logo + text group is vertically centered.
  ctx.font = `700 ${labelSize}px ${FONT_STACK}`
  const labelLineHeight = labelSize * 1.12
  const labelLines = ["PUBLIC", "INFORMATION"]
  ctx.font = `600 ${nameSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, "0px")
  const nameLines = name ? wrapLines(ctx, name.toUpperCase(), rightWidth).slice(0, 2) : []
  const nameLineHeight = nameSize * 1.25

  const logoMax = Math.min(rightWidth, Math.round(H * 0.42))
  const logoGap = Math.round(H * 0.05)
  const labelGap = Math.round(H * 0.03)

  const textBlockHeight =
    labelLines.length * labelLineHeight +
    (nameLines.length ? labelGap + nameLines.length * nameLineHeight : 0)

  // Determine logo draw size first (needs the image).
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

  const groupHeight = logoDrawH + logoGap + textBlockHeight
  let groupY = (H - groupHeight) / 2

  // Logo / badge.
  if (logo) {
    ctx.drawImage(logo, rightCenterX - logoDrawW / 2, groupY, logoDrawW, logoDrawH)
  } else {
    const r = logoDrawH / 2
    const cx = rightCenterX
    const cy = groupY + r
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

  // "PUBLIC INFORMATION" label.
  let textY = groupY + logoDrawH + logoGap + labelSize
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = `700 ${labelSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, `${Math.max(1, Math.round(labelSize * 0.04))}px`)
  labelLines.forEach((line) => {
    ctx.fillText(line, rightCenterX, textY)
    textY += labelLineHeight
  })

  // Agency name (accent color).
  if (nameLines.length) {
    textY += labelGap - labelLineHeight + labelSize * 0.2
    ctx.font = `600 ${nameSize}px ${FONT_STACK}`
    setLetterSpacing(ctx, "1px")
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
 * Attaches a standardized generated graphic to any weather alert or public
 * works opportunity (road closure, boil water advisory, etc.) that does not
 * already carry a self-contained (data URL) graphic.
 * Mutates and returns the same array for convenience.
 */
export async function attachWeatherAlertGraphics(
  opportunities: PostOpportunity[],
  opts: { logoUrl?: string | null; agencyName?: string }
): Promise<PostOpportunity[]> {
  await Promise.all(
    opportunities.map(async (opp) => {
      if (!isWeatherAlertOpportunity(opp)) return
      const hasLocalGraphic = opp.graphicUrl?.startsWith("data:")
      if (hasLocalGraphic) return
      const headline = weatherAlertHeadline(opp)
      const dataUrl = await createWeatherAlertImage({
        logoUrl: opts.logoUrl,
        agencyName: opts.agencyName,
        headline,
        subtitle: opp.title,
      })
      if (!dataUrl) return
      opp.graphicUrl = dataUrl
      opp.graphicThumbnailUrl = dataUrl
      opp.graphicAltText = `${headline} public information graphic${
        opts.agencyName ? ` for ${opts.agencyName}` : ""
      }`
      opp.graphicSourceName = undefined
      opp.graphicSourceUrl = undefined
    })
  )
  return opportunities
}
