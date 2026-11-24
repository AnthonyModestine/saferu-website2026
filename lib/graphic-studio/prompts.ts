import {
  compileCreativeBriefFromInputs,
  creativeBriefToPromptBlock,
  shouldAttachCreativeBrief,
} from "@/lib/graphic-studio/creative-brief"
import { ART_DIRECTION_PRINCIPLES } from "@/lib/ai-intelligence/art-direction-principles"
import { CONCEPTUAL_STRATEGY_INSTRUCTIONS } from "@/lib/ai-intelligence/conceptual-strategy-instructions"
import {
  creativeStrategyToImageBlock,
  type CreativeStrategy,
} from "@/lib/ai-intelligence/creative-strategy"
import {
  creativeStrategistEnabled,
  optimizedImagePromptEnabled,
} from "@/lib/ai-config/phase3"
import {
  buildLeanResearchPrompt,
  leanResearchPromptEnabled,
} from "@/lib/graphic-studio/lean-research-prompt"
import {
  compileLeanImagePrompt,
  imageExecutionVariant,
  leanImagePromptEnabled,
  sharedCommunicationObjective,
} from "@/lib/graphic-studio/lean-image-prompt"
import { validateCreativeStrategyForImage } from "@/lib/ai-intelligence/creative-strategy-guard"

export function buildResearchPrompt(opts: {
  category: string
  topic: string
  audience: string
  style: string
  visualNotes: string
  includeCreativeStrategist?: boolean
}): string {
  const strategist = opts.includeCreativeStrategist ?? creativeStrategistEnabled()

  if (leanResearchPromptEnabled()) {
    return buildLeanResearchPrompt({
      category: opts.category,
      topic: opts.topic,
      audience: opts.audience,
      style: opts.style,
      visualNotes: opts.visualNotes,
      includeCreativeStrategist: strategist,
    })
  }

  const base = `You are the public-safety content editor for SaferU Graphic Studio.

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

RESEARCH CONFIDENCE
If web research / authoritative sources are unavailable for material safety claims, set research_confidence to "unavailable" (or "partial" if only some claims are verified). research_confidence is a status label — it is NOT proof of verification. Always populate source_records for material claims you treat as supported. Do not invent safety instructions. Prefer a safer conceptual visual when a precise instructional depiction cannot be verified.`

  if (!strategist) {
    return `${base}

Return strict JSON only with fields:
headline, message, message_format, visual_concept, important_visual_details, source_records`
  }

  return `${base}

CREATIVE STRATEGIST (same response — no private chain-of-thought)

You are also the creative strategist for this graphic.

${CONCEPTUAL_STRATEGY_INSTRUCTIONS}

Inside creative_strategy: state what residents must understand; note the visual challenge; propose 2–3 fundamentally different approaches with executionFeasibility; select one with rationale; fill primaryVisualConcept and supporting fields concisely; list imagery that would communicate the wrong message and factual visual musts. Prefer a simple direct concept over clever confusion.

${ART_DIRECTION_PRINCIPLES}

Set visual_concept to the selected primaryVisualConcept.
Set research_confidence appropriately (status label — not proof of verification).

Return strict JSON with fields:
headline, message, message_format, visual_concept, important_visual_details, source_records, creative_strategy, research_confidence`
}

function logoInstruction(hasLogoReference: boolean): string {
  return hasLogoReference
    ? `AGENCY BRANDING
Second attached image = REAL official logo. Place that exact logo bottom-right (~14–18% canvas width). Do not redraw/recolor/invent a badge. No empty logo placeholder box. One logo only.`
    : `Do not invent a fake department badge, seal, patch, crest, or logo.`
}

function messageFormatBlock(messageFormat?: string): string {
  const format = (messageFormat || "paragraph").toLowerCase()
  if (format === "bullets") {
    return `MESSAGE PRESENTATION: clean bullet list (2–3 items). Do not convert to a paragraph.`
  }
  if (format === "callout") {
    return `MESSAGE PRESENTATION: punchy lead + one shorter support line.`
  }
  return `MESSAGE PRESENTATION: 1–2 short sentences. Do not invent bullets.`
}

