/**
 * Client-side canvas helpers for Press Center Graphic Studio.
 * Safety tips include SaferU branding; event graphics do not.
 */

export type GraphicAspect = "landscape" | "square"

export type SafetyTipGraphicInput = {
  categoryLabel?: string
  headline: string
  body: string
  agencyName?: string
  agencyLogoUrl?: string | null
  saferuLogoUrl?: string | null
  accent?: string
  aspect?: GraphicAspect
}

export type EventGraphicInput = {
  eventName: string
  dateTime: string
  location: string
  details?: string
  cta?: string
  agencyName?: string
  agencyLogoUrl?: string | null
  backgroundImageUrl?: string | null
  accent?: string
  aspect?: GraphicAspect
}

const STANDARD_ACCENT = "#F2B233"
const NAVY = "#0B1B3A"

function canvasSize(aspect: GraphicAspect): { width: number; height: number } {
  if (aspect === "square") return { width: 1080, height: 1080 }
  return { width: 1920, height: 1080 }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const lines: string[] = []
  let current = words[0]!
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
    } else {
      lines.push(current)
      current = words[i]!
      if (lines.length >= maxLines) break
    }
  }
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    const last = lines[maxLines - 1]!
    lines[maxLines - 1] = last.replace(/\s+\S*$/, "") + "…"
  }
  return lines
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  src: string | null | undefined,
  x: number,
  y: number,
  box: number
): Promise<boolean> {
  if (!src) return false
  const img = await loadImage(src)
  if (!img) return false
  const scale = Math.min(box / img.width, box / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, x + (box - w) / 2, y + (box - h) / 2, w, h)
  return true
}

function drawSaferuWordmark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  box: number
) {
  ctx.fillStyle = "rgba(255,255,255,0.92)"
  ctx.font = `700 ${Math.round(box * 0.28)}px Inter, Arial, sans-serif`
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText("SaferU", x + 8, y + box / 2)
}

/** Fallback template when AI image generation is unavailable. */
export async function createSafetyTipGraphic(
  input: SafetyTipGraphicInput
): Promise<string | null> {
  if (typeof document === "undefined") return null

  const aspect = input.aspect ?? "landscape"
  const { width, height } = canvasSize(aspect)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const accent = input.accent || STANDARD_ACCENT

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, "#0B1B3A")
  gradient.addColorStop(0.55, "#12284F")
  gradient.addColorStop(1, "#0F1C3F")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = accent
  ctx.fillRect(0, 0, width, Math.round(height * 0.012))

  const pad = Math.round(width * 0.06)
  const contentWidth = width - pad * 2

  ctx.fillStyle = accent
  ctx.font = `700 ${Math.round(height * 0.035)}px Inter, Arial, sans-serif`
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText((input.categoryLabel || "SAFETY TIP").toUpperCase(), pad, pad)

  ctx.fillStyle = "#FFFFFF"
  ctx.font = `800 ${Math.round(height * 0.085)}px Inter, Arial, sans-serif`
  const headlineLines = wrapText(ctx, input.headline || "Safety Tip", contentWidth, 3)
  let y = pad + Math.round(height * 0.08)
  for (const line of headlineLines) {
    ctx.fillText(line, pad, y)
    y += Math.round(height * 0.095)
  }

  ctx.fillStyle = "rgba(232,238,249,0.92)"
  ctx.font = `500 ${Math.round(height * 0.042)}px Inter, Arial, sans-serif`
  const bodyLines = wrapText(ctx, input.body || "", contentWidth * 0.92, 5)
  y += Math.round(height * 0.02)
  for (const line of bodyLines) {
    ctx.fillText(line, pad, y)
    y += Math.round(height * 0.055)
  }

  return compositeSafetyTipLogos({
    imageDataUrl: canvas.toDataURL("image/png"),
    agencyLogoUrl: input.agencyLogoUrl,
    agencyName: input.agencyName,
    saferuLogoUrl: input.saferuLogoUrl || "/images/saferu-logo.png",
  })
}

/** Stamp exact SaferU + agency logos onto an AI-generated safety graphic. */
export async function compositeSafetyTipLogos(opts: {
  imageDataUrl: string
  agencyLogoUrl?: string | null
  agencyName?: string
  saferuLogoUrl?: string | null
}): Promise<string | null> {
  if (typeof document === "undefined") return null

  const width = 1920
  const height = 1080
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const background = await loadImage(opts.imageDataUrl)
  if (!background) return null

  const scale = Math.max(width / background.width, height / background.height)
  const drawW = background.width * scale
  const drawH = background.height * scale
  ctx.drawImage(background, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH)

  // Soft brand bar so logos remain readable on any generated scene.
  const barH = Math.round(height * 0.22)
  const barY = height - barH
  const barGrad = ctx.createLinearGradient(0, barY, 0, height)
  barGrad.addColorStop(0, "rgba(11,27,58,0)")
  barGrad.addColorStop(0.35, "rgba(11,27,58,0.55)")
  barGrad.addColorStop(1, "rgba(11,27,58,0.88)")
  ctx.fillStyle = barGrad
  ctx.fillRect(0, barY, width, barH)

  const pad = Math.round(width * 0.035)
  const logoBox = Math.round(height * 0.155)
  const logoY = height - pad - logoBox

  // SaferU — bottom left (exact supplied logo; never redrawn by the image model).
  const saferuDrawn = await drawLogo(
    ctx,
    opts.saferuLogoUrl || "/images/saferu-logo.png",
    pad,
    logoY,
    logoBox
  )
  if (!saferuDrawn) drawSaferuWordmark(ctx, pad, logoY, logoBox)

  // Agency — bottom right.
  const rightX = width - pad - logoBox
  const agencyDrawn = await drawLogo(ctx, opts.agencyLogoUrl, rightX, logoY, logoBox)
  if (!agencyDrawn && opts.agencyName) {
    ctx.fillStyle = "rgba(255,255,255,0.92)"
    ctx.font = `600 ${Math.round(logoBox * 0.2)}px Inter, Arial, sans-serif`
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.fillText(opts.agencyName.slice(0, 36), width - pad, logoY + logoBox / 2)
  }

  return canvas.toDataURL("image/png")
}

