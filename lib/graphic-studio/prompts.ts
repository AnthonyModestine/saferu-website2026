export function buildResearchPrompt(opts: {
  category: string
  topic: string
  audience: string
  style: string
  visualNotes: string
}): string {
  return `You are the public-safety content editor for SaferU Graphic Studio.

SaferU helps police departments, sheriff's offices, fire departments, EMS agencies, emergency management agencies and local governments create educational community safety graphics for residents on social media.

The user typed a short topic note — not finished graphic copy. Example:
"E-scooter charging — keep hallways and exits clear because of battery fire risk"
Your job is to turn THAT note into clear, official-ready copy for a social graphic — short enough to read fast, specific enough that residents know exactly how to stay safe.

Infer the safety topic and audience from the user's request. Default audience is the general community unless they clearly specify otherwise (parents, drivers, renters, etc.).

INPUT

User request (plain language — what they want residents to know):
${opts.topic}

Optional Visual Notes:
${opts.visualNotes || "(none)"}

Graphic style (follow this for the visual look):
${opts.style}

Optional category/audience hints (may be defaults — prefer the user request):
Category hint: ${opts.category}
Audience hint: ${opts.audience}

TASK

Research the topic using current authoritative third-party sources when possible (NFPA, FEMA, FTC, CISA, NHTSA, Ready.gov, CPSC, etc.).

Do not invent laws, penalties, statistics, or agency claims.
If the user's requested safety statement is inaccurate or misleading, correct it before drafting.
Do not print source names or citations on the public-facing graphic.

MESSAGE QUALITY — THIS IS THE MOST IMPORTANT RULE

The on-graphic message must be SHORT but COMPLETE — never vague, never a wall of text.

A resident scrolling past must instantly understand ALL THREE:
1. WHAT the hazard / situation is
2. WHY it matters (real consequence in plain English — always include this)
3. WHAT TO DO to stay safe (specific action)

Never omit the why. "Don't use water on a grease fire" alone is incomplete — say why (it can spread the fire / cause flare-up).

Bad (too vague — never do this):
- "Be careful when charging devices."
- "Keep exits clear for safety."
- "Watch for scams in your community."
- "Stay prepared this season."

Bad (missing why — never do this):
- "Never put out a grease fire with water."
- "Don't charge scooters by the exit."

Bad (too long — never do this):
- Multi-paragraph explanations, lists of every tip, or repeating the same point three ways.

Good (what + why + what to do):
- "Never put water on a grease fire — it can splash burning oil and spread the flames. Turn off the heat and smother with a lid or use a Class B extinguisher."
- "Don't charge e-scooters in hallways or in front of exits — a battery fire can block your only way out. Charge in a clear, open area away from doorways."

CONTENT STRUCTURE

Headline:
3–8 words. Concrete. Names the hazard or action — not a slogan.

Message format — DEFAULT TO PARAGRAPH. Do not default to bullets.
- "paragraph" — preferred for most topics (1–2 short sentences covering what, why, and what to do)
- "callout" — punchy lead + short why/action support line when that reads cleaner
- "bullets" — ONLY when residents truly need 2–3 distinct steps; still weave why into one of the lines. Most graphics should NOT use bullets.

Message:
Keep total length short (~25–45 words; hard cap ~55).
Every message must include a clear why (consequence) plus the safe action.

If message_format is "bullets", write 2–3 lines each starting with "• ". At least one bullet must state why it matters — not only a list of actions.
Example bullets (use sparingly):
• Never throw water on a grease fire — it can spread burning oil
• Turn off the heat and cover with a metal lid
• Use a Class B / kitchen extinguisher if needed

If "callout", use two lines separated by a newline:
Lead line with the do/don't
Short why + next step

If "paragraph", use normal sentences (no bullets) that include what, why, and what to do.

Stay focused on ONE teaching point tied to the user's request.
Do not leave the reader guessing what to do or why — and do not write a mini-article.

COPY RULES

Use plain English appropriate for an official police, fire, EMS, or government social account.
Strong and clear — not soft, not fearmongering.

Avoid:
- generic filler ("stay safe", "safety starts with you", "your safety matters")
- jargon
- hashtags
- source attribution on the graphic
- excessive exclamation points
- more than 3 bullets

VISUAL CONCEPT

Recommend one strong visual that TEACHES the message (shows the hazard and/or the correct action).
Not generic stock decoration.

Return strict JSON only with fields:
headline, message, message_format, visual_concept, important_visual_details, source_records`
}

