import type { MemberSessionData } from "@/lib/member-session"
import {
  createGenerationSession,
  resolveMemberPlan,
  type InvestigationStatus,
} from "@/lib/pio-analytics"
import type { DepartmentType } from "@/lib/department-types"

export async function logPressReleaseSessions(params: {
  memberSession: MemberSessionData
  stripePaid: boolean
  trialActive: boolean
  agencyName?: string
  departmentType?: DepartmentType
  departmentOther?: string
  incidentType?: string
  investigationOngoing: boolean
  includeVideoRequest: boolean
}): Promise<{ pressReleaseSessionId: string; videoRequestSessionId?: string }> {
  const memberPlan = await resolveMemberPlan(
    params.memberSession.email,
    params.stripePaid,
    params.trialActive
  )
  const investigationStatus: InvestigationStatus = params.investigationOngoing
    ? "ongoing"
    : "resolved"

  const pressReleaseSessionId = await createGenerationSession({
    agencyId: params.memberSession.memberId,
    userId: params.memberSession.memberId,
    memberEmail: params.memberSession.email,
    agencyName: params.agencyName,
    agencyType: params.departmentType,
    departmentOther: params.departmentOther,
    memberPlan,
    generationType: "new_press_release",
    incidentType: params.incidentType,
    investigationStatus,
  })

  let videoRequestSessionId: string | undefined
  if (params.includeVideoRequest) {
    videoRequestSessionId = await createGenerationSession({
      agencyId: params.memberSession.memberId,
      userId: params.memberSession.memberId,
      memberEmail: params.memberSession.email,
      agencyName: params.agencyName,
      agencyType: params.departmentType,
      departmentOther: params.departmentOther,
      memberPlan,
      generationType: "video_request",
      incidentType: params.incidentType,
      investigationStatus,
    })
  }

  return { pressReleaseSessionId, videoRequestSessionId }
}

export async function logVideoRequestSession(params: {
  memberSession: MemberSessionData
  stripePaid: boolean
  trialActive: boolean
  agencyName?: string
  departmentType?: DepartmentType
  departmentOther?: string
  incidentType?: string
}): Promise<string> {
  const memberPlan = await resolveMemberPlan(
    params.memberSession.email,
    params.stripePaid,
    params.trialActive
  )

  return createGenerationSession({
    agencyId: params.memberSession.memberId,
    userId: params.memberSession.memberId,
    memberEmail: params.memberSession.email,
    agencyName: params.agencyName,
    agencyType: params.departmentType,
    departmentOther: params.departmentOther,
    memberPlan,
    generationType: "video_request",
    incidentType: params.incidentType,
    investigationStatus: "ongoing",
  })
}
