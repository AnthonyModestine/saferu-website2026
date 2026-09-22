import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import {
  getAgencyPreferenceProfile,
  recordRecommendationPreference,
  type RecommendationPreferenceAction,
} from "@/lib/agency-recommendation-preferences"
import { topicKey } from "@/lib/post-generator/rank-opportunities"

const ACTIONS = new Set<RecommendationPreferenceAction>(["endorse", "decline", "published"])

export async function GET() {
  const session = await getMemberSession()
  if (!session?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const profile = await getAgencyPreferenceProfile(session.memberId)
  return NextResponse.json({ ok: true, profile })
}

export async function POST(req: Request) {
  const session = await getMemberSession()
  if (!session?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const action = String(body.action || "") as RecommendationPreferenceAction
  if (!ACTIONS.has(action)) {
    return NextResponse.json(
      { error: "action must be endorse, decline, or published" },
      { status: 400 }
    )
  }

  const opportunityId = String(body.opportunityId || "").trim()
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId is required" }, { status: 400 })
  }

  const title = String(body.title || "").trim()
  const category = String(body.category || "").trim()
  const sourceLabel = String(body.sourceLabel || "").trim()
  const signals = Array.isArray(body.signals) ? body.signals.map(String) : []
  const derivedTopic =
    typeof body.topicKey === "string" && body.topicKey.trim()
      ? body.topicKey.trim()
      : topicKey({
          title,
          category,
          signals,
          summary: "",
        })

  const record = await recordRecommendationPreference({
    memberId: session.memberId,
    agencyName: typeof body.agencyName === "string" ? body.agencyName : undefined,
    action,
    opportunityId,
    title,
    category,
    topicKey: derivedTopic,
    sourceLabel,
    signals,
  })

  const profile = await getAgencyPreferenceProfile(session.memberId)
  return NextResponse.json({ ok: true, record, profile })
}
