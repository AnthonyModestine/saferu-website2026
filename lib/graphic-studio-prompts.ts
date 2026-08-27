import { graphicOnImageCopy } from "@/lib/graphic-studio-display-copy"
import type { SafetyTipCategory } from "@/lib/pio-graphic-studio-types"

/** Category-specific research guidance from the Graphic Studio product spec. */
const CATEGORY_SOURCE_GUIDANCE: Partial<Record<SafetyTipCategory, string>> = {
  "Fire & Cooking Safety":
    "Prioritize NFPA, U.S. Fire Administration, FEMA, CPSC, and official fire service resources.",
  "Crime Prevention":
    "Prioritize NCPC, FBI, DOJ, BJA, and official law-enforcement crime prevention resources.",
  "Scams & Fraud":
    "Prioritize FTC, FBI, U.S. Postal Inspection Service, IRS (tax scams), SSA, Medicare/CMS, and state attorneys general.",
  Cybersecurity: "Prioritize CISA, FBI, FTC, and NIST.",
  "Traffic & Roadway Safety":
    "Prioritize NHTSA, FMCSA, FHWA, and state Departments of Transportation.",
  "Emergency Preparedness": "Prioritize FEMA, Ready.gov, CDC, and NOAA/NWS when weather-related.",
  "Severe Weather": "Prioritize NOAA, National Weather Service, FEMA, and Ready.gov.",
  "Child & Family Safety": "Prioritize CPSC, NHTSA, Safe Kids, CDC, and relevant state agencies.",
  "Home Safety": "Prioritize CPSC, NFPA, and relevant official home safety agencies.",
  "Lithium-Ion Battery Safety":
    "Prioritize NFPA, U.S. Fire Administration, CPSC, and manufacturer guidance when product-specific.",
  "Health & Community Safety":
    "Prioritize CDC, FDA, and authoritative state/local public-health agencies.",
}

export function researchSourceGuidance(category: string): string {
  return (
    CATEGORY_SOURCE_GUIDANCE[category as SafetyTipCategory] ||
    "Prioritize official government sources and nationally recognized safety organizations."
  )
}

export const SAFETY_RESEARCH_SYSTEM = `You are the factual research and public-safety content engine for SaferU Graphic Studio.

Your job is NOT to generate an image.

Your job is to research a requested public-safety topic, verify the safety information, determine the most useful resident-facing takeaway, and produce a concise creative brief for another AI system that will create the graphic.

The user's category is a broad bucket only. The verified topic MUST match what the user asked for — not a random popular topic from that category.

RESEARCH REQUIREMENTS

Research the topic using CURRENT authoritative sources.

Prioritize official government sources, nationally recognized safety organizations, recognized standards organizations, and official manufacturer instructions when product-specific.

Cross-check consequential safety advice whenever practical.

COPY RULES — Do not copy source language unnecessarily. Do not include source organizations in resident-facing copy. ONE strong takeaway.

HEADLINE — Prefer 3–8 words.
SUPPORTING LINE — Prefer 15 words or fewer.
MAIN RESIDENT MESSAGE — Prefer approximately 10–35 words.
EMERGENCY MESSAGE — Only if genuinely useful. Keep very short.

VISUAL CONCEPT — Develop a visual that demonstrates the safety issue from the user's request.

Also include "caption": a Facebook caption in agency voice (we/you), 1-3 short sentences. Do not cite source organizations in the caption.

OUTPUT STRICT JSON only. No markdown.`

export function buildAgencyLogoPromptBlock(agencyLogoPresent: boolean): string {
  if (!agencyLogoPresent) {
    return `OFFICIAL AGENCY LOGO

No agency logo is provided.

Do not create a logo, placeholder, badge, patch, seal, or department name.
Do not insert SaferU branding.`
  }

  return `OFFICIAL AGENCY LOGO

An official agency logo is provided as a separate reference image input.

That reference image is ONLY the logo file — it is NOT the background canvas and must NOT be enlarged to fill the frame.

You MUST place the exact supplied agency logo into the finished composition exactly ONCE.

Place the logo in the BOTTOM-RIGHT corner. Do not move it elsewhere.

Target visual size: approximately 10–12% of canvas width with proportional height.

Maintain approximately 3–4% padding from the right and bottom edges.

DO NOT duplicate the logo.
DO NOT overlay a second copy on top of the first.
DO NOT use the logo image as a background, watermark, or large central element.
DO NOT invent a second badge, seal, or department emblem.
DO NOT recreate, stretch, distort, crop, or recolor the supplied logo.

AGENCY LOGO SAFE AREA (critical)

Reserve a clean bottom-right branding area BEFORE arranging the rest of the design.

The bottom-right zone (roughly the right 20% and bottom 18% of the canvas) must stay visually CLEAR for the logo:

- Use a solid color, soft gradient, or simple unobstructed background behind the logo — NOT busy photography, NOT diagrams, NOT text, NOT icons, NOT faces, NOT equipment drawn underneath the logo.
- Nothing may appear underneath, behind, overlapping, or immediately adjacent to the agency logo.
- Do not place headline, safety instructions, emergency instructions, faces, important objects, diagrams, arrows, warning symbols, or safety zones inside the logo area.
- The logo must sit on clean open space so it is fully readable and nothing is blocked by it.`
}

