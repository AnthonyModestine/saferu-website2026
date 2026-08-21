export const SAFETY_TIP_CATEGORIES = [
  "Crime Prevention",
  "Scam Awareness",
  "Fire Prevention",
  "Traffic Safety",
  "Weather Preparedness",
  "Home Security",
  "Child Safety",
  "Senior Safety",
  "Community Safety",
] as const

export type SafetyTipCategory = (typeof SAFETY_TIP_CATEGORIES)[number]

export function isSafetyTipCategory(value: string): value is SafetyTipCategory {
  return (SAFETY_TIP_CATEGORIES as readonly string[]).includes(value)
}
