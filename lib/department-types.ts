export const DEPARTMENT_TYPES = [
  { value: "police", label: "Police" },
  { value: "sheriff", label: "Sheriff" },
  { value: "state_police", label: "State Police" },
  { value: "fire", label: "Fire" },
  { value: "ems", label: "EMS" },
  { value: "emergency_management", label: "Emergency Management" },
  { value: "municipality", label: "Municipality / Government" },
  { value: "other", label: "Other" },
] as const

export type DepartmentType = (typeof DEPARTMENT_TYPES)[number]["value"]

const DEPARTMENT_LABELS = Object.fromEntries(
  DEPARTMENT_TYPES.map((d) => [d.value, d.label])
) as Record<DepartmentType, string>

export function isDepartmentType(value: string): value is DepartmentType {
  return value in DEPARTMENT_LABELS
}

export function formatDepartmentLabel(
  type?: string | null,
  other?: string | null
): string {
  if (!type) return "—"
  if (type === "other") {
    const trimmed = other?.trim()
    return trimmed ? trimmed : "Other"
  }
  return DEPARTMENT_LABELS[type as DepartmentType] ?? type
}

/** Map signup department to Press Center agency type when compatible. */
export function departmentToAgencyType(
  type: DepartmentType
): import("@/lib/pio-analytics").AgencyType {
  const map: Partial<Record<DepartmentType, import("@/lib/pio-analytics").AgencyType>> = {
    police: "police",
    sheriff: "police",
    state_police: "police",
    fire: "fire",
    ems: "ems",
    emergency_management: "emergency_management",
    municipality: "municipality",
    other: "other",
  }
  return map[type] ?? "other"
}
