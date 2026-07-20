import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import { isLocalPreviewServer } from "@/lib/local-preview-server"
import { LOCAL_PREVIEW_MEMBER } from "@/lib/local-preview"
import {
  getStoredAgencySettings,
  saveStoredAgencySettings,
} from "@/lib/agency-settings-store"

function memberIdFromSession(): Promise<string | null> {
  return getMemberSession().then((session) => {
    if (session?.memberId) return session.memberId
    return isLocalPreviewServer().then((preview) =>
      preview ? LOCAL_PREVIEW_MEMBER.memberId : null
    )
  })
}

export async function GET() {
  const memberId = await memberIdFromSession()
  if (!memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const settings = await getStoredAgencySettings(memberId)
  return NextResponse.json({ ok: true, settings })
}

export async function PUT(req: Request) {
  const memberId = await memberIdFromSession()
  if (!memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const settings = await saveStoredAgencySettings(memberId, body)
  return NextResponse.json({ ok: true, settings })
}
