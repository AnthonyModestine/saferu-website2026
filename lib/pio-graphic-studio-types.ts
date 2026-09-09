/** Graphic Studio types — safety graphics only (events removed during rebuild). */

export const SAFETY_TIP_CATEGORIES = [
  "Fire & Cooking Safety",
  "Crime Prevention",
  "Scams & Fraud",
  "Cybersecurity",
  "Traffic & Roadway Safety",
  "Emergency Preparedness",
  "Severe Weather",
  "Child & Family Safety",
  "Home Safety",
  "Lithium-Ion Battery Safety",
  "Seasonal Safety",
  "Health & Community Safety",
  "Other / Custom",
] as const

export type SafetyTipCategory = (typeof SAFETY_TIP_CATEGORIES)[number]

export function isSafetyTipCategory(value: string): value is SafetyTipCategory {
  return (SAFETY_TIP_CATEGORIES as readonly string[]).includes(value)
}

export const SAFETY_AUDIENCES = [
  "General Community",
  "Parents",
  "Drivers",
  "Older Adults",
  "Teens",
  "Children / Families",
  "Business Owners",
  "Homeowners",
  "Renters",
  "Students",
  "Other",
] as const

export type SafetyAudience = (typeof SAFETY_AUDIENCES)[number]

export function isSafetyAudience(value: string): value is SafetyAudience {
  return (SAFETY_AUDIENCES as readonly string[]).includes(value)
}

export const SAFETY_GRAPHIC_STYLES = [
  "Let SaferU Decide",
  "Realistic",
  "Cartoon",
  "Illustrated",
  "Bold Public Safety",
  "Friendly / Family",
  "Clean Infographic",
  "Modern",
  "Serious / Urgent",
] as const

export type SafetyGraphicStyle = (typeof SAFETY_GRAPHIC_STYLES)[number]

export function isSafetyGraphicStyle(value: string): value is SafetyGraphicStyle {
  return (SAFETY_GRAPHIC_STYLES as readonly string[]).includes(value)
}

export type GraphicStudioSource = {
  organization: string
  url: string
  claim_supported: string
}

/** Approved copy shown on the safety graphic. */
export type SafetyGraphicMessage = {
  headline: string
  supportingLine: string
  body: string
  emergencyMessage: string
  caption: string
  visualNotes: string
}