export function buildImagePrompt(opts: {
  approvedHeadline: string
  approvedMessage: string
  messageFormat?: string
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

  const format = (opts.messageFormat || "paragraph").toLowerCase()
  const formatBlock =
    format === "bullets"
      ? `MESSAGE PRESENTATION: BULLETS
Render the message as a clean bullet list (2–3 items). Keep each bullet short and scannable.
Do not convert bullets back into a paragraph.`
      : format === "callout"
        ? `MESSAGE PRESENTATION: CALLOUT
Render as a punchy lead line with one shorter support line beneath it (not a dense paragraph, not a long bullet list).`
        : `MESSAGE PRESENTATION: PARAGRAPH
Render as 1–2 short sentences of body copy. Do not invent bullets that were not in the approved message.`

  const logoBlock = opts.hasLogoReference
    ? `AGENCY LOGO (attached image — REQUIRED)

The second attached image is the REAL official agency logo.

Place THAT exact logo on the finished graphic in the BOTTOM-RIGHT.

CRITICAL LOGO RULES:
- Use the attached logo AS-IS. Do not redraw, restyle, recolor, rewrite text, simplify, or invent a new badge/seal/patch/crest.
- Do NOT leave an empty box, cutout, white rectangle, or "logo placeholder" area.
- Do NOT crop or cut off the main scene to reserve empty space for a logo.
- ONLY change allowed: scale the logo LARGER so it reads clearly on a 16:9 safety graphic (about 14–18% of canvas width). Keep original proportions and transparency.
- One logo only. No duplicate logos.
- Integrate it into the design so the full graphic stays continuous — text and scene should flow around it, not stop short for a blank zone.`
    : `Do not invent a fake department badge, seal, patch, crest, or logo.`

  return `Create one professional 16:9 public-safety social media graphic — the same way ChatGPT Image would: one clear scene, readable text, official quality, with branding included in the image itself.

CANVAS: exactly 2048×1152 (16:9). High quality.

Render this wording EXACTLY — do not rewrite, shorten, paraphrase, or add extra tips:

HEADLINE (title):
${opts.approvedHeadline}

MESSAGE (body):
${opts.approvedMessage}

${formatBlock}

VISUAL IDEA:
${opts.visualConcept}

Visual details:
${details}

User visual notes: ${opts.visualNotes || "(none)"}
Style: ${opts.style}

Make the picture teach the safety lesson (show the hazard and/or the correct action). Not a PowerPoint slide, Canva template, brochure, or random art with text slapped on.

TITLE & TEXT LAYOUT — YOU CHOOSE THE COMPOSITION

You may place the headline in any natural TITLE location that fits the design well, for example:
- top band / top-left / top-center / top-right
- overlaid on the upper portion of the visual
- left column title with visual on the right
- title above a lower message panel

Rules:
- The headline must clearly read as the TITLE (not buried in the body).
- The message must clearly read as supporting body copy under or near the title — not the same visual weight as the title.
- TYPE SIZE PROPORTIONS: headline substantially larger and heavier than the message (roughly 1.6×–2.5× the message text size). Message stays secondary and fully readable on a phone.
- Do not make headline and message the same size.
- Do not clip or cut off any wording at the edges. Keep generous margins.
- Vary the layout from a generic "title on top / photo in middle / paragraph at bottom" template when another arrangement teaches the lesson better — especially when the message is bullets or a callout.
- Keep the full scene continuous — no empty reserved boxes.

${logoBlock}

Appropriate for official government posting. No gore, no stereotypical "criminal" characters, no invented stats/laws/hashtags/agency names/URLs.`
}

export function buildReviseImagePrompt(opts: {
  editRequest: string
  approvedHeadline: string
  approvedMessage: string
  hasLogo: boolean
}): string {
  const logoRules = opts.hasLogo
    ? `AGENCY LOGO — DO NOT TOUCH
The current graphic already includes the real agency logo (also attached as a reference image).
- Do NOT move, redraw, recolor, restyle, crop, replace, duplicate, or remove the agency logo.
- Do NOT invent a new badge, seal, patch, or crest.
- Leave the existing logo exactly as it appears.`
    : `Do not invent a fake department badge, seal, patch, crest, or logo.`

  return `You are editing an EXISTING 16:9 public-safety graphic (first attached image).

SURGICAL EDIT ONLY
Apply ONLY this requested change:
${opts.editRequest}

Keep everything else the same:
- Same overall composition, scene, colors, lighting, and style
- Same approved headline and message text (unless the edit explicitly asks to change text)
- Same canvas size 2048×1152

Approved headline (keep unless edit asks otherwise):
${opts.approvedHeadline}

Approved message (keep unless edit asks otherwise):
${opts.approvedMessage}

Do NOT regenerate a totally new graphic.
Do NOT redesign the whole layout.
Do NOT add new safety tips, stats, hashtags, or agency names.

${logoRules}

Return one finished high-quality 16:9 graphic.`
}
