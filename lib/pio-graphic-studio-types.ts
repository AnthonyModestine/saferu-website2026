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
  "Bold Public Safety",
  "Realistic",
  "Illustrated",
  "Friendly / Family",
  "Clean Infographic",
  "Modern",
  "Serious / Urgent",
] as const

export type SafetyGraphicStyle = (typeof SAFETY_GRAPHIC_STYLES)[number]

export function isSafetyGraphicStyle(value: string): value is SafetyGraphicStyle {
  return (SAFETY_GRAPHIC_STYLES as readonly string[]).includes(value)
}

export const EVENT_GRAPHIC_TYPES = [
  "Community Event",
  "National Night Out",
  "Coffee With a Cop",
  "Open House",
  "Public Meeting",
  "Recruitment Event",
  "Training / Class",
  "Fundraiser",
  "Holiday Event",
  "Community Outreach",
  "Safety Event",
  "School Event",
  "Other",
] as const

export type EventGraphicType = (typeof EVENT_GRAPHIC_TYPES)[number]

export function isEventGraphicType(value: string): value is EventGraphicType {
  return (EVENT_GRAPHIC_TYPES as readonly string[]).includes(value)
}

export const EVENT_GRAPHIC_STYLES = [
  "Let SaferU Decide",
  "Community / Friendly",
  "Bold Public Safety",
  "Professional",
  "Family",
  "Modern",
  "Seasonal",
  "Recruitment",
  "Clean",
] as const

export type EventGraphicStyle = (typeof EVENT_GRAPHIC_STYLES)[number]

export function isEventGraphicStyle(value: string): value is EventGraphicStyle {
  return (EVENT_GRAPHIC_STYLES as readonly string[]).includes(value)
}

export type GraphicStudioSource = {
  organization: string
  title: string
  url: string
  claim_supported: string
}

export type SafetyResearchBrief = {
  verified_topic: string
  primary_hazard: string
  primary_takeaway: string
  headline_options: string[]
  recommended_headline: string
  supporting_line: string
  resident_message: string
  emergency_message: string
  visual_concept: string
  visual_style_recommendation: string
  visual_must_show: string[]
  visual_must_avoid: string[]
  accuracy_notes: string[]
  user_request_corrected: boolean
  correction_explanation: string
  sources: GraphicStudioSource[]
  caption: string
}
