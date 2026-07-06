import { NextRequest, NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { getIsPaidByEmail } from "@/lib/member-access"
import { isOnActiveTrial } from "@/lib/pio-trial"
import { getMemberDepartmentProfile } from "@/lib/member-profile"
import {
  addMemberFeedback,
  getMemberFeedbackEligibility,
} from "@/lib/member-feedback-store"
import {
  MEMBER_FEEDBACK_HELP_OPTIONS,
  type MemberFeedbackHelpValue,
} from "@/lib/member-feedback-constants"

const VALID_HELP_VALUES = new Set(
  MEMBER_FEEDBACK_HELP_OPTIONS.map((o) => o.value)
)

export async function GET() {
  try {
    const session = await getMemberSession()
    if (!session) {
      return NextResponse.json({ shouldShow: false })
    }

    const [stripePaid, trialActive, eligibility] = await Promise.all([
      getIsPaidByEmail(session.email),
      isOnActiveTrial(session.email),
      getMemberFeedbackEligibility({ email: session.email }),
    ])

    if (stripePaid || trialActive) {
      return NextResponse.json({ shouldShow: false })
    }

    return NextResponse.json(eligibility)
  } catch {
    return NextResponse.json({ shouldShow: false })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getMemberSession()
    if (!session) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 })
    }

    const [stripePaid, trialActive, eligibility, profile] = await Promise.all([
      getIsPaidByEmail(session.email),
      isOnActiveTrial(session.email),
      getMemberFeedbackEligibility({ email: session.email }),
      getMemberDepartmentProfile(session.email),
    ])

    if (stripePaid || trialActive) {
      return NextResponse.json({ error: "Not available for paid accounts" }, { status: 403 })
    }

    if (!eligibility.shouldShow) {
      return NextResponse.json({ error: "Feedback not available yet" }, { status: 403 })
    }

    const body = await request.json()
    const helpfulnessRating = Number(body.helpfulnessRating)
    if (!Number.isInteger(helpfulnessRating) || helpfulnessRating < 1 || helpfulnessRating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 })
    }

    const isPositive = helpfulnessRating >= 3
    let helpedWith: MemberFeedbackHelpValue[] | undefined
    let helpedWithOther: string | undefined
    let testimonial: string | undefined
    let improvementFeedback: string | undefined

    if (isPositive) {
      const rawHelped = Array.isArray(body.helpedWith) ? body.helpedWith : []
      helpedWith = rawHelped.filter(
        (v: unknown): v is MemberFeedbackHelpValue =>
          typeof v === "string" && VALID_HELP_VALUES.has(v as MemberFeedbackHelpValue)
      )
      if (helpedWith.length === 0) {
        return NextResponse.json(
          { error: "Select at least one option for what SaferU helped with" },
          { status: 400 }
        )
      }
      if (helpedWith.includes("other")) {
        helpedWithOther = String(body.helpedWithOther ?? "").trim()
        if (!helpedWithOther) {
          return NextResponse.json(
            { error: "Please describe the other way SaferU helped" },
            { status: 400 }
          )
        }
      }
      testimonial = String(body.testimonial ?? "").trim()
      if (!testimonial) {
        return NextResponse.json(
          { error: "Please share what you would tell another department" },
          { status: 400 }
        )
      }
    } else {
      improvementFeedback = String(body.improvementFeedback ?? "").trim()
      if (!improvementFeedback) {
        return NextResponse.json(
          { error: "Please tell us what we could improve" },
          { status: 400 }
        )
      }
    }

    const result = await addMemberFeedback({
      memberId: session.memberId,
      email: session.email,
      memberName: session.name ?? profile?.name,
      agency: profile?.agency,
      departmentType: profile?.departmentType,
      departmentOther: profile?.departmentOther,
      helpfulnessRating,
      helpedWith,
      helpedWithOther,
      testimonial,
      improvementFeedback,
    })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, id: result.id })
  } catch {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}
