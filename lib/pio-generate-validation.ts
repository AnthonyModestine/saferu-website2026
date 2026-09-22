/** Client/server validation before Press Center AI generation. */

export function validatePressReleaseInput(body: {
  incidentType?: string
  incidentSummary?: string
  otherIncidentType?: string
}): string | null {
  const type = String(body.incidentType ?? "").trim()
  const summary = String(body.incidentSummary ?? "").trim()
  const other = String(body.otherIncidentType ?? "").trim()

  if (!type || type === "incident") {
    return "Select an incident type before generating."
  }
  if (type === "other" && other.length < 3) {
    return "Describe the incident type when selecting Other."
  }
  if (summary.length < 25) {
    return "Add an incident summary with the facts of what happened before generating. Press Center is designed to use only information you provide — always review drafts before publishing."
  }
  return null
}

export function validateVideoRequestInput(body: {
  incidentType?: string
  otherIncidentType?: string
  description?: string
  whatToLookFor?: string
  footageTimeframe?: string
  address?: string
}): string | null {
  const type = String(body.incidentType ?? "").trim()
  const other = String(body.otherIncidentType ?? "").trim()
  const description = String(body.description ?? "").trim()
  const what = String(body.whatToLookFor ?? "").trim()
  const timeframe = String(body.footageTimeframe ?? "").trim()
  const address = String(body.address ?? "").trim()

  if (!type || type === "incident") {
    return "Select an incident type before generating."
  }
  if (type === "other" && other.length < 3) {
    return "Describe the incident type when selecting Other."
  }
  if (description.length >= 25) return null
  if (what.length >= 10 && timeframe.length >= 5) return null
  if (description.length >= 10 && (address.length >= 5 || timeframe.length >= 5)) return null

  return "Add incident details and what footage you need before generating. Press Center is designed to use only information you provide — always review drafts before publishing."
}
