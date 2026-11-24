/**
 * Lightweight, extensible verified safety depiction requirements.
 * Only attach guidance that is source-backed or human-reviewed.
 * Do not invent a large unverified rulebook.
 */

export type SafetyDepictionGuide = {
  topicKey: string
  requiredVisualDetails: string[]
  commonlyMisrepresented: string[]
  mustNotShowAsRecommended: string[]
  authoritativeNotes: string[]
  preferConceptualIfUnreliable?: boolean
}

const GUIDES: SafetyDepictionGuide[] = [
  {
    topicKey: "grease_fire",
    requiredVisualDetails: [
      "Show smothering with a lid or Class B/kitchen extinguisher when depicting response",
    ],
    commonlyMisrepresented: ["Water used on grease/oil fires"],
    mustNotShowAsRecommended: [
      "Pouring water on a grease or oil fire",
      "Carrying a burning pan outdoors as the primary advice",
    ],
    authoritativeNotes: ["Align with NFPA / fire-service kitchen fire guidance"],
  },
  {
    topicKey: "carbon_monoxide",
    requiredVisualDetails: ["Working CO detector when detectors are part of the message"],
    commonlyMisrepresented: ["Treating CO like visible smoke"],
    mustNotShowAsRecommended: ["Ignoring a sounding CO alarm", "Using a gas oven for heat"],
    authoritativeNotes: ["CDC / CPSC CO guidance"],
    preferConceptualIfUnreliable: true,
  },
  {
    topicKey: "child_passenger",
    requiredVisualDetails: [
      "Age/size-appropriate restraint orientation when a car seat is shown",
    ],
    commonlyMisrepresented: ["Forward-facing infants", "Booster without seat belt"],
    mustNotShowAsRecommended: ["Unrestrained child in moving vehicle"],
    authoritativeNotes: ["NHTSA car seat guidance"],
  },
  {
    topicKey: "water_safety",
    requiredVisualDetails: ["Life jacket / supervision cues when those are the teaching point"],
    commonlyMisrepresented: ["Inflatable toys as flotation devices"],
    mustNotShowAsRecommended: ["Unsupervised young children near open water"],
    authoritativeNotes: ["CDC / Red Cross water safety themes"],
  },
]

export function matchSafetyDepictionGuides(topic: string): SafetyDepictionGuide[] {
  const t = topic.toLowerCase()
  return GUIDES.filter((g) => {
    if (g.topicKey === "grease_fire" && /grease|oil fire|kitchen fire/.test(t)) return true
    if (g.topicKey === "carbon_monoxide" && /carbon monoxide|\bco\b|detector/.test(t)) return true
    if (g.topicKey === "child_passenger" && /car seat|child passenger|booster/.test(t)) return true
    if (g.topicKey === "water_safety" && /water|drown|pool|life jacket|lifejacket/.test(t))
      return true
    return false
  })
}

export function safetyDepictionPromptLines(topic: string): string[] {
  const guides = matchSafetyDepictionGuides(topic)
  const lines: string[] = []
  for (const g of guides) {
    for (const d of g.requiredVisualDetails) lines.push(`Required: ${d}`)
    for (const m of g.mustNotShowAsRecommended) lines.push(`Must not show as recommended: ${m}`)
    if (g.preferConceptualIfUnreliable) {
      lines.push(
        "If a precise instructional depiction cannot be rendered reliably, prefer a safer conceptual visual."
      )
    }
  }
  return lines
}