/** Event graphic: agency logo only (no SaferU branding). */
export async function createEventGraphic(input: EventGraphicInput): Promise<string | null> {
  if (typeof document === "undefined") return null

  const aspect = input.aspect ?? "landscape"
  const { width, height } = canvasSize(aspect)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  const accent = input.accent || STANDARD_ACCENT

  if (input.backgroundImageUrl) {
    const bg = await loadImage(input.backgroundImageUrl)
    if (bg) {
      const scale = Math.max(width / bg.width, height / bg.height)
      const w = bg.width * scale
      const h = bg.height * scale
      ctx.drawImage(bg, (width - w) / 2, (height - h) / 2, w, h)
      ctx.fillStyle = "rgba(11,27,58,0.72)"
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.fillStyle = NAVY
      ctx.fillRect(0, 0, width, height)
    }
  } else {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#0B1B3A")
    gradient.addColorStop(1, "#16325C")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  ctx.fillStyle = accent
  ctx.fillRect(0, 0, Math.round(width * 0.014), height)

  const pad = Math.round(width * 0.07)
  const contentWidth = width - pad * 2

  ctx.fillStyle = accent
  ctx.font = `700 ${Math.round(height * 0.032)}px Inter, Arial, sans-serif`
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText("COMMUNITY EVENT", pad, pad)

  ctx.fillStyle = "#FFFFFF"
  ctx.font = `800 ${Math.round(height * 0.08)}px Inter, Arial, sans-serif`
  const titleLines = wrapText(ctx, input.eventName || "Community Event", contentWidth, 3)
  let y = pad + Math.round(height * 0.07)
  for (const line of titleLines) {
    ctx.fillText(line, pad, y)
    y += Math.round(height * 0.09)
  }

  ctx.fillStyle = "rgba(242,178,51,0.95)"
  ctx.font = `600 ${Math.round(height * 0.04)}px Inter, Arial, sans-serif`
  if (input.dateTime) {
    ctx.fillText(input.dateTime, pad, y)
    y += Math.round(height * 0.055)
  }
  ctx.fillStyle = "rgba(232,238,249,0.95)"
  if (input.location) {
    ctx.fillText(input.location, pad, y)
    y += Math.round(height * 0.055)
  }

  if (input.details) {
    ctx.fillStyle = "rgba(232,238,249,0.88)"
    ctx.font = `500 ${Math.round(height * 0.036)}px Inter, Arial, sans-serif`
    for (const line of wrapText(ctx, input.details, contentWidth * 0.9, 3)) {
      ctx.fillText(line, pad, y)
      y += Math.round(height * 0.048)
    }
  }

  if (input.cta) {
    y += Math.round(height * 0.02)
    ctx.fillStyle = accent
    drawRoundedRect(ctx, pad, y, Math.min(contentWidth * 0.45, 520), Math.round(height * 0.07), 14)
    ctx.fill()
    ctx.fillStyle = NAVY
    ctx.font = `700 ${Math.round(height * 0.032)}px Inter, Arial, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(input.cta, pad + Math.min(contentWidth * 0.45, 520) / 2, y + Math.round(height * 0.035))
    ctx.textAlign = "left"
  }

  const footerY = height - Math.round(height * 0.16)
  const logoBox = Math.round(height * 0.11)
  const rightX = width - pad - logoBox
  ctx.fillStyle = "rgba(255,255,255,0.1)"
  drawRoundedRect(ctx, rightX - 8, footerY - 8, logoBox + 16, logoBox + 16, 16)
  ctx.fill()
  const agencyDrawn = await drawLogo(ctx, input.agencyLogoUrl, rightX, footerY, logoBox)
  if (!agencyDrawn && input.agencyName) {
    ctx.fillStyle = "rgba(255,255,255,0.9)"
    ctx.font = `600 ${Math.round(logoBox * 0.18)}px Inter, Arial, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(input.agencyName.slice(0, 28), rightX + logoBox / 2, footerY + logoBox / 2)
  }

  return canvas.toDataURL("image/png")
}
