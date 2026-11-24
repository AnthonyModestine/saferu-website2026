import type { SafetyGraphicStyle } from "@/lib/pio-graphic-studio-types"

/**
 * Concise style packs — influence treatment without forcing identical layouts.
 */
export const STYLE_GUIDANCE: Record<SafetyGraphicStyle, string> = {
  "Let SaferU Decide":
    "Intentionally choose the strongest treatment for this topic and audience. Prefer variety across topics — do not default to the same centered photo+title template every time.",
  Realistic:
    "Photoreal documentary style: natural light, believable environments, authentic textures. Avoid glossy CGI look, plastic skin, and exaggerated HDR.",
  Cartoon:
    "Friendly illustrated cartoon style with clear shapes and readable characters. Keep it appropriate for an official agency account — playful, not childish chaos.",
  Illustrated:
    "Editorial illustration: intentional line/shape, cohesive palette, designed rather than photographic. Strong focal point; avoid clip-art collage.",
  "Bold Public Safety":
    "High-contrast informational design: decisive hierarchy, confident color blocking, urgent clarity without fearmongering or gore.",
  "Friendly / Family":
    "Warm, reassuring community tone: soft natural light, inclusive scenes, calm confidence. Especially careful with accurate child-safety depictions.",
  "Clean Infographic":
    "Clean educational layout: clear zones, strong typography hierarchy, minimal decoration, generous negative space, scannable structure.",
  Modern:
    "Contemporary public-sector design: restrained palette, sharp composition, subtle texture, premium but not trendy gimmicks.",
  "Serious / Urgent":
    "Serious operational tone: restrained color, strong contrast, direct messaging. No playful effects; prioritize clarity and credibility.",
}

export function styleGuidanceFor(style: string): string {
  if (style in STYLE_GUIDANCE) {
    return STYLE_GUIDANCE[style as SafetyGraphicStyle]
  }
  return STYLE_GUIDANCE["Let SaferU Decide"]
}

/** Lightweight topic→creative hints (not rigid templates). */
export function topicCreativeHints(topic: string, style: string): string {
  const t = topic.toLowerCase()
  const hints: string[] = []

  if (/carbon monoxide|co\b|detector/.test(t)) {
    hints.push(
      "Consider restrained atmospheric storytelling (home interior, detector, quiet urgency) rather than dramatic fire imagery."
    )
  }
  if (/bike|bicycle|helmet/.test(t)) {
    hints.push("Energetic community outdoor scene can work; keep helmet/gear depictions accurate.")
  }
  if (/scam|fraud|phishing|romance scam/.test(t)) {
    hints.push("Conceptual editorial imagery often works better than literal crime scenes.")
  }
  if (/water|drown|pool|life jacket|lifejacket/.test(t)) {
    hints.push("Prefer clear educational water-safety depiction; never romanticize unsafe water behavior.")
  }
  if (/weather|tornado|hurricane|flood|storm|blizzard/.test(t)) {
    hints.push("Bold high-contrast informational design can outperform soft lifestyle photography.")
  }
  if (/car seat|child passenger|booster|seat belt|seatbelt/.test(t)) {
    hints.push(
      "Warm/reassuring tone OK; accuracy of restraint orientation and age-appropriate equipment is mandatory."
    )
  }
  if (/smoke alarm|smoke detector/.test(t)) {
    hints.push("Show correct detector placement/testing behavior when relevant; avoid unsafe cooking-fire myths.")
  }

  if (style === "Let SaferU Decide" && hints.length === 0) {
    hints.push(
      "Choose a distinctive layout/treatment for this specific topic — avoid repeating a generic centered template."
    )
  }

  return hints.join(" ")
}
