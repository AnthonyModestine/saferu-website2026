import type { PostOpportunity } from "@/lib/post-generator/types"

/**
 * 16:9 holiday greeting graphics.
 *
 * This is a SINGLE standardized greeting-card template used for every holiday,
 * intentionally different from the weather/public-works alert template so a
 * holiday post never reads like an emergency warning. The layout is a fixed,
 * centered stack: agency logo on top, the holiday slogan in the middle at a
 * fixed font size, a short accent divider, and the agency name at the bottom.
 *
 * Only two things change per holiday: (1) the slogan text and (2) a subtle
 * festive color theme + one small motif. Everything else — placement, sizes,
 * spacing — stays identical so the output is consistent and never overloaded.
 */

export type HolidayGraphicOptions = {
  logoUrl?: string | null
  agencyName?: string
  slogan?: string
  theme?: HolidayTheme
  width?: number
  /** OpenAI-generated background — logo/slogan/name are composited on top. */
  backgroundDataUrl?: string | null
}

export type HolidayTheme =
  | "patriotic"
  | "winter"
  | "new_year"
  | "autumn"
  | "halloween"
  | "valentine"
  | "easter"
  | "st_patricks"
  | "juneteenth"
  | "mothers_day"
  | "fathers_day"
  | "mlk_day"
  | "hanukkah"
  | "groundhog"
  | "indigenous"
  | "kwanzaa"
  | "fiesta"
  | "mardi_gras"
  | "default"

/** USA holidays & observances — Muslim holidays intentionally excluded. */
export const US_HOLIDAY_CATALOG = [
  { label: "New Year's", match: /new year/i, theme: "new_year" as const, slogan: "Happy New Year!" },
  { label: "Valentine's Day", match: /valentine/i, theme: "valentine" as const, slogan: "Happy Valentine's Day!" },
  { label: "Presidents' Day", match: /president.?s?.?.day|washington.?s birthday/i, theme: "patriotic" as const, slogan: "Happy Presidents' Day!" },
  { label: "Easter", match: /easter/i, theme: "easter" as const, slogan: "Happy Easter!" },
  { label: "Mother's Day", match: /mother.?s day/i, theme: "mothers_day" as const, slogan: "Happy Mother's Day!" },
  { label: "Memorial Day", match: /memorial day/i, theme: "patriotic" as const, slogan: "Happy Memorial Day!" },
  { label: "Father's Day", match: /father.?s day/i, theme: "fathers_day" as const, slogan: "Happy Father's Day!" },
  { label: "Fourth of July", match: /independence|july 4|fourth of july/i, theme: "patriotic" as const, slogan: "Happy 4th of July!" },
  { label: "Labor Day", match: /labor day/i, theme: "patriotic" as const, slogan: "Happy Labor Day!" },
  { label: "Halloween", match: /halloween/i, theme: "halloween" as const, slogan: "Happy Halloween!" },
  { label: "Veterans Day", match: /veterans day/i, theme: "patriotic" as const, slogan: "Happy Veterans Day!" },
  { label: "Thanksgiving", match: /thanksgiving/i, theme: "autumn" as const, slogan: "Happy Thanksgiving!" },
  { label: "Hanukkah", match: /hanukkah|chanukah/i, theme: "hanukkah" as const, slogan: "Happy Hanukkah!" },
  { label: "Christmas", match: /christmas|winter holiday/i, theme: "winter" as const, slogan: "Merry Christmas!" },
  { label: "Kwanzaa", match: /kwanzaa/i, theme: "kwanzaa" as const, slogan: "Happy Kwanzaa!" },
] as const

const MUSLIM_HOLIDAY = /eid al|eid ul|eid-ul|ramadan|muharram|islamic new year|laylat al/i

const FONT_STACK = '"Segoe UI", "Helvetica Neue", Arial, sans-serif'

/**
 * Fixed layout constants (fractions of height/width) shared by every holiday.
 * Changing a value here changes every holiday card identically.
 */
const LAYOUT = {
  /** Slogan font size as a fraction of height — identical for all holidays. */
  sloganSizeRatio: 0.12,
  /** Agency name font size as a fraction of height. */
  nameSizeRatio: 0.036,
  /** Max logo box as a fraction of height. */
  logoMaxRatio: 0.3,
  /** Vertical gaps between stacked elements, as fractions of height. */
  logoGapRatio: 0.06,
  dividerGapRatio: 0.045,
  nameGapRatio: 0.04,
  /** Inset of the decorative frame from the canvas edge, as a fraction of height. */
  frameInsetRatio: 0.055,
} as const

type ThemePalette = {
  bgTop: string
  bgBottom: string
  glow: string
  accent: string
}

/**
 * Festive colored palettes — bold, saturated, celebratory. Backgrounds are
 * bright and vivid (not muddy or alert-like), with a rich deeper base so the
 * white slogan still reads with its soft shadow. A contrasting accent carries
 * the frame, divider, motif, and agency name. `glow` is a large centered wash
 * that keeps the middle bright and cheerful.
 */
const THEME_PALETTES: Record<HolidayTheme, ThemePalette> = {
  patriotic: { bgTop: "#2E63D6", bgBottom: "#0E266E", glow: "rgba(255,255,255,0.22)", accent: "#FFD65A" },
  winter: { bgTop: "#E02734", bgBottom: "#7A1119", glow: "rgba(255,255,255,0.2)", accent: "#FFE07A" },
  new_year: { bgTop: "#5A32C4", bgBottom: "#160F44", glow: "rgba(255,220,120,0.3)", accent: "#FFD65A" },
  autumn: { bgTop: "#F0761A", bgBottom: "#7A2E0C", glow: "rgba(255,220,150,0.26)", accent: "#FFD98A" },
  halloween: { bgTop: "#F58217", bgBottom: "#4A1470", glow: "rgba(255,180,40,0.26)", accent: "#FFC61A" },
  valentine: { bgTop: "#F0466E", bgBottom: "#7A123A", glow: "rgba(255,210,225,0.28)", accent: "#FFE3EC" },
  easter: { bgTop: "#A98CE8", bgBottom: "#4E3690", glow: "rgba(255,250,210,0.28)", accent: "#FFF4B8" },
  st_patricks: { bgTop: "#22B457", bgBottom: "#0C5A2A", glow: "rgba(255,235,120,0.24)", accent: "#FFE24A" },
  juneteenth: { bgTop: "#E82D38", bgBottom: "#0C4A20", glow: "rgba(255,225,120,0.28)", accent: "#FFD65A" },
  mothers_day: { bgTop: "#F072A6", bgBottom: "#933564", glow: "rgba(255,225,235,0.28)", accent: "#FFE3F0" },
  fathers_day: { bgTop: "#3A72C4", bgBottom: "#123058", glow: "rgba(200,225,255,0.24)", accent: "#CBE0FF" },
  mlk_day: { bgTop: "#3A2E6E", bgBottom: "#120E28", glow: "rgba(255,205,90,0.22)", accent: "#FFD65A" },
  hanukkah: { bgTop: "#2E6ECC", bgBottom: "#0C255E", glow: "rgba(255,230,140,0.3)", accent: "#FFE896" },
  groundhog: { bgTop: "#B89060", bgBottom: "#4E3E2A", glow: "rgba(255,240,200,0.24)", accent: "#FFE6B0" },
  indigenous: { bgTop: "#C86A22", bgBottom: "#3E200C", glow: "rgba(255,215,140,0.24)", accent: "#F0D088" },
  kwanzaa: { bgTop: "#242424", bgBottom: "#0C3A12", glow: "rgba(240,60,60,0.22)", accent: "#FFD65A" },
  fiesta: { bgTop: "#FA3636", bgBottom: "#127A34", glow: "rgba(255,255,255,0.2)", accent: "#FFFFFF" },
  mardi_gras: { bgTop: "#8A3AB0", bgBottom: "#123A18", glow: "rgba(255,225,40,0.28)", accent: "#FFD700" },
  default: { bgTop: "#2E63D6", bgBottom: "#0E2A66", glow: "rgba(255,215,110,0.24)", accent: "#FFD86B" },
}

