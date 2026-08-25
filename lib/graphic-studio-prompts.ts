import { graphicOnImageCopy } from "@/lib/graphic-studio-display-copy"

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

Example: Category "Scams & Fraud" + user asks about Bitcoin impersonation → verified_topic must be about that scam, not an unrelated topic from a different category.

RESEARCH REQUIREMENTS

Research the topic using CURRENT authoritative sources.

Prioritize:

- official government sources
- nationally recognized safety organizations
- recognized standards organizations
- official manufacturer instructions when product-specific

Do not use random blogs, SEO articles, social media posts, or news stories as the primary authority when an authoritative source exists.

Cross-check consequential safety advice whenever practical.

DETERMINE

1. Primary hazard
2. Recommended resident action
3. What residents should avoid
4. Why the recommendation matters
5. Emergency action if relevant
6. Whether the user's request contains inaccurate or misleading assumptions

CORRECT INACCURATE REQUESTS

If the user's requested advice conflicts with authoritative safety guidance, do not preserve the inaccurate claim.

Replace it with accurate safety advice.

COPY RULES

Do not copy source language unnecessarily.

Do not include source organizations in resident-facing copy.

Create original public-safety language.

The finished graphic should communicate ONE strong takeaway.

HEADLINE — Prefer 3–8 words.
SUPPORTING LINE — Prefer 15 words or fewer.
MAIN RESIDENT MESSAGE — Prefer approximately 10–35 words.
EMERGENCY MESSAGE — Only if genuinely useful. Keep very short.

VISUAL CONCEPT

Develop a visual that actually demonstrates the safety issue from the user's request.

For scams: show the fake call, text, payment demand, gift card request, Bitcoin demand, QR code, etc.
For fire: show the correct response visually.
The visual should help residents understand the recommendation before they read all the text.

Also include "caption": a Facebook caption in agency voice (we/you), 1-3 short sentences. Do not cite source organizations in the caption.

OUTPUT STRICT JSON only. No markdown.`

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

  const paletteHint = paletteForCategory(opts.category)

  const logoBlock = opts.agencyLogoPresent
    ? `An official agency logo is provided as an image input.

The attached image is ONLY the agency logo — not the background of the graphic.

You MUST incorporate the exact supplied agency logo into the finished composition exactly ONCE.

Place the logo in the BOTTOM-RIGHT corner.

Design the full 16:9 graphic around the logo from the beginning.

Reserve a clean bottom-right branding area BEFORE arranging text or important imagery.

Target visual size: approximately 10–12% of canvas width with proportional height.

Maintain approximately 3–4% padding from the right and bottom edges.

Nothing important should appear underneath or behind the logo.

DO NOT duplicate the logo.
DO NOT invent a second badge, seal, or department emblem.
DO NOT invent a new logo, recreate the supplied logo from memory, stretch, distort, crop, or recolor it.`
    : `No agency logo is provided.

Do not create a logo.
Do not create a placeholder.
Do not insert SaferU branding.
Do not invent a badge, patch, seal, or department name.`

  const supportingBlock = display.supportingLine
    ? `Supporting line (one line only): "${display.supportingLine}"`
    : "Supporting line: (none — do not invent one)"

  const emergencyBlock = display.emergencyMessage
    ? `Emergency callout (small, optional): "${display.emergencyMessage}"`
    : "Emergency message: (none — do not invent one)"

  return `Create a professional 16:9 public-safety social media graphic.

This graphic will be published by an official police department, sheriff's office, fire department, EMS agency, emergency management agency, municipality, or other public agency.

It must look credible, polished, modern, and appropriate for an official agency social media account.

==================================================
CRITICAL — TOPIC AND COPY LOCK
==================================================

Safety category: ${opts.category}
Verified topic (the ONLY subject of this graphic): ${opts.verifiedTopic}
Original agency request: ${opts.originalRequest}

You MUST design a graphic about the verified topic above.
DO NOT substitute an unrelated safety subject from a different category.

ON-GRAPHIC TEXT (strict — these are the ONLY words to render on the image):
Headline: "${display.headline}"
${supportingBlock}
Main message (1–2 short lines max, left side only): "${display.mainMessage}"
${emergencyBlock}

Do not render a full-width footer bar, bottom paragraph strip, or edge-to-edge text block.
Do not cram the entire approved copy onto the graphic — keep total on-image text under 45 words.
Keep at least 8% margin on the left, top, and right edges.
Keep the bottom 18% of the canvas free of text (logo safe zone).

Do not invent additional tips, statistics, laws, warnings, or different headline/body wording.

==================================================
VERIFIED CONTENT
==================================================

Topic: ${opts.verifiedTopic}
Target Audience: ${opts.audience}
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

Place all text in the upper-left or left third of the canvas — never in a full-width band across the bottom.

Avoid tiny text, long paragraphs, full-width footer text bars, excessive cards, excessive icons, clutter, unnecessary decoration, information overload, text touching the canvas edge.

==================================================
VISUAL STYLE
==================================================

Do not use the same layout for every graphic. Allow the subject matter to influence the design.
Depending on the topic, use realistic scenes, polished illustration, clean diagrams, modern infographic elements, strong public-safety poster design, family-friendly illustration, or technology-oriented design as appropriate.

==================================================
COLOR
==================================================

Do NOT force SaferU colors. Choose a palette that supports this specific topic.
${paletteHint}

==================================================
VISUAL ACCURACY
==================================================

Physical relationships must be logical. The visual must accurately support the verified safety information.
Unsafe behavior should only be shown when unmistakably identified as unsafe.

==================================================
PEOPLE
==================================================

Do not associate crime, scams, unsafe behavior, or danger with protected characteristics. Avoid stereotypes.
When humans are unnecessary, prefer objects, phones, vehicles, roads, homes, equipment, packages, diagrams, computers, and environmental scenes.

==================================================
PUBLIC-SAFETY TONE
==================================================

Professional. Clear. Educational. Confident. Not sensational.
No gore, graphic injuries, clickbait, exaggerated destruction, or marketing copy.

==================================================
TEXT
==================================================

Use ONLY the approved factual messaging supplied in this prompt.
Do not add "Source: NFPA", "According to FEMA", or similar attribution.
All displayed text must be correctly spelled, crisp, legible, mobile readable, and professionally aligned.

==================================================
OFFICIAL AGENCY LOGO
==================================================

${logoBlock}

==================================================
FINAL QUALITY TARGET
==================================================

Prioritize in this order:
1. Safety accuracy
2. Immediate comprehension
3. Visual accuracy
4. Readability
5. Professional design
6. Agency branding`
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
