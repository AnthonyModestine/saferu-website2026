import { NextResponse } from "next/server"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import {
  listSavedGraphicsForUser,
  unsaveGraphicForUser,
} from "@/lib/graphic-studio-store"

export async function GET(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-saved-list", 60, 120)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  try {
    const items = await listSavedGraphicsForUser(session.email)
    return NextResponse.json({ items })
  } catch (err) {
    console.error("[api/pio/graphic-studio/saved GET]", err)
    return NextResponse.json({ error: "Failed to load saved graphics." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-saved-delete", 40, 80)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  try {
    const body = await request.json().catch(() => ({}))
    const graphicId = String(
      (body as { graphicId?: string }).graphicId ||
        new URL(request.url).searchParams.get("graphicId") ||
        ""
    ).trim()
    if (!graphicId) {
      return NextResponse.json({ error: "graphicId is required." }, { status: 400 })
    }

    const ok = await unsaveGraphicForUser(graphicId, session.email)
    if (!ok) {
      return NextResponse.json({ error: "Graphic not found." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[api/pio/graphic-studio/saved DELETE]", err)
    return NextResponse.json({ error: "Failed to remove saved graphic." }, { status: 500 })
  }
}
