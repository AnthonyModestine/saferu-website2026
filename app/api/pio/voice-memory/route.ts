import { NextResponse } from "next/server"
import { getMemberSession } from "@/lib/member-session"
import {
  compileAgencyVoiceBrief,
  getAgencyVoiceMemory,
  setVoiceManualNotes,
  voiceMemoryStatus,
} from "@/lib/agency-voice-memory"
import { getStoredAgencySettings } from "@/lib/agency-settings-store"

export async function GET() {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [memory, settings] = await Promise.all([
    getAgencyVoiceMemory(session.memberId),
    getStoredAgencySettings(session.memberId),
  ])
  const brief = compileAgencyVoiceBrief(memory, {
    agencyName: settings?.agencyName,
    boilerplate: settings?.boilerplate,
  })
  const status = voiceMemoryStatus(memory)

  return NextResponse.json({
    manualNotes: memory.manualNotes,
    signalCount: status.signalCount,
    learning: status.learning,
    summary: status.summary,
    brief,
    updatedAt: memory.updatedAt,
  })
}

export async function PUT(request: Request) {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const notes = typeof body.manualNotes === "string" ? body.manualNotes : ""
    const memory = await setVoiceManualNotes(session.memberId, notes)
    const settings = await getStoredAgencySettings(session.memberId)
    const brief = compileAgencyVoiceBrief(memory, {
      agencyName: settings?.agencyName,
      boilerplate: settings?.boilerplate,
    })
    const status = voiceMemoryStatus(memory)
    return NextResponse.json({
      ok: true,
      manualNotes: memory.manualNotes,
      signalCount: status.signalCount,
      learning: status.learning,
      summary: status.summary,
      brief,
      updatedAt: memory.updatedAt,
    })
  } catch {
    return NextResponse.json({ error: "Could not save voice notes" }, { status: 500 })
  }
}
