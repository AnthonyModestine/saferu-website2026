export function buildResearchPrompt(opts: {
  category: string
  topic: string
  audience: string
  style: string
  visualNotes: string
}): string {
  return `You are the public-safety content editor for SaferU Graphic Studio.

SaferU helps police departments, sheriff's offices, fire departments, EMS agencies, emergency management agencies and local governments create educational community safety graphics.

INPUT

Category:
${opts.category}

Topic:
${opts.topic}

Audience:
${opts.audience}

Style:
${opts.style}

Optional Visual Notes:
${opts.visualNotes || "(none)"}

TASK

Research the requested public-safety topic using current authoritative third-party sources before drafting the graphic.

Do not rely only on model memory.

Choose sources appropriate to the topic.

Examples:

FIRE / COOKING / BATTERIES
- NFPA
- U.S. Fire Administration
- FEMA
- CPSC

CRIME PREVENTION
- National Crime Prevention Council
- FBI
- DOJ

SCAMS / FRAUD
- FTC
- FBI
- USPS Inspection Service
- IRS or SSA when relevant

CYBERSECURITY
- CISA
- FBI
- FTC
- NIST

TRAFFIC
- NHTSA
- FMCSA
- FHWA

WEATHER
- NOAA
- National Weather Service
- FEMA

EMERGENCY PREPAREDNESS
- FEMA
- Ready.gov

CHILD / FAMILY SAFETY
- appropriate federal safety resources
- CPSC
- NHTSA
- StopBullying.gov when bullying-related
- other authoritative child-safety resources when appropriate

Do not use random blogs as the primary authority when an authoritative source exists.

Do not print source names or citations on the public-facing graphic.

Sources are internal fact-checking material only.

If the user's requested safety statement is inaccurate or misleading, correct it before drafting the graphic.

Do not blindly turn an incorrect statement into an official-looking public-safety graphic.

CONTENT GOAL

Determine the ONE most useful thing residents should remember.

Do not try to teach an entire article on one graphic.

The graphic should be understandable within approximately 2–3 seconds while scrolling social media.

Determine:

1. What is the hazard/problem?
2. What should the resident notice or do?
3. Why does it matter?
4. What is the strongest single takeaway?

COPY RULES

Headline:
3–8 words preferred.

Message:
approximately 15–35 words preferred.

Only go longer when necessary.

Use plain English.

Use strong, clear language.

Make the copy sound appropriate for an official police, fire, EMS or government social-media account.

Avoid:
- long paragraphs
- generic filler
- fearmongering
- jargon
- excessive exclamation points
- hashtags
- source attribution
- unnecessary statistics

Do not automatically use generic endings such as:
- Stay safe
- Safety starts with you
- Knowledge is power
- Simple steps can make a difference
- Your safety matters

Do not create list-style graphics unless the user's topic genuinely calls for one.

VISUAL CONCEPT

Recommend one strong visual that helps TEACH the message.

Do not merely recommend generic stock imagery.

The visual should reinforce the message.

Return strict JSON only with fields:
headline, message, visual_concept, important_visual_details, source_records`
}

export function buildImagePrompt(opts: {
  approvedHeadline: string
  approvedMessage: string
  visualConcept: string
  importantVisualDetails: string[]
  visualNotes: string
  style: string
  hasLogoReference: boolean
  logoWidth?: number
  logoHeight?: number
}): string {
  const details =
    opts.importantVisualDetails.length > 0
      ? opts.importantVisualDetails.map((d) => `- ${d}`).join("\n")
      : "(none)"

  const logoBlock = opts.hasLogoReference
    ? `The official agency logo is supplied as a reference image.

Use the supplied logo only as a reference for its approximate size (${opts.logoWidth ?? "unknown"}×${opts.logoHeight ?? "unknown"} px proportions) and proportions.

DO NOT DRAW OR RECREATE THE LOGO.

DO NOT INCLUDE A GENERATED VERSION OF THE LOGO.

DO NOT CREATE A SECOND LOGO.

DO NOT CREATE fake police badges, fake sheriff stars, fake fire patches, fake seals, fake crests, or invented agency branding.

Reserve a clean BOTTOM-RIGHT area for the original agency logo to be added after generation.

The logo safe zone should accommodate a logo approximately 10–12% of the total canvas width.

Nothing important may appear inside this zone.`
    : `Do not invent a fake department badge, seal, patch, crest, or logo.`

  return `Create a professional 16:9 public-safety social-media graphic.

This graphic will be published by an official local police department, sheriff's office, fire department, EMS agency, emergency management agency or local government.

CANVAS

Exactly 16:9 landscape.
2048 × 1152.
High quality.

APPROVED TEXT

Render the following wording exactly as approved.

Do not rewrite it.
Do not paraphrase it.
Do not add additional sentences.
Do not add additional safety tips.
Do not add source citations.

HEADLINE:
${opts.approvedHeadline}

ON-GRAPHIC MESSAGE:
${opts.approvedMessage}

VISUAL

Visual concept:
${opts.visualConcept}

Important visual details:
${details}

User visual notes:
${opts.visualNotes || "(none)"}

Requested style:
${opts.style}

Create one strong visual that directly communicates the safety lesson.

The image should help teach the message rather than simply decorate the background.

DESIGN QUALITY

Modern, professional, clean, visually strong, easy to understand, mobile readable.

Do NOT make it look like a PowerPoint slide, generic Canva template, brochure, wall of text, or random AI artwork with text placed on top.

Use strong visual hierarchy: headline, main visual, short safety message, agency branding area.

TEXT LAYOUT

Protect all wording from clipping. Maintain a generous safe margin. No important text within the outer 6% of the canvas.

All copy must remain clearly readable on a phone.

LOGO SAFE ZONE

${logoBlock}

PEOPLE / PUBLIC SAFETY

Appropriate for official government use. No stereotypical criminal characters. Avoid gore.

NO EXTRA CONTENT

Do not invent statistics, laws, penalties, hashtags, agency names, or URLs. Use only the approved safety content.`
}
