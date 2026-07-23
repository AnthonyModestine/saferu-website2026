import type {
  IncidentCategory,
  PostMessageClassification,
  PostMessageInput,
  PostMessageStatus,
  PostMessageUrgency,
} from "./types"
import { WEATHER_SCRIPT_FAMILIES } from "./scripts"

function haystack(input: PostMessageInput): string {
  const facts = input.verifiedFacts.map((f) => f.text).join(" ")
  const cta = (input.publicCallToAction ?? []).join(" ")
  return `${input.title} ${input.category || ""} ${input.sourceLabel || ""} ${facts} ${cta}`.toLowerCase()
}

function detectIncidentCategory(text: string): IncidentCategory {
  if (/severe thunderstorm/.test(text)) return "severe_thunderstorm"
  if (/tornado/.test(text)) return "tornado"
  if (/flash flood|flood warning|flood watch|flood advisory|flooding/.test(text)) return "flood"
  if (/winter storm|blizzard|ice storm|freezing rain|winter weather/.test(text)) return "winter_storm"
  if (/hurricane|tropical storm/.test(text)) return "hurricane"
  if (/heat advisory|excessive heat|heat warning/.test(text)) return "heat"
  if (/wind advisory|high wind/.test(text)) return "wind"
  if (/boil water|boil-water|drinking water advisory/.test(text)) return "boil_water"
  if (/road closure|road closed|lane closure|detour|traffic alert/.test(text)) return "road_closure"
  if (/shelter.in.place|shelter in place/.test(text)) return "shelter_in_place"
  if (/evacuat/.test(text)) return "evacuation"
  if (/missing person|endangered|at-risk|has been located|located safely/.test(text)) {
    return "missing_person"
  }
  if (/structure fire|working fire|house fire|brush fire|wildfire/.test(text)) return "fire"
  if (/power outage|utility outage|without power|power restored/.test(text)) return "power_outage"
  if (/police activity|barricaded|standoff|active incident/.test(text)) return "police_activity"
  if (/scam|fraud|prevention|reminder|lock your/.test(text)) return "general_safety"
  return "informational"
}

function detectStatus(title: string, text: string, category: IncidentCategory): PostMessageStatus {
  const titleLower = title.toLowerCase()

  if (/located safely|has been found|missing person located/.test(text)) {
    return category === "missing_person" ? "resolved" : "lifted"
  }
  if (/power (?:has been )?restored|power is back/.test(text)) {
    return category === "power_outage" ? "resolved" : "lifted"
  }
  if (/reopened|road is open|lanes? reopened/.test(text) && category === "road_closure") {
    return "resolved"
  }

  if (/expired|lifted|all clear|has ended|warning expired|watch expired|resolved/.test(text)) {
    return category === "road_closure" ? "resolved" : "lifted"
  }
  if (/update:|remains in effect|still in effect|continues to/.test(text)) {
    return /extended/.test(text) ? "extended" : "update"
  }
  if (/\bwatch\b|outlook/.test(titleLower)) return "watch"
  if (/\bwarning\b/.test(titleLower) && category !== "boil_water") return "warning"
  if (/\badvisory\b/.test(titleLower)) return "advisory"
  if (/\bwarning\b/.test(text) && category !== "boil_water" && !/\bwatch\b/.test(titleLower)) {
    return "warning"
  }
  if (/\bwatch\b|outlook/.test(text)) return "watch"
  if (/\badvisory\b/.test(text)) return "advisory"
  return "active"
}

function detectUrgency(status: PostMessageStatus, category: IncidentCategory): PostMessageUrgency {
  if (status === "warning" && /tornado|flood|evacuation|fire/.test(category)) return "critical"
  if (status === "warning") return "urgent"
  if (status === "watch" || status === "advisory") return "advisory"
  if (category === "missing_person" || category === "evacuation") return "urgent"
  return "routine"
}

function agencyTookLocalAction(input: PostMessageInput): boolean {
  const action = `${input.verifiedAgencyAction || ""} ${input.verifiedFacts.map((f) => f.text).join(" ")}`.toLowerCase()
  return /siren|emergency operations|eoc|activated|opened shelter|issued an evacuation|closed.*road|responding to/.test(
    action
  )
}

function selectWeatherScript(
  category: IncidentCategory,
  status: PostMessageStatus,
  agencyAction: boolean,
  useShortWatch: boolean
): string {
  const family = WEATHER_SCRIPT_FAMILIES[category]
  if (!family) {
    if (status === "lifted" || status === "resolved") return "warning_expired"
    if (status === "update" || status === "extended") return "severe_weather_update"
    if (status === "watch") return "weather_watch_generic"
    if (status === "warning") return "weather_warning_generic"
    return "weather_advisory_generic"
  }

  if (status === "lifted" || status === "resolved") return "warning_expired"
  if (status === "update" || status === "extended") return "severe_weather_update"
  if (status === "watch") return useShortWatch ? family.watchShort : family.watchFull
  if (status === "warning") return agencyAction ? family.warningAgency : family.warning
  if (status === "advisory" && family.advisory) return family.advisory
  return family.advisory || "weather_advisory_generic"
}

function selectScriptId(
  category: IncidentCategory,
  status: PostMessageStatus,
  agencyAction: boolean,
  useShortWatch: boolean
): string {
  if (category in WEATHER_SCRIPT_FAMILIES || category === "severe_thunderstorm") {
    return selectWeatherScript(category, status, agencyAction, useShortWatch)
  }

  if (category === "boil_water") return "boil_water_advisory"

  if (category === "road_closure") {
    if (status === "resolved" || status === "lifted") return "road_closure_resolved"
    return "road_closure"
  }

  if (category === "missing_person") {
    if (status === "resolved" || status === "lifted") return "missing_person_located"
    if (status === "update" || status === "extended") return "missing_person_update"
    return "missing_person"
  }

  if (category === "power_outage") {
    if (status === "resolved" || status === "lifted") return "power_outage_restored"
    if (status === "update" || status === "extended") return "power_outage_update"
    return "power_outage_active"
  }

  if (category === "fire") {
    if (status === "update" || status === "extended") return "fire_update"
    return "fire_warning"
  }

  if (category === "shelter_in_place") return "shelter_in_place"
  if (category === "evacuation") return "evacuation_order"
  if (category === "police_activity") return "police_activity"

  return "general_informational"
}

export function classifyPostMessage(
  input: PostMessageInput,
  opts?: { useShortWatch?: boolean }
): PostMessageClassification {
  const text = haystack(input)
  const incidentCategory = detectIncidentCategory(text)
  const status = detectStatus(input.title, text, incidentCategory)
  const agencyLocal = agencyTookLocalAction(input)
  const useShortWatch = opts?.useShortWatch ?? false

  return {
    alertType: input.title.trim(),
    incidentCategory,
    status,
    urgency: detectUrgency(status, incidentCategory),
    scriptId: selectScriptId(incidentCategory, status, agencyLocal, useShortWatch),
    agencyTookLocalAction: agencyLocal,
  }
}