/** Prepended when the model receives a blank canvas + logo via multi-image edit. */
export function buildLogoReferenceInputRolesBlock(): string {
  return `IMAGE INPUT ROLES (read before designing)

- Input image 1: Blank 16:9 landscape canvas. Build the ENTIRE finished graphic on this canvas.
- Input image 2: Official agency logo ONLY. Place it once, small, bottom-right. Never duplicate, never enlarge to fill the canvas.

The logo reference is not part of the scene — do not treat it as a background layer or repeat it anywhere.`
}

export const GRAPHIC_MARGIN_RULES = `MARGINS AND SAFE ZONES (mandatory — failure to follow means the graphic is unusable)

The entire composition must fit comfortably INSIDE the canvas with NO text cropped or cut off by the edges.

MINIMUM INSET — no exceptions:
- Top: at least 14% empty padding before the first line of text or top of any foreground object.
- Left: at least 14% empty padding before any text begins.
- Right: at least 14% empty padding before any text ends (more clearance when the logo is bottom-right).
- Bottom: at least 16% empty padding before any text (the logo occupies the bottom-right corner below text).

TEXT RULES:
- Place ALL text in the upper-left or left third only — never across the full width, never in a bottom footer strip.
- Text column starts at 14% from the left and must not extend past 52% of canvas width.
- Every letter of every word must be fully visible — nothing clipped, truncated, or touching the canvas border.
- Use large mobile-readable type with generous line spacing.
- Total on-image words: under 40.

MAIN VISUAL:
- Foreground subjects, icons, and labels stay inside the center 72% of the canvas.
- Backgrounds may extend edge-to-edge, but no text or critical visuals in the outer 14% border on any side.`

/**
 * Safety graphic image prompt — matches the Graphic Studio product spec (IMAGE PROMPT).
 * OpenAI is the sole renderer; the website does not modify the returned image.
 */
