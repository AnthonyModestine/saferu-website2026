/** Incident types for Press Center forms (crimes, fires, accidents — no community announcements). */
export const PIO_INCIDENT_TYPES = [
  "Burglary",
  "Theft",
  "Robbery",
  "Assault",
  "Shooting",
  "Officer-Involved Shooting",
  "Vehicle Break-In",
  "Carjacking",
  "Hit and Run",
  "Package Theft",
  "Drug Seizure",
  "Missing Person",
  "Vandalism",
  "Arson",
  "Fire",
  "Structure Fire",
  "Vehicle Fire",
  "Fire Investigation",
  "Traffic Incident",
  "Vehicle Accident",
  "Domestic Dispute",
  "Suspicious Activity",
  "Other",
] as const

export type PioIncidentType = (typeof PIO_INCIDENT_TYPES)[number]

export function incidentTypeToValue(type: string): string {
  return type.toLowerCase()
}