const NON_HOLIDAY_SEASONAL =
  /fire prevention|preparedness|distracted driving|ems week|police week|vehicle theft|shopping season|back.to.school|motorcycle|pool season|severe weather season|spring flood|winter storm season|fireworks season|crime prevention month/i

function haystack(opp: Pick<PostOpportunity, "category" | "title">): string {
  return `${opp.category} ${opp.title}`.toLowerCase()
}

export function isHolidayOpportunity(
  opp: Pick<PostOpportunity, "sourceLabel" | "category" | "title">
): boolean {
  const h = haystack(opp)
  if (MUSLIM_HOLIDAY.test(h)) return false
  if (NON_HOLIDAY_SEASONAL.test(h)) return false
  if (opp.category === "holiday_safety") return true
  return US_HOLIDAY_CATALOG.some((entry) => entry.match.test(h))
}

export function holidayTheme(
  opp: Pick<PostOpportunity, "category" | "title">
): HolidayTheme {
  const h = haystack(opp)
  if (MUSLIM_HOLIDAY.test(h)) return "default"
  const entry = US_HOLIDAY_CATALOG.find((item) => item.match.test(h))
  return entry?.theme ?? "default"
}

/** Friendly greeting for the graphic — mixed case, not all-caps. */
export function holidaySlogan(opp: Pick<PostOpportunity, "category" | "title">): string {
  const h = haystack(opp)
  if (MUSLIM_HOLIDAY.test(h)) return "Season's Greetings!"
  const entry = US_HOLIDAY_CATALOG.find((item) => item.match.test(h))
  return entry?.slogan ?? "Season's Greetings!"
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return `rgba(242,178,51,${alpha})`
  const num = parseInt(clean, 16)
  return `rgba(${(num >> 16) & 0xff},${(num >> 8) & 0xff},${num & 0xff},${alpha})`
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return [242, 178, 51]
  const num = parseInt(clean, 16)
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
}

/** Blend two hex colors; t=0 → a, t=1 → b. */
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

/** Small deterministic PRNG so the starfield/scatter is stable across renders. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Dark themes that read as a night sky and benefit from a faint starfield. */
const NIGHT_THEMES = new Set<HolidayTheme>([
  "patriotic",
  "new_year",
  "mlk_day",
  "hanukkah",
  "halloween",
  "kwanzaa",
])

/**
 * A bold rippling flag ribbon of red and white stripes along the bottom edge —
 * gives patriotic cards a clear red-white-blue identity without sitting behind
 * the centered white/gold text.
 */
function drawFlagStripes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  topY: number
): void {
  const stripes = 7
  const bandH = h - topY
  const sh = bandH / stripes
  const amp = sh * 0.35
  ctx.save()
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#CE1126" : "#FFFFFF"
    const baseY = topY + i * sh
    ctx.beginPath()
    ctx.moveTo(0, baseY)
    for (let x = 0; x <= w; x += w / 40) {
      const yy = baseY + Math.sin((x / w) * Math.PI * 3 + i * 0.6) * amp
      ctx.lineTo(x, yy)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()
  }
  // Soft shadow where the ribbon meets the sky, for depth.
  const seam = ctx.createLinearGradient(0, topY - amp, 0, topY + amp * 2)
  seam.addColorStop(0, "rgba(0,0,0,0)")
  seam.addColorStop(1, "rgba(0,0,0,0.18)")
  ctx.fillStyle = seam
  ctx.fillRect(0, topY - amp, w, amp * 3)
  ctx.restore()
}