export function buildSafetyImagePrompt(opts: {
  category: string
  verifiedTopic: string
  originalRequest: string
  audience: string
  headline: string
  supportingLine: string
  residentMessage: string
  emergencyMessage: string
  visualConcept: string
  style: string
  mustShow: string[]
  mustAvoid: string[]
  agencyLogoPresent: boolean
}): string {
  const display = graphicOnImageCopy({
    headline: opts.headline,
    supportingLine: opts.supportingLine,
    body: opts.residentMessage,
    emergencyMessage: opts.emergencyMessage,
  })

  const mustShow = opts.mustShow.length
    ? opts.mustShow.map((item) => `- ${item}`).join("\n")
    : "- the primary safety situation from the verified topic"
  const mustAvoid = opts.mustAvoid.length
    ? opts.mustAvoid.map((item) => `- ${item}`).join("\n")
    : "- stereotypes, gore, fake badges, unrelated safety topics"

  const supportingBlock = display.supportingLine
    ? `Supporting line: "${display.supportingLine}"`
    : "Supporting line: (none)"
  const emergencyBlock = display.emergencyMessage
    ? `Emergency callout: "${display.emergencyMessage}"`
    : "Emergency message: (none)"

  return `Create a professional 16:9 public-safety social media graphic.

This graphic will be published by an official police department, sheriff's office, fire department, EMS agency, emergency management agency, municipality, or other public agency.

It must look credible, polished, modern, and appropriate for an official agency social media account.

${buildAgencyLogoPromptBlock(opts.agencyLogoPresent)}

${GRAPHIC_MARGIN_RULES}

==================================================
VERIFIED CONTENT
==================================================

Topic: ${opts.verifiedTopic}
Category: ${opts.category}
Target Audience: ${opts.audience}
Original request: ${opts.originalRequest}

Headline: ${display.headline}
${supportingBlock}
Primary resident safety message: ${display.mainMessage}
${emergencyBlock}

Visual Concept: ${opts.visualConcept}
Preferred Style: ${opts.style}

The visual MUST show:
${mustShow}

The visual MUST NOT show:
${mustAvoid}

==================================================
PRIMARY DESIGN OBJECTIVE
==================================================

A resident scrolling social media should understand the primary safety lesson within approximately 2–3 seconds.

Teach ONE safety idea extremely well.

Use the visual itself to communicate as much of the safety lesson as possible.

This is NOT an article, brochure, presentation slide, dense checklist, or wall of text.

==================================================
FORMAT
==================================================

16:9 landscape. High resolution. Professional social-media graphic.

==================================================
LAYOUT
==================================================

Use one dominant visual, one large headline, one concise safety message, strong visual hierarchy, generous whitespace, large mobile-readable typography, clean margins, intentional composition.

Avoid tiny text, long paragraphs, full-width footer text bars, excessive cards, excessive icons, clutter, unnecessary decoration, information overload, and any text touching or near the canvas edge.

==================================================
VISUAL STYLE
==================================================

Allow the subject matter to influence the design. Use realistic scenes, polished illustration, clean diagrams, or modern infographic elements as appropriate — not the same template every time.

==================================================
COLOR
==================================================

Do NOT force SaferU colors. Choose a palette that supports this topic.
${paletteForCategory(opts.category)}

==================================================
VISUAL ACCURACY
==================================================

Physical relationships must be logical. The visual must accurately support the verified safety information.

==================================================
PEOPLE
==================================================

Do not associate crime, scams, unsafe behavior, or danger with protected characteristics. Avoid stereotypes.

==================================================
PUBLIC-SAFETY TONE
==================================================

Professional. Clear. Educational. Confident. Not sensational. No gore, clickbait, or marketing copy.

==================================================
TEXT
==================================================

Use ONLY the approved factual messaging supplied above.

Do not invent additional tips, statistics, laws, warnings, or source attributions.

All displayed text must be correctly spelled, crisp, legible, and fully visible within the safe margins.

==================================================
FINAL QUALITY TARGET
==================================================

The final graphic should look like something a professional PIO would publish on an official agency account.

Prioritize: 1) Safety accuracy 2) Immediate comprehension 3) Visual accuracy 4) Readability 5) Professional design 6) Agency branding`
}

/** Social post graphic — message and visual must match the approved post copy. */
export function buildPostOpportunityImagePrompt(opts: {
  title: string
  category: string
  sourceLabel: string
  headline: string
  mainMessage: string
  visualConcept: string
  agencyLogoPresent: boolean
}): string {
  const display = graphicOnImageCopy({
    headline: opts.headline,
    supportingLine: "",
    body: opts.mainMessage,
    emergencyMessage: "",
  })

  return `Create a professional 16:9 public-agency social media graphic paired with an official Facebook post.

This graphic will be published alongside the post copy below. The on-image text and visual MUST match the post topic — residents should recognize the same story in both.

${buildAgencyLogoPromptBlock(opts.agencyLogoPresent)}

${GRAPHIC_MARGIN_RULES}

POST TOPIC
Title: ${opts.title}
Category: ${opts.category}
Source context: ${opts.sourceLabel}

ON-IMAGE COPY (use only this — keep short)
Headline: ${display.headline}
Primary message: ${display.mainMessage}

VISUAL DIRECTION
${opts.visualConcept}

DESIGN
One dominant visual that supports the post topic. Large readable headline. Concise message. Professional PIO quality.
Do not invent facts, incidents, or agency branding. No SaferU branding.
Teach or highlight ONE idea extremely well — this is a social post graphic, not a brochure.`
}

function paletteForCategory(category: string): string {
  const key = category.toLowerCase()
  if (key.includes("fire") || key.includes("cooking")) {
    return "Topic palette: orange, red, white, charcoal, warm neutrals."
  }
  if (key.includes("scam") || key.includes("fraud") || key.includes("crime")) {
    return "Topic palette: navy, blue, red, warning colors."
  }
  if (key.includes("cyber")) {
    return "Topic palette: blue, cyan, purple, clean technology colors."
  }
  if (key.includes("weather")) {
    return "Topic palette: colors appropriate to the specific weather hazard."
  }
  if (key.includes("traffic") || key.includes("road")) {
    return "Topic palette: orange, yellow, blue, roadway neutrals."
  }
  if (key.includes("child") || key.includes("family")) {
    return "Topic palette: friendly blue, green, yellow, warm tones."
  }
  return "Use color intentionally to support the verified topic."
}
