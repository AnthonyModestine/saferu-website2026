import { getFreeMemberByEmail } from "@/lib/members-store"
import { isDepartmentType, type DepartmentType } from "@/lib/department-types"

export interface MemberDepartmentProfile {
  agency?: string
  departmentType?: DepartmentType
  departmentOther?: string
}

export async function getMemberDepartmentProfile(
  email: string
): Promise<MemberDepartmentProfile | null> {
  const member = await getFreeMemberByEmail(email)
  if (!member) return null
  return {
    agency: member.agency,
    departmentType: member.departmentType,
    departmentOther: member.departmentOther,
  }
}

/** Prefer explicit body values; fall back to stored member profile from signup. */
export async function resolveMemberDepartment(
  email: string,
  body: { departmentType?: string; departmentOther?: string }
): Promise<{ departmentType?: DepartmentType; departmentOther?: string }> {
  const profile = await getMemberDepartmentProfile(email)
  const bodyType =
    body.departmentType && isDepartmentType(body.departmentType)
      ? body.departmentType
      : undefined
  const bodyOther = body.departmentOther?.trim() || undefined

  const departmentType = bodyType ?? profile?.departmentType
  const departmentOther =
    departmentType === "other"
      ? bodyOther ?? profile?.departmentOther
      : undefined

  return { departmentType, departmentOther }
}