function drawStarField(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number
): void {
  const rand = mulberry32(0x5afe_1234)
  ctx.save()
  for (let i = 0; i < count; i++) {
    const x = rand() * w
    // Keep most stars in the upper 60% so the lower content area stays clean.
    const y = rand() * h * 0.62
    const r = (0.4 + rand() * 1.3) * (h / 900)
    const a = 0.15 + rand() * 0.45
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${a})`
    ctx.fill()
  }
  ctx.restore()
}

function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string): void {
  try {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value
  } catch {
    // no-op
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawHolidayBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: ThemePalette,
  theme: HolidayTheme
): void {
  // Rich three-stop vertical gradient: a slightly brighter crown up top, a
  // mid tone, then a deep base — reads with more depth than a flat two-stop.
  const crown = mixHex(palette.bgTop, "#ffffff", 0.12)
  const mid = mixHex(palette.bgTop, palette.bgBottom, 0.55)
  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, crown)
  base.addColorStop(0.42, palette.bgTop)
  base.addColorStop(0.72, mid)
  base.addColorStop(1, palette.bgBottom)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  // Faint starfield for night-sky themes, drawn before glows so it sits deep.
  if (NIGHT_THEMES.has(theme)) {
    drawStarField(ctx, w, h, Math.round((w * h) / 26000))
  }

  // Soft diagonal light sheen for a professional, lit-from-above feel.
  const sheen = ctx.createLinearGradient(0, 0, w * 0.65, h)
  sheen.addColorStop(0, "rgba(255,255,255,0.06)")
  sheen.addColorStop(0.4, "rgba(255,255,255,0.015)")
  sheen.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, w, h)

  // A large, bright centered festive glow that keeps the middle cheerful.
  const glow = ctx.createRadialGradient(w / 2, h * 0.44, 0, w / 2, h * 0.44, w * 0.62)
  glow.addColorStop(0, palette.glow)
  glow.addColorStop(0.55, palette.glow.replace(/[\d.]+\)$/, "0.05)"))
  glow.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)

  // Layered vignette (corners + bottom) for depth and text contrast — kept
  // lighter than the alert template so the bold colors stay bright.
  const vig = ctx.createRadialGradient(w / 2, h * 0.46, h * 0.28, w / 2, h * 0.5, w * 0.85)
  vig.addColorStop(0, "rgba(0,0,0,0)")
  vig.addColorStop(0.72, "rgba(0,0,0,0.08)")
  vig.addColorStop(1, "rgba(0,0,0,0.34)")
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)

  const floor = ctx.createLinearGradient(0, h * 0.72, 0, h)
  floor.addColorStop(0, "rgba(0,0,0,0)")
  floor.addColorStop(1, "rgba(0,0,0,0.22)")
  ctx.fillStyle = floor
  ctx.fillRect(0, 0, w, h)
}

/** Thin decorative frame in the accent color — signals a "greeting card". */
function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string
): void {
  const inset = Math.round(h * LAYOUT.frameInsetRatio)
  ctx.save()
  ctx.strokeStyle = hexToRgba(accent, 0.55)
  ctx.lineWidth = Math.max(2, Math.round(h * 0.0035))
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2)
  ctx.restore()
}

/**
 * One small, centered festive motif per holiday — sits on the accent divider.
 * Deliberately minimal (a single symbol) so the card never looks overloaded.
 */
function drawThemeMotif(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  theme: HolidayTheme,
  accent: string
): void {
  ctx.save()
  switch (theme) {
    case "patriotic":
    case "new_year":
      drawStar(ctx, cx, cy, size, accent)
      break
    case "winter":
      drawSnowflake(ctx, cx, cy, size, accent)
      break
    case "autumn":
      drawLeaf(ctx, cx, cy, size, accent)
      break
    case "halloween":
      drawStar(ctx, cx, cy, size * 0.7, accent)
      break
    case "valentine":
      drawHeart(ctx, cx, cy, size, accent)
      break
    case "easter":
      drawEasterEgg(ctx, cx, cy, size, accent, "#FFFFFF")
      break
    case "st_patricks":
      drawShamrock(ctx, cx, cy, size, accent)
      break
    case "juneteenth":
    case "kwanzaa":
      drawStar(ctx, cx, cy, size, accent)
      break
    case "mothers_day":
      drawFlower(ctx, cx, cy, size, accent, "#FFFFFF")
      break
    case "fathers_day":
      drawBowTie(ctx, cx, cy, size, size * 0.55, accent)
      break
    case "mlk_day":
      drawDove(ctx, cx, cy, size * 1.4, accent)
      break
    case "hanukkah":
      drawStar(ctx, cx, cy, size, accent)
      break
    case "groundhog":
      drawGroundhog(ctx, cx, cy, size * 0.55, accent)
      break
    case "indigenous":
      drawFeather(ctx, cx, cy, size * 1.4, accent)
      break
    case "fiesta":
      drawStar(ctx, cx, cy, size, accent)
      break
    case "mardi_gras":
      drawMask(ctx, cx, cy, size * 0.75, size * 0.55, accent, "#FFFFFF")
      break
    default: {
      ctx.beginPath()
      ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = accent
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string
): void {
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    const innerAngle = angle + Math.PI / 5
    ctx.lineTo(cx + Math.cos(innerAngle) * r * 0.4, cy + Math.sin(innerAngle) * r * 0.4)
  }
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  stroke: string
): void {
  ctx.strokeStyle = stroke
  ctx.lineWidth = Math.max(1.5, r * 0.12)
  ctx.lineCap = "round"
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
    ctx.stroke()
  }
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string
): void {
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.quadraticCurveTo(cx + r, cy, cx, cy + r)
  ctx.quadraticCurveTo(cx - r, cy, cx, cy - r)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

/* ---------- Festive illustration primitives ---------- */

/**
 * A rising rocket trail — a glowing streak that shoots up through the image and
 * bursts. Drawn additively so it blends with the night sky and the burst.
 */
function drawRocketTrail(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  thickness: number
): void {
  ctx.save()
  ctx.globalCompositeOperation = "lighter"
  // Curve the trail slightly for a lofted, arcing launch.
  const ctrlX = (x0 + x1) / 2 + (x1 - x0) * 0.12
  const ctrlY = (y0 + y1) / 2 - Math.abs(y0 - y1) * 0.1
  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  grad.addColorStop(0, hexToRgba(color, 0))
  grad.addColorStop(0.7, hexToRgba(color, 0.35))
  grad.addColorStop(1, hexToRgba(color, 0.9))
  ctx.strokeStyle = grad
  ctx.lineWidth = thickness
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.quadraticCurveTo(ctrlX, ctrlY, x1, y1)
  ctx.stroke()
  // Bright head at the top of the trail.
  const headR = thickness * 2.4
  const head = ctx.createRadialGradient(x1, y1, 0, x1, y1, headR)
  head.addColorStop(0, "rgba(255,255,255,0.95)")
  head.addColorStop(0.5, hexToRgba(color, 0.7))
  head.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = head
  ctx.beginPath()
  ctx.arc(x1, y1, headR, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * A photorealistic firework burst. Uses additive ("lighter") compositing so
 * overlapping light adds up like real pyrotechnics. Each spoke is a gravity-
 * curved "willow" trail made of fading ember dots, with a bright leading spark,
 * a colored halo, and a hot white core — closer to a real aerial shell.
 */
function drawFirework(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  colors: string[],
  seed = 1
): void {
  const rand = mulberry32(0xf00d + Math.round(cx * 13 + cy * 7) + seed)
  const primary = colors[0] ?? "#FFD65A"

  ctx.save()
  ctx.globalCompositeOperation = "lighter"

  // Ambient colored halo around the whole burst.
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.25)
  halo.addColorStop(0, hexToRgba(primary, 0.3))
  halo.addColorStop(0.4, hexToRgba(primary, 0.1))
  halo.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2)
  ctx.fill()

  const spokes = 38
  const gravity = r * 0.32 // downward droop at the tips (willow effect)
  const steps = 16
  for (let i = 0; i < spokes; i++) {
    const ang = (Math.PI * 2 * i) / spokes + (rand() - 0.5) * 0.04
    const color = colors[i % colors.length]
    const len = r * (0.82 + rand() * 0.2)
    const dirX = Math.cos(ang)
    const dirY = Math.sin(ang)

    // Ember dots along a gravity-curved path — brightest near the tip, fading in.
    for (let s = 3; s <= steps; s++) {
      const t = s / steps
      const dist = len * t
      const px = cx + dirX * dist
      const py = cy + dirY * dist + gravity * t * t
      const dotR = r * 0.026 * (1.1 - t * 0.5)
      const alpha = 0.12 + 0.7 * t // fade in toward the glowing tip
      const dot = ctx.createRadialGradient(px, py, 0, px, py, dotR)
      dot.addColorStop(0, hexToRgba(color, alpha))
      dot.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = dot
      ctx.beginPath()
      ctx.arc(px, py, dotR, 0, Math.PI * 2)
      ctx.fill()
    }

    // Bright leading spark at the very tip.
    const tipX = cx + dirX * len
    const tipY = cy + dirY * len + gravity
    const tipR = r * 0.055
    const tip = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, tipR)
    tip.addColorStop(0, "rgba(255,255,255,0.98)")
    tip.addColorStop(0.4, hexToRgba(color, 0.9))
    tip.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = tip
    ctx.beginPath()
    ctx.arc(tipX, tipY, tipR, 0, Math.PI * 2)
    ctx.fill()
  }

  // Hot white-gold core.
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.22)
  core.addColorStop(0, "rgba(255,255,255,0.98)")
  core.addColorStop(0.45, hexToRgba(primary, 0.75))
  core.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/** A simple stylized Christmas tree with a star on top. */
function drawChristmasTree(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  treeW: number,
  treeH: number,
  green: string,
  accent: string
): void {
  const tiers = 3
  const tierH = treeH / (tiers + 0.5)
  ctx.fillStyle = "#5A3A1E"
  const trunkW = treeW * 0.12
  ctx.fillRect(cx - trunkW / 2, baseY, trunkW, treeH * 0.1)
  ctx.fillStyle = green
  for (let i = 0; i < tiers; i++) {
    const topY = baseY - treeH + i * tierH * 0.85
    const halfW = (treeW / 2) * (1 - i * 0.22)
    const bottomY = topY + tierH * 1.35
    ctx.beginPath()
    ctx.moveTo(cx, topY)
    ctx.lineTo(cx - halfW, bottomY)
    ctx.lineTo(cx + halfW, bottomY)
    ctx.closePath()
    ctx.fill()
  }
  drawStar(ctx, cx, baseY - treeH - treeH * 0.04, treeW * 0.16, accent)
}

/** A friendly ghost with a wavy hem. */
function drawGhost(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  bodyW: number,
  bodyH: number,
  color: string
): void {
  const halfW = bodyW / 2
  const headR = halfW
  const shoulderY = topY + headR
  const hemY = topY + bodyH
  ctx.beginPath()
  ctx.arc(cx, shoulderY, headR, Math.PI, 0, false)
  ctx.lineTo(cx + halfW, hemY)
  const bumps = 4
  const bumpW = bodyW / bumps
  for (let i = 0; i < bumps; i++) {
    const x1 = cx + halfW - i * bumpW
    const x2 = x1 - bumpW
    const midX = (x1 + x2) / 2
    ctx.quadraticCurveTo(midX, hemY - bumpW * 0.6, x2, hemY)
  }
  ctx.lineTo(cx - halfW, shoulderY)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  // Eyes.
  ctx.fillStyle = "rgba(20,20,30,0.75)"
  const eyeR = headR * 0.16
  ctx.beginPath()
  ctx.arc(cx - headR * 0.35, shoulderY - headR * 0.1, eyeR, 0, Math.PI * 2)
  ctx.arc(cx + headR * 0.35, shoulderY - headR * 0.1, eyeR, 0, Math.PI * 2)
  ctx.fill()
}

/** A round jack-o'-lantern pumpkin. */
function drawPumpkin(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string
): void {
  ctx.fillStyle = "#4A7A2A"
  ctx.fillRect(cx - r * 0.06, cy - r * 1.15, r * 0.12, r * 0.35)
  ctx.fillStyle = color
  const lobes = [-0.55, -0.28, 0, 0.28, 0.55]
  for (const off of lobes) {
    ctx.beginPath()
    ctx.ellipse(cx + off * r, cy, r * 0.32, r * 0.85, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // Face.
  ctx.fillStyle = "rgba(30,15,5,0.7)"
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.4, cy - r * 0.25)
  ctx.lineTo(cx - r * 0.18, cy - r * 0.05)
  ctx.lineTo(cx - r * 0.6, cy - r * 0.05)
  ctx.closePath()
  ctx.moveTo(cx + r * 0.4, cy - r * 0.25)
  ctx.lineTo(cx + r * 0.18, cy - r * 0.05)
  ctx.lineTo(cx + r * 0.6, cy - r * 0.05)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.5, cy + r * 0.2)
  ctx.quadraticCurveTo(cx, cy + r * 0.55, cx + r * 0.5, cy + r * 0.2)
  ctx.lineTo(cx + r * 0.35, cy + r * 0.42)
  ctx.quadraticCurveTo(cx, cy + r * 0.3, cx - r * 0.35, cy + r * 0.42)
  ctx.closePath()
  ctx.fill()
}

function drawBat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.quadraticCurveTo(cx - size * 0.6, cy - size * 0.5, cx - size, cy)
  ctx.quadraticCurveTo(cx - size * 0.55, cy + size * 0.1, cx, cy + size * 0.15)
  ctx.quadraticCurveTo(cx + size * 0.55, cy + size * 0.1, cx + size, cy)
  ctx.quadraticCurveTo(cx + size * 0.6, cy - size * 0.5, cx, cy)
  ctx.closePath()
  ctx.fill()
}

function drawConfetti(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  angle: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = color
  ctx.fillRect(-size / 2, -size / 4, size, size / 2)
  ctx.restore()
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string
): void {
  ctx.beginPath()
  ctx.moveTo(cx, cy + r * 0.35)
  ctx.bezierCurveTo(cx, cy - r * 0.15, cx - r, cy - r * 0.55, cx - r, cy + r * 0.05)
  ctx.bezierCurveTo(cx - r, cy + r * 0.65, cx, cy + r * 0.95, cx, cy + r * 1.15)
  ctx.bezierCurveTo(cx, cy + r * 0.95, cx + r, cy + r * 0.65, cx + r, cy + r * 0.05)
  ctx.bezierCurveTo(cx + r, cy - r * 0.55, cx, cy - r * 0.15, cx, cy + r * 0.35)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function drawShamrock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string
): void {
  for (let i = 0; i < 3; i++) {
    const ang = (Math.PI * 2 * i) / 3 - Math.PI / 2
    const lx = cx + Math.cos(ang) * r * 0.45
    const ly = cy + Math.sin(ang) * r * 0.45
    ctx.beginPath()
    ctx.arc(lx, ly, r * 0.42, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.fillStyle = fill
  ctx.fillRect(cx - r * 0.08, cy, r * 0.16, r * 0.7)
}

function drawEasterEgg(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
  stripe: string
): void {
  ctx.beginPath()
  ctx.ellipse(cx, cy, r * 0.65, r, 0, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stripe
  ctx.lineWidth = Math.max(1.5, r * 0.08)
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath()
    ctx.ellipse(cx, cy + i * r * 0.28, r * 0.5, r * 0.12, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  petal: string,
  center: string
): void {
  for (let i = 0; i < 5; i++) {
    const ang = (Math.PI * 2 * i) / 5
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(ang) * r * 0.55, cy + Math.sin(ang) * r * 0.55, r * 0.38, r * 0.55, ang, 0, Math.PI * 2)
    ctx.fillStyle = petal
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2)
  ctx.fillStyle = center
  ctx.fill()
}

function drawBowTie(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: string
): void {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx - w, cy - h)
  ctx.lineTo(cx - w, cy + h)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + w, cy - h)
  ctx.lineTo(cx + w, cy + h)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(cx - w * 0.12, cy - h * 0.35, w * 0.24, h * 0.7)
}

function drawMenorah(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  w: number,
  h: number,
  metal: string,
  flame: string
): void {
  ctx.strokeStyle = metal
  ctx.lineWidth = Math.max(2, h * 0.04)
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(cx, baseY)
  ctx.lineTo(cx, baseY - h * 0.55)
  ctx.stroke()
  ctx.fillStyle = metal
  ctx.fillRect(cx - w / 2, baseY - h * 0.05, w, h * 0.08)
  const slots = 9
  for (let i = 0; i < slots; i++) {
    const x = cx - w / 2 + (w / (slots - 1)) * i
    const stemH = h * (0.28 + (i === 4 ? 0.18 : 0))
    ctx.beginPath()
    ctx.moveTo(x, baseY - h * 0.05)
    ctx.lineTo(x, baseY - stemH)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(x, baseY - stemH - h * 0.06, h * 0.03, h * 0.07, 0, 0, Math.PI * 2)
    ctx.fillStyle = flame
    ctx.fill()
  }
}

function drawGroundhog(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  body: string
): void {
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.ellipse(cx, cy, r * 0.9, r * 0.65, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy - r * 0.55, r * 0.45, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "rgba(30,20,10,0.7)"
  ctx.beginPath()
  ctx.arc(cx - r * 0.18, cy - r * 0.58, r * 0.07, 0, Math.PI * 2)
  ctx.arc(cx + r * 0.18, cy - r * 0.58, r * 0.07, 0, Math.PI * 2)
  ctx.fill()
}

function drawFeather(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  h: number,
  fill: string
): void {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(cx, cy - h / 2)
  ctx.quadraticCurveTo(cx + h * 0.22, cy, cx, cy + h / 2)
  ctx.quadraticCurveTo(cx - h * 0.22, cy, cx, cy - h / 2)
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.35)"
  ctx.lineWidth = Math.max(1, h * 0.03)
  ctx.beginPath()
  ctx.moveTo(cx, cy - h * 0.4)
  ctx.lineTo(cx, cy + h * 0.4)
  ctx.stroke()
}

function drawKinara(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  w: number,
  h: number,
  colors: string[]
): void {
  ctx.fillStyle = "#5A3A1E"
  ctx.fillRect(cx - w / 2, baseY - h * 0.08, w, h * 0.08)
  for (let i = 0; i < 7; i++) {
    const x = cx - w / 2 + (w / 6) * i
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(x - w * 0.025, baseY - h * 0.55, w * 0.05, h * 0.47)
    ctx.beginPath()
    ctx.ellipse(x, baseY - h * 0.58, h * 0.025, h * 0.06, 0, 0, Math.PI * 2)
    ctx.fillStyle = "#FFE08A"
    ctx.fill()
  }
}

function drawMask(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  fill: string,
  accent: string
): void {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.ellipse(cx - w * 0.35, cy - h * 0.1, w * 0.18, h * 0.22, 0, 0, Math.PI * 2)
  ctx.ellipse(cx + w * 0.35, cy - h * 0.1, w * 0.18, h * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.5, cy + h * 0.15)
  ctx.quadraticCurveTo(cx, cy + h * 0.55, cx + w * 0.5, cy + h * 0.15)
  ctx.lineWidth = Math.max(2, h * 0.08)
  ctx.strokeStyle = accent
  ctx.stroke()
}

function drawDove(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill: string
): void {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.ellipse(cx, cy, size * 0.35, size * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.2, cy - size * 0.05)
  ctx.quadraticCurveTo(cx - size * 0.7, cy - size * 0.55, cx - size * 0.35, cy - size * 0.35)
  ctx.quadraticCurveTo(cx - size * 0.55, cy - size * 0.15, cx - size * 0.2, cy - size * 0.05)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + size * 0.15, cy - size * 0.05)
  ctx.quadraticCurveTo(cx + size * 0.65, cy - size * 0.5, cx + size * 0.3, cy - size * 0.3)
  ctx.quadraticCurveTo(cx + size * 0.5, cy - size * 0.12, cx + size * 0.15, cy - size * 0.05)
  ctx.fill()
}

/**
 * Themed festive illustrations layered on the background, kept to the corners
 * and edges so the centered logo / slogan / name stay clear and readable.
 */
function drawHolidayDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: HolidayTheme,
  accent: string
): void {
  ctx.save()
  switch (theme) {
    case "patriotic": {
      // Bold red/white flag ribbon along the bottom for a true RWB feel.
      drawFlagStripes(ctx, w, h, h * 0.84)
      const red = "#FF3B52"
      const blue = "#5B9BFF"
      // Rocket trails shooting up through the image into the bursts.
      drawRocketTrail(ctx, w * 0.24, h * 0.9, w * 0.2, h * 0.32, "#FFFFFF", h * 0.006)
      drawRocketTrail(ctx, w * 0.78, h * 0.92, w * 0.82, h * 0.36, red, h * 0.006)
      drawRocketTrail(ctx, w * 0.5, h * 0.9, w * 0.52, h * 0.16, blue, h * 0.005)
      // Big, bold bursts sized proportionately to the canvas.
      drawFirework(ctx, w * 0.2, h * 0.32, h * 0.34, [red, "#FFFFFF", blue], 1)
      drawFirework(ctx, w * 0.82, h * 0.36, h * 0.3, [blue, "#FFFFFF", red], 2)
      drawFirework(ctx, w * 0.52, h * 0.16, h * 0.22, [red, "#FFFFFF", blue], 3)
      break
    }
    case "new_year": {
      const gold = ["#FFD65A", "#FFFFFF", "#FFF0B0"]
      const violet = ["#C9A6FF", "#FFFFFF", "#FFD65A"]
      // Rocket trails streaking up into the bursts.
      drawRocketTrail(ctx, w * 0.26, h * 0.92, w * 0.22, h * 0.34, "#FFD65A", h * 0.006)
      drawRocketTrail(ctx, w * 0.76, h * 0.9, w * 0.8, h * 0.3, "#C9A6FF", h * 0.006)
      // Large celebratory bursts filling the upper area.
      drawFirework(ctx, w * 0.22, h * 0.34, h * 0.36, gold, 1)
      drawFirework(ctx, w * 0.8, h * 0.3, h * 0.32, violet, 2)
      drawFirework(ctx, w * 0.53, h * 0.15, h * 0.2, gold, 3)
      ctx.globalAlpha = 0.85
      const confettiColors = [accent, "#FFFFFF", "#C9A6FF", "#FF6FA6"]
      for (let i = 0; i < 20; i++) {
        const x = w * (0.04 + (i / 20) * 0.92)
        const y = h * (0.06 + ((i * 37) % 100) / 100 * 0.16)
        drawConfetti(ctx, x, y, h * 0.032, confettiColors[i % confettiColors.length], i)
      }
      break
    }
    case "winter": {
      ctx.globalAlpha = 1
      drawChristmasTree(ctx, w * 0.14, h * 0.86, w * 0.15, h * 0.46, "#22935A", accent)
      drawChristmasTree(ctx, w * 0.87, h * 0.88, w * 0.12, h * 0.38, "#1E824F", accent)
      ctx.globalAlpha = 0.7
      for (let i = 0; i < 9; i++) {
        drawSnowflake(ctx, w * (0.06 + i * 0.11), h * (0.13 + (i % 3) * 0.05), h * 0.024, "#FFFFFF")
      }
      break
    }
    case "autumn": {
      ctx.globalAlpha = 0.95
      const leafColors = ["#FFB861", "#F0761A", "#D8541A", accent]
      const spots = [
        [0.11, 0.22],
        [0.9, 0.24],
        [0.15, 0.84],
        [0.86, 0.82],
        [0.5, 0.11],
        [0.7, 0.9],
        [0.3, 0.9],
      ]
      spots.forEach(([fx, fy], i) => {
        drawLeaf(ctx, w * fx, h * fy, h * (0.055 + (i % 3) * 0.012), leafColors[i % leafColors.length])
      })
      break
    }
    case "halloween": {
      ctx.globalAlpha = 1
      drawGhost(ctx, w * 0.16, h * 0.5, w * 0.15, h * 0.44, "rgba(255,255,255,0.96)")
      drawPumpkin(ctx, w * 0.85, h * 0.68, h * 0.18, "#F5851F")
      ctx.globalAlpha = 0.9
      drawBat(ctx, w * 0.34, h * 0.15, h * 0.08, "#150A26")
      drawBat(ctx, w * 0.66, h * 0.13, h * 0.065, "#150A26")
      drawBat(ctx, w * 0.5, h * 0.22, h * 0.05, "#150A26")
      break
    }
    case "valentine": {
      ctx.globalAlpha = 1
      drawHeart(ctx, w * 0.15, h * 0.3, h * 0.09, accent)
      drawHeart(ctx, w * 0.85, h * 0.32, h * 0.078, "#FFFFFF")
      drawHeart(ctx, w * 0.12, h * 0.8, h * 0.07, "#FF9EBE")
      drawHeart(ctx, w * 0.88, h * 0.78, h * 0.082, accent)
      ctx.globalAlpha = 0.8
      for (let i = 0; i < 6; i++) {
        drawHeart(ctx, w * (0.16 + i * 0.14), h * 0.11, h * 0.024, i % 2 ? "#FFFFFF" : accent)
      }
      break
    }
    case "easter": {
      ctx.globalAlpha = 1
      drawEasterEgg(ctx, w * 0.15, h * 0.7, h * 0.13, "#FFF4B8", "#F0466E")
      drawEasterEgg(ctx, w * 0.85, h * 0.72, h * 0.115, "#FFD0F0", "#22B457")
      drawEasterEgg(ctx, w * 0.19, h * 0.24, h * 0.095, "#D8F0FF", "#F0761A")
      drawEasterEgg(ctx, w * 0.82, h * 0.24, h * 0.1, "#C8F0D0", "#F0466E")
      break
    }
    case "st_patricks": {
      ctx.globalAlpha = 1
      drawShamrock(ctx, w * 0.15, h * 0.28, h * 0.11, accent)
      drawShamrock(ctx, w * 0.85, h * 0.3, h * 0.095, "#FFFFFF")
      drawShamrock(ctx, w * 0.12, h * 0.8, h * 0.085, accent)
      drawShamrock(ctx, w * 0.88, h * 0.78, h * 0.1, "#EAFBE0")
      break
    }
    case "juneteenth": {
      const jColors = ["#E82D38", "#FFFFFF", "#22B457", accent]
      // Celebratory bursts + bold stars.
      drawFirework(ctx, w * 0.2, h * 0.3, h * 0.28, ["#FFD65A", "#FFFFFF", "#E82D38"], 1)
      drawFirework(ctx, w * 0.82, h * 0.32, h * 0.24, ["#FFD65A", "#FFFFFF", "#22B457"], 2)
      ctx.globalAlpha = 0.9
      for (let i = 0; i < 7; i++) {
        drawStar(ctx, w * (0.09 + i * 0.14), h * 0.92, h * 0.02, jColors[i % jColors.length])
      }
      break
    }
    case "mothers_day": {
      ctx.globalAlpha = 1
      drawFlower(ctx, w * 0.15, h * 0.28, h * 0.1, accent, "#FFD65A")
      drawFlower(ctx, w * 0.85, h * 0.3, h * 0.09, "#FFB8D8", "#FFD65A")
      drawFlower(ctx, w * 0.12, h * 0.8, h * 0.082, accent, "#FFD65A")
      drawFlower(ctx, w * 0.88, h * 0.78, h * 0.088, "#FFE3F0", "#FFD65A")
      break
    }
    case "fathers_day": {
      ctx.globalAlpha = 1
      drawBowTie(ctx, w * 0.15, h * 0.3, h * 0.1, h * 0.056, accent)
      drawBowTie(ctx, w * 0.85, h * 0.32, h * 0.09, h * 0.05, "#FFFFFF")
      ctx.globalAlpha = 0.8
      for (let i = 0; i < 6; i++) {
        drawStar(ctx, w * (0.14 + i * 0.145), h * 0.9, h * 0.02, i % 2 ? "#FFFFFF" : accent)
      }
      break
    }
    case "mlk_day": {
      ctx.globalAlpha = 1
      drawDove(ctx, w * 0.16, h * 0.3, h * 0.18, "#FFFFFF")
      drawDove(ctx, w * 0.84, h * 0.32, h * 0.155, accent)
      ctx.globalAlpha = 0.8
      for (let i = 0; i < 7; i++) {
        drawStar(ctx, w * (0.09 + i * 0.14), h * 0.92, h * 0.018, i % 2 ? "#FFFFFF" : accent)
      }
      break
    }
    case "hanukkah": {
      ctx.globalAlpha = 1
      drawMenorah(ctx, w * 0.15, h * 0.86, w * 0.15, h * 0.3, accent, "#FFF0B0")
      drawMenorah(ctx, w * 0.85, h * 0.88, w * 0.12, h * 0.25, accent, "#FFF0B0")
      ctx.globalAlpha = 0.7
      for (let i = 0; i < 9; i++) {
        drawStar(ctx, w * (0.06 + i * 0.11), h * (0.13 + (i % 3) * 0.05), h * 0.022, "#FFFFFF")
      }
      break
    }
    case "groundhog": {
      ctx.globalAlpha = 1
      drawGroundhog(ctx, w * 0.16, h * 0.72, h * 0.14, "#9A7420")
      drawGroundhog(ctx, w * 0.85, h * 0.74, h * 0.115, "#B0882E")
      ctx.globalAlpha = 0.6
      for (let i = 0; i < 8; i++) {
        drawSnowflake(ctx, w * (0.08 + i * 0.12), h * 0.15, h * 0.02, "#FFFFFF")
      }
      break
    }
    case "indigenous": {
      ctx.globalAlpha = 1
      drawFeather(ctx, w * 0.15, h * 0.32, h * 0.22, accent)
      drawFeather(ctx, w * 0.85, h * 0.34, h * 0.19, "#FFFFFF")
      drawFeather(ctx, w * 0.13, h * 0.8, h * 0.16, "#F0C070")
      break
    }
    case "kwanzaa": {
      const kColors = ["#E82D38", "#1A1A1A", "#22B457"]
      ctx.globalAlpha = 1
      drawKinara(ctx, w * 0.15, h * 0.86, w * 0.15, h * 0.28, kColors)
      drawKinara(ctx, w * 0.85, h * 0.88, w * 0.12, h * 0.23, kColors)
      break
    }
    case "fiesta": {
      const fiesta = ["#FFFFFF", "#FFD65A", "#22B457", "#3AA0FF"]
      drawFirework(ctx, w * 0.2, h * 0.3, h * 0.26, ["#FFD65A", "#FFFFFF", "#22B457"], 1)
      drawFirework(ctx, w * 0.82, h * 0.32, h * 0.22, ["#FFFFFF", "#FFD65A", "#3AA0FF"], 2)
      ctx.globalAlpha = 0.95
      for (let i = 0; i < 16; i++) {
        const x = w * (0.04 + (i / 16) * 0.92)
        const y = h * (0.08 + ((i * 41) % 100) / 100 * 0.14)
        drawConfetti(ctx, x, y, h * 0.03, fiesta[i % fiesta.length], i * 0.5)
      }
      break
    }
    case "mardi_gras": {
      ctx.globalAlpha = 1
      drawMask(ctx, w * 0.16, h * 0.3, h * 0.1, h * 0.072, "#FFD700", "#6B2D8B")
      drawMask(ctx, w * 0.84, h * 0.32, h * 0.09, h * 0.065, "#6B2D8B", "#FFD700")
      const mg = ["#FFD700", "#B36BE0", "#22B457", "#FFFFFF"]
      ctx.globalAlpha = 0.95
      for (let i = 0; i < 16; i++) {
        drawConfetti(ctx, w * (0.05 + (i / 16) * 0.9), h * (0.08 + ((i * 47) % 100) / 100 * 0.14), h * 0.028, mg[i % mg.length], i)
      }
      break
    }
    default: {
      ctx.globalAlpha = 0.9
      const dots = [accent, "#FFFFFF"]
      for (let i = 0; i < 16; i++) {
        const x = w * (0.05 + (i / 16) * 0.9)
        const y = h * (0.08 + ((i * 53) % 100) / 100 * 0.14)
        drawConfetti(ctx, x, y, h * 0.028, dots[i % dots.length], i)
      }
    }
  }
  ctx.restore()
}

export async function createHolidayImage(opts: HolidayGraphicOptions): Promise<string> {
  if (typeof document === "undefined") return ""
  const W = opts.width ?? 1600
  const H = Math.round((W * 9) / 16)
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  const theme = opts.theme ?? "default"
  const palette = THEME_PALETTES[theme]
  const accent = palette.accent
  const slogan = opts.slogan ?? "Season's Greetings!"
  const name = (opts.agencyName ?? "").trim()

  if (opts.backgroundDataUrl) {
    try {
      const bg = await loadImage(opts.backgroundDataUrl)
      ctx.drawImage(bg, 0, 0, W, H)
      const overlay = ctx.createLinearGradient(0, 0, 0, H)
      overlay.addColorStop(0, "rgba(0,0,0,0.12)")
      overlay.addColorStop(0.5, "rgba(0,0,0,0.22)")
      overlay.addColorStop(1, "rgba(0,0,0,0.38)")
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, W, H)
    } catch {
      drawHolidayBackground(ctx, W, H, palette, theme)
      drawHolidayDecorations(ctx, W, H, theme, accent)
    }
  } else {
    drawHolidayBackground(ctx, W, H, palette, theme)
    drawHolidayDecorations(ctx, W, H, theme, accent)
  }
  drawFrame(ctx, W, H, accent)

  const centerX = W / 2
  const contentMaxWidth = W - Math.round(H * LAYOUT.frameInsetRatio) * 2 - Math.round(W * 0.08)

  // ----- Load logo first so the centered stack can be measured -----
  let logo: HTMLImageElement | null = null
  if (opts.logoUrl) {
    try {
      logo = await loadImage(opts.logoUrl)
    } catch {
      logo = null
    }
  }
  const logoMax = Math.round(H * LAYOUT.logoMaxRatio)
  let logoDrawW = logoMax
  let logoDrawH = logoMax
  if (logo) {
    const scale = Math.min(logoMax / logo.width, logoMax / logo.height)
    logoDrawW = logo.width * scale
    logoDrawH = logo.height * scale
  }

  // ----- Fixed slogan sizing — identical for every holiday -----
  const sloganSize = Math.round(H * LAYOUT.sloganSizeRatio)
  ctx.font = `700 ${sloganSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, "0px")
  const sloganLines = wrapLines(ctx, slogan, contentMaxWidth).slice(0, 2)
  const sloganLineHeight = sloganSize * 1.12
  const sloganBlockHeight = sloganLines.length * sloganLineHeight

  // ----- Agency name -----
  const nameSize = Math.round(H * LAYOUT.nameSizeRatio)
  ctx.font = `600 ${nameSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, "1px")
  const nameLines = name ? wrapLines(ctx, name.toUpperCase(), contentMaxWidth).slice(0, 2) : []
  const nameLineHeight = nameSize * 1.25
  const nameBlockHeight = nameLines.length * nameLineHeight

  // ----- Measure the whole centered stack: logo / slogan / divider / name -----
  const logoGap = Math.round(H * LAYOUT.logoGapRatio)
  const dividerGap = Math.round(H * LAYOUT.dividerGapRatio)
  const nameGap = Math.round(H * LAYOUT.nameGapRatio)
  const dividerThickness = Math.max(2, Math.round(H * 0.004))

  const stackHeight =
    logoDrawH +
    logoGap +
    sloganBlockHeight +
    dividerGap +
    dividerThickness +
    (nameLines.length ? nameGap + nameBlockHeight : 0)

  let cursorY = (H - stackHeight) / 2

  // ----- Logo (centered, top of stack) -----
  if (logo) {
    ctx.drawImage(logo, centerX - logoDrawW / 2, cursorY, logoDrawW, logoDrawH)
  } else {
    const r = logoDrawH / 2
    const cy = cursorY + r
    ctx.beginPath()
    ctx.arc(centerX, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255,255,255,0.06)"
    ctx.fill()
    ctx.lineWidth = Math.max(2, Math.round(H * 0.004))
    ctx.strokeStyle = hexToRgba(accent, 0.75)
    ctx.stroke()
    const initials = name
      ? name
          .split(/\s+/)
          .slice(0, 3)
          .map((w) => w[0]?.toUpperCase() ?? "")
          .join("")
      : "PIO"
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = `800 ${Math.round(r * 0.6)}px ${FONT_STACK}`
    setLetterSpacing(ctx, "0px")
    ctx.fillText(initials || "PIO", centerX, cy)
  }
  cursorY += logoDrawH + logoGap

  // ----- Slogan (centered, fixed size) -----
  ctx.textAlign = "center"
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = `700 ${sloganSize}px ${FONT_STACK}`
  setLetterSpacing(ctx, "0px")
  ctx.shadowColor = "rgba(0,0,0,0.35)"
  ctx.shadowBlur = Math.round(H * 0.012)
  ctx.shadowOffsetY = Math.round(H * 0.003)
  let sloganY = cursorY + sloganSize
  sloganLines.forEach((line) => {
    ctx.fillText(line, centerX, sloganY)
    sloganY += sloganLineHeight
  })
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  cursorY += sloganBlockHeight + dividerGap

  // ----- Accent divider with a single centered festive motif -----
  const dividerHalf = Math.round(W * 0.11)
  const motifSize = Math.round(H * 0.028)
  const dividerY = cursorY + dividerThickness / 2
  ctx.fillStyle = hexToRgba(accent, 0.85)
  ctx.fillRect(
    centerX - dividerHalf,
    cursorY,
    dividerHalf - motifSize * 1.6,
    dividerThickness
  )
  ctx.fillRect(
    centerX + motifSize * 1.6,
    cursorY,
    dividerHalf - motifSize * 1.6,
    dividerThickness
  )
  drawThemeMotif(ctx, centerX, dividerY, motifSize, theme, accent)
  cursorY += dividerThickness

  // ----- Agency name (centered, accent color) -----
  if (nameLines.length) {
    cursorY += nameGap
    let nameY = cursorY + nameSize
    ctx.textAlign = "center"
    ctx.textBaseline = "alphabetic"
    ctx.font = `600 ${nameSize}px ${FONT_STACK}`
    setLetterSpacing(ctx, "1px")
    ctx.fillStyle = accent
    nameLines.forEach((line) => {
      ctx.fillText(line, centerX, nameY)
      nameY += nameLineHeight
    })
  }

  setLetterSpacing(ctx, "0px")
  return canvas.toDataURL("image/png")
}

export async function attachHolidayGraphics(
  opportunities: PostOpportunity[],
  opts: {
    logoUrl?: string | null
    agencyName?: string
    backgrounds?: Record<string, string>
  }
): Promise<PostOpportunity[]> {
  await Promise.all(
    opportunities.map(async (opp) => {
      if (!isHolidayOpportunity(opp)) return
      if (opp.graphicUrl?.startsWith("data:") && !opts.backgrounds?.[opp.id]) return
      const slogan = holidaySlogan(opp)
      const dataUrl = await createHolidayImage({
        logoUrl: opts.logoUrl,
        agencyName: opts.agencyName,
        slogan,
        theme: holidayTheme(opp),
        backgroundDataUrl: opts.backgrounds?.[opp.id],
      })
      if (!dataUrl) return
      opp.graphicUrl = dataUrl
      opp.graphicThumbnailUrl = dataUrl
      opp.graphicAltText = `${slogan} greeting graphic${
        opts.agencyName ? ` from ${opts.agencyName}` : ""
      }`
      opp.graphicSourceName = undefined
      opp.graphicSourceUrl = undefined
    })
  )
  return opportunities
}

function holidaySlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

/** One post opportunity per USA holiday — used for the Ideas page showcase grid. */
export function buildHolidayShowcaseOpportunities(): PostOpportunity[] {
  const now = new Date().toISOString()
  return US_HOLIDAY_CATALOG.map((entry) => ({
    id: `holiday-showcase-${holidaySlug(entry.label)}`,
    title: entry.label,
    summary: `${entry.slogan} Ready-to-post holiday graphic for your agency.`,
    category: "holiday_safety",
    sourceLabel: "Seasonal Recommendation" as const,
    whyItMatters: `A timely ${entry.label} greeting helps your agency stay connected with the community.`,
    recommendedAction: "Share the holiday greeting with a short safety reminder when appropriate.",
    recommendedPostTiming: `Post in the days leading up to ${entry.label}.`,
    opportunitySource: "external" as const,
    priority: "plan_ahead" as const,
    status: "new" as const,
    timelinessScore: 50,
    safetyValueScore: 40,
    actionabilityScore: 80,
    sourceReliabilityScore: 90,
    curatedMatchScore: 0,
    freshnessScore: 50,
    totalScore: 60,
    confidenceLevel: "high" as const,
    discoveredAt: now,
    updatedAt: now,
  }))
}

export async function loadHolidayShowcase(
  opts: { logoUrl?: string | null; agencyName?: string }
): Promise<PostOpportunity[]> {
  const opportunities = buildHolidayShowcaseOpportunities()
  await attachHolidayGraphics(opportunities, opts)
  return opportunities
}

/** Merge OpenAI messages + backgrounds into showcase opportunities and re-render graphics. */
export async function applyHolidayAiContent(
  opportunities: PostOpportunity[],
  messages: Record<string, string>,
  backgrounds: Record<string, string> | undefined,
  opts: { logoUrl?: string | null; agencyName?: string }
): Promise<PostOpportunity[]> {
  for (const opp of opportunities) {
    const message = messages[opp.id]?.trim()
    if (message) opp.curatedMessage = message
    else if (!opp.curatedMessage) opp.curatedMessage = holidaySlogan(opp)
  }

  if (backgrounds && Object.keys(backgrounds).length > 0) {
    for (const opp of opportunities) {
      if (backgrounds[opp.id]) {
        opp.graphicUrl = undefined
        opp.graphicThumbnailUrl = undefined
      }
    }
    await attachHolidayGraphics(opportunities, { ...opts, backgrounds })
  }

  return opportunities
}

/** Payload for the holiday-content API. */
export function holidayShowcaseApiPayload(
  opportunities: PostOpportunity[]
): { id: string; label: string; slogan: string; theme: HolidayTheme }[] {
  return opportunities.map((opp) => ({
    id: opp.id,
    label: opp.title,
    slogan: holidaySlogan(opp),
    theme: holidayTheme(opp),
  }))
}
