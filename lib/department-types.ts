export const DEPARTMENT_TYPES = [
  { value: "police", label: "Police Department" },
  { value: "sheriff", label: "Sheriff's Office" },
  { value: "state_police", label: "State Police" },
  { value: "fire", label: "Fire Department" },
  { value: "ems", label: "EMS" },
  { value: "emergency_management", label: "Emergency Management" },
  { value: "local_government", label: "City / County Government" },
] as const

export type SupportedDepartmentType = (typeof DEPARTMENT_TYPES)[number]["value"]

/**
 * Legacy values remain readable so existing stored profiles do not break.
 * They are not offered as current SaferU agency types.
 */
export type DepartmentType =
  | SupportedDepartmentType
  | "public_works"
  | "parks_recreation"
  | "utilities"
  | "animal_services"
  | "health_department"
  | "municipality"
  | "other"

const DEPARTMENT_LABELS: Record<DepartmentType, string> = {
  ...Object.fromEntries(DEPARTMENT_TYPES.map((d) => [d.value, d.label])),
  public_works: "Public Works",
  parks_recreation: "Parks & Recreation",
  utilities: "Utilities",
  animal_services: "Animal Services",
  health_department: "Health Department",
  municipality: "Municipality / Government",
  other: "Other",
} as Record<DepartmentType, string>

export function isDepartmentType(value: string): value is SupportedDepartmentType {
  return DEPARTMENT_TYPES.some((department) => department.value === value)
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
    local_government: "local_government",
    // Historical municipal-department profiles now use the government frame.
    public_works: "local_government",
    parks_recreation: "local_government",
    utilities: "local_government",
    animal_services: "local_government",
    health_department: "local_government",
    municipality: "municipality",
    other: "other",
  }
  return map[type] ?? "other"
}
