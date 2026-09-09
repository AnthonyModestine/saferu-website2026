/** Curated PIO adjust options for safety-graphic social captions. */
export const CAPTION_ADJUST_MODES = [
  "shorter",
  "longer",
  "more_urgent",
  "calmer",
  "more_formal",
  "stronger_cta",
] as const

export type CaptionAdjustMode = (typeof CAPTION_ADJUST_MODES)[number]

export const CAPTION_ADJUST_LABELS: Record<CaptionAdjustMode, string> = {
  shorter: "Shorter",
  longer: "Longer",
  more_urgent: "More urgent",
  calmer: "Calmer",
  more_formal: "More formal",
  stronger_cta: "Stronger call to action",
}

export function isCaptionAdjustMode(value: string): value is CaptionAdjustMode {
  return (CAPTION_ADJUST_MODES as readonly string[]).includes(value)
}