/** Version A — reasonable generic public-safety graphic prompt (not intentionally weak). */
export function buildGenericImagePrompt(opts: {
  approvedHeadline: string
  approvedMessage: string
  visualConcept: string
  style: string
  hasLogoReference: boolean
}): string {
  return `Create a professional public safety educational social media graphic (2048×1152, 16:9).

Headline (exact text): ${opts.approvedHeadline}
Message (exact text): ${opts.approvedMessage}
Visual idea: ${opts.visualConcept}
Style: ${opts.style}

Requirements:
- Clear, readable text suitable for viewing on a phone
- Accurate, responsible safety messaging — do not show unsafe behavior as recommended
- Polished design appropriate for an official police, fire, or local government account
- Do not add extra tips, statistics, slogans, hashtags, or URLs
${opts.hasLogoReference ? "- Include the attached official agency logo in the bottom-right, unchanged except for scaling" : "- Do not invent a fake department badge or seal"}

Produce one finished high-quality graphic.`
}

/**
 * Version B — Original SaferU image prompt strategy before Phase 2/3 creative enhancements.
 * Long teaching-focused prompt without priority hierarchy block or creative brief assembly.
 */
export function buildOriginalSaferuImagePrompt(opts: {
  approvedHeadline: string
  approvedMessage: string
  messageFormat?: string
  visualConcept: string
  importantVisualDetails: string[]
  visualNotes: string
  style: string
  hasLogoReference: boolean
}): string {
  const details =
    opts.importantVisualDetails.length > 0
      ? opts.importantVisualDetails.map((d) => `- ${d}`).join("\n")
      : "(none)"

  return `PRIMARY GOAL

Create a professional public-safety educational graphic where the visual actively helps teach the approved safety message.

This is an educational community-safety graphic — not an event flyer, advertisement, incident graphic, or generic social-media template.

The final graphic should feel like something a professional police, fire, EMS, emergency management, or local government agency would confidently publish.

CANVAS: exactly 2048×1152 (16:9). High quality.

APPROVED TEXT IS LOCKED

The approved HEADLINE and MESSAGE must appear exactly as provided. Do not rewrite, shorten, paraphrase, or add tips/stats/slogans/URLs/hashtags.

HEADLINE (title):
${opts.approvedHeadline}

MESSAGE (body):
${opts.approvedMessage}

${messageFormatBlock(opts.messageFormat)}

VISUAL IDEA:
${opts.visualConcept}

Visual details:
${details}

User visual notes: ${opts.visualNotes || "(none)"}
Style: ${opts.style}

VISUAL MUST TEACH
The visual should help residents understand the safety lesson. Prefer a clear scene that shows the hazard, safer behavior, or consequence being prevented. Avoid unrelated emergency-vehicle filler.

TEXT READABILITY — CRITICAL
Phone-first: strong contrast; headline larger than body; no clipped text; clean professional typography; keep text off faces and busy detail.

COMPOSITION
You have creative freedom for composition, lighting, and hierarchy. Keep the scene continuous — no empty logo boxes.

VISUAL ACCURACY
Do not depict unsafe behavior as recommended. Avoid gore and fearmongering.

${logoInstruction(opts.hasLogoReference)}

FINAL INTERNAL CHECK
Verify exact approved text, phone readability, teaching relevance, and official credibility before finalizing.`
}

/** Concise prompt: strategist decisions survive; generic padding removed. */
export function buildOptimizedImagePrompt(opts: {
  approvedHeadline: string
  approvedMessage: string
  messageFormat?: string
  visualConcept: string
  importantVisualDetails: string[]
  visualNotes: string
  style: string
  hasLogoReference: boolean
  topic?: string
  audience?: string
  creativeStrategy?: CreativeStrategy | null
}): string {
  const details =
    opts.importantVisualDetails.length > 0
      ? opts.importantVisualDetails.map((d) => `- ${d}`).join("\n")
      : ""

  const strategyBlock = (() => {
    if (opts.creativeStrategy) {
      const block = creativeStrategyToImageBlock(opts.creativeStrategy)
      if (block) return block
      return `VISUAL CONCEPT: ${opts.visualConcept}`
    }
    if (shouldAttachCreativeBrief()) {
      return creativeBriefToPromptBlock(
        compileCreativeBriefFromInputs({
          topic: opts.topic,
          audience: opts.audience,
          style: opts.style,
          approvedHeadline: opts.approvedHeadline,
          approvedMessage: opts.approvedMessage,
          visualConcept: opts.visualConcept,
          importantVisualDetails: opts.importantVisualDetails,
          visualNotes: opts.visualNotes,
        })
      )
    }
    return `VISUAL CONCEPT: ${opts.visualConcept}`
  })()

  return `PUBLIC-SAFETY EDUCATIONAL GRAPHIC — 2048×1152 (16:9)

PRIORITY: (1) safety/factual accuracy (2) exact approved text (3) branding integrity (4) creative strategy (5) design craft

APPROVED COPY (locked — render exactly; no rewrite, paraphrase, extra tips, stats, slogans, URLs, hashtags)
HEADLINE: ${opts.approvedHeadline}
MESSAGE: ${opts.approvedMessage}
${messageFormatBlock(opts.messageFormat)}

${strategyBlock}

STYLE REQUEST: ${opts.style}
${opts.visualNotes ? `USER VISUAL NOTES: ${opts.visualNotes}` : ""}
${details ? `IMPORTANT VISUAL DETAILS:\n${details}` : ""}

TECHNICAL
- Phone-first readability: strong contrast; headline clearly larger than body; no clipped text; keep type off faces/busy detail.
- Continuous scene — no empty reserved boxes.
- Visual must teach the lesson; never depict unsafe behavior as recommended.
- No gore, fearmongering, or stereotypical "criminal" caricatures.

${logoInstruction(opts.hasLogoReference)}

Execute the selected creative concept with professional restraint. Do not collapse into a generic centered stock template unless that concept was deliberately selected.`
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
  topic?: string
  audience?: string
  creativeStrategy?: CreativeStrategy | null
}): string {
  const promptMode = process.env.SAFERU_AI_PROMPT_MODE?.trim().toLowerCase() || ""

  if (promptMode === "generic") {
    return buildGenericImagePrompt({
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      visualConcept: opts.visualConcept,
      style: opts.style,
      hasLogoReference: opts.hasLogoReference,
    })
  }

  if (promptMode === "original") {
    return buildOriginalSaferuImagePrompt(opts)
  }

  // Experimental lean compiler — Phase 4 winning generic structure (opt-in only).
  if (leanImagePromptEnabled()) {
    const variant = imageExecutionVariant()
    const strategy =
      variant === "creative_direction" && opts.creativeStrategy
        ? opts.creativeStrategy
        : null
    const validated = strategy
      ? validateCreativeStrategyForImage(strategy, {
          approvedHeadline: opts.approvedHeadline,
          approvedMessage: opts.approvedMessage,
        })
      : null

    // Shared objective across A/B: derive from strategist (when present) or approved copy.
    // Variant A ignores strategy for VISUAL DIRECTION only; objective stays identical.
    const objective = sharedCommunicationObjective({
      strategyObjective: opts.creativeStrategy?.whatResidentsMustUnderstand,
      headline: opts.approvedHeadline,
      message: opts.approvedMessage,
    })

    return compileLeanImagePrompt({
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      style: opts.style,
      visualNotes: opts.visualNotes,
      visualIdea: opts.visualConcept,
      communicationObjective: objective,
      creativeStrategy: validated?.ok ? strategy : null,
      hasLogoReference: opts.hasLogoReference,
      importantVisualDetails: opts.importantVisualDetails,
    })
  }

  // Experimental concise compiler — opt-in only; does not replace production defaults.
  if (promptMode === "concise") {
    const { compileConciseImagePrompt } = require("@/lib/graphic-studio/concise-image-prompt") as typeof import("@/lib/graphic-studio/concise-image-prompt")
    return compileConciseImagePrompt({
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      style: opts.style,
      hasLogoReference: opts.hasLogoReference,
      visualConcept: opts.visualConcept,
      essentialVisualDetails: opts.importantVisualDetails,
      visualNotes: opts.visualNotes,
      creativeStrategy: opts.creativeStrategy,
      communicationObjective: opts.creativeStrategy?.whatResidentsMustUnderstand,
      textFreeArtwork: process.env.SAFERU_AI_TEXT_FREE_ARTWORK === "1",
    })
  }

  if (
    promptMode === "phase3" ||
    optimizedImagePromptEnabled() ||
    opts.creativeStrategy
  ) {
    return buildOptimizedImagePrompt(opts)
  }

  const details =
    opts.importantVisualDetails.length > 0
      ? opts.importantVisualDetails.map((d) => `- ${d}`).join("\n")
      : "(none)"

  const formatBlock = messageFormatBlock(opts.messageFormat)

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

  const creativeBlock = shouldAttachCreativeBrief()
    ? creativeBriefToPromptBlock(
        compileCreativeBriefFromInputs({
          topic: opts.topic,
          audience: opts.audience,
          style: opts.style,
          approvedHeadline: opts.approvedHeadline,
          approvedMessage: opts.approvedMessage,
          visualConcept: opts.visualConcept,
          importantVisualDetails: opts.importantVisualDetails,
          visualNotes: opts.visualNotes,
        })
      )
    : ""

  const priorityBlock = `PRIORITY HIERARCHY (in order — never violate a higher priority for a lower one)
1. Factual and safety accuracy
2. Exact approved messaging
3. Agency branding integrity
4. Customer-requested creative direction
5. Professional design execution
6. Additional artistic creativity`

  return `PRIMARY GOAL

Create a professional public-safety educational graphic where the visual actively helps teach the approved safety message.

This is an educational community-safety graphic — not an event flyer, advertisement, incident graphic, or generic social-media template.

The final graphic should feel like something a professional police, fire, EMS, emergency management, or local government agency would confidently publish.

CANVAS: exactly 2048×1152 (16:9). High quality.

${priorityBlock}

APPROVED TEXT IS LOCKED

The approved HEADLINE and MESSAGE must appear exactly as provided.

Do not:
- rewrite them
- shorten them
- paraphrase them
- correct them
- add additional wording
- add another safety tip
- add a statistic
- add a slogan
- add a URL
- add hashtags

The content has already been prepared and approved before image generation.

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

${creativeBlock ? `${creativeBlock}\n` : ""}VISUAL MUST TEACH

The visual should help residents understand the safety lesson, not simply decorate the graphic.

Someone glancing at the artwork before reading all of the text should have a reasonable idea what safety topic is being taught.

Prefer a clear real-world scene, illustration, or visual concept that shows:
- the hazard or unsafe behavior,
- the safer behavior,
- the consequence being prevented,
- or the specific situation described in the approved message.

Do not default to generic public-safety imagery unless it directly supports the lesson.

Avoid unrelated visual filler such as random emergency lights, caution tape, emergency vehicles, shields, sirens, generic smiling families, or dramatic effects that do not help explain the safety message.

ONE GRAPHIC = ONE LESSON

Stay focused on the single teaching point contained in the approved headline and message.

Do not add additional safety tips, secondary lessons, warnings, statistics, slogans, or unrelated information.

Do not turn the graphic into a checklist unless the approved message itself requires multiple steps.

TEXT READABILITY — CRITICAL

The graphic will primarily be viewed on a phone.

The approved message must remain easy to read at social-media size.

- Headline should be clearly larger and more prominent than the body message (roughly 1.6×–2.5× the message text size).
- Use strong contrast between text and its background.
- Keep text away from visually busy portions of the scene.
- Use clean, professional typography.
- Avoid decorative, handwritten, highly condensed, distorted, or novelty typography.
- Maintain comfortable spacing around text.
- Do not crowd text against the edges of the image.
- Do not place important body text over faces or important visual details.
- Do not shrink the message excessively just to force it into a particular layout.
- Use intentional visual hierarchy so viewers naturally see the headline first, message second, and teaching visual clearly.
- Do not clip or cut off any wording at the edges.

COMPOSITION

You have creative freedom to choose the strongest:
- composition
- camera angle
- subject positioning
- environment
- lighting
- visual hierarchy
- text placement

Use that freedom to make the graphic feel intentionally designed rather than like a stock photograph with text placed over it.

You may place the headline in any natural TITLE location that fits the design well, for example:
- top band / top-left / top-center / top-right
- overlaid on the upper portion of the visual
- left column title with visual on the right
- title above a lower message panel

Vary the layout from a generic "title on top / photo in middle / paragraph at bottom" template when another arrangement teaches the lesson better — especially when the message is bullets or a callout.

Keep the full scene continuous — no empty reserved boxes for logos or text.

Professional does not mean boring. The graphic should be visually engaging enough to stop someone scrolling while still feeling credible for an official government account.

Avoid repetitive AI design defaults unless they serve this brief: identical centered layouts, excessive glow, unnecessary gradients, oversaturated stock looks, glossy artificial lighting, and cluttered icon rows.

VISUAL ACCURACY

The image must visually support the approved safety guidance.

Do not depict an unsafe behavior as though it is the recommended behavior.

Do not introduce visual details that contradict the approved message.

When demonstrating a hazard, make it immediately understandable without unnecessarily exaggerating danger.

Avoid gore, graphic injury, fearmongering, sensational imagery, or stereotypical "criminal" characters.

PROFESSIONAL PUBLIC-SAFETY STANDARD

Avoid designs that feel:
- cheap
- overly promotional
- childish unless clearly appropriate for the intended audience
- excessively dramatic
- cluttered
- like a generic Canva template
- like an advertisement
- like AI-generated clickbait

Aim for polished public-information design: clear hierarchy, intentional composition, strong imagery, restrained use of effects, and excellent readability.

${logoBlock}

FINAL INTERNAL CHECK

Before producing the image, verify:
1. Does the visual actually help teach the safety lesson?
2. Is the approved headline reproduced exactly?
3. Is the approved message reproduced exactly?
4. Can both be comfortably read on a phone?
5. Did I avoid adding facts or tips that were not approved?
6. Does this look credible enough for an official public-safety agency to publish?
7. Is the visual directly relevant to the specific hazard/action rather than generic decoration?

If any answer is no, improve the design before finalizing.`
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

  return `You are editing an EXISTING 16:9 public-safety educational graphic (first attached image).

SURGICAL EDIT ONLY
Apply ONLY this requested change:
${opts.editRequest}

Keep everything else the same:
- Same overall composition, scene, colors, lighting, and style
- Same approved headline and message text (unless the edit explicitly asks to change text)
- Same canvas size 2048×1152
- Same teaching visual relevance — do not replace a lesson-specific scene with generic public-safety decoration

Approved headline (keep unless edit asks otherwise):
${opts.approvedHeadline}

Approved message (keep unless edit asks otherwise):
${opts.approvedMessage}

Do NOT regenerate a totally new graphic.
Do NOT redesign the whole layout.
Do NOT rewrite, shorten, or paraphrase approved text unless the edit explicitly asks to change text.
Do NOT add new safety tips, stats, slogans, hashtags, URLs, or agency names.
Preserve phone readability: strong contrast, clear hierarchy, no clipped text.

${logoRules}

Return one finished high-quality 16:9 graphic.`
}
