import { NextResponse } from "next/server"
import { requireGraphicStudioAccess } from "@/lib/graphic-studio/api-auth"
import { storeGraphicStudioImageFromDataUrl } from "@/lib/graphic-studio/store-image"
import { markGraphicSaved } from "@/lib/graphic-studio-store"

export const maxDuration = 60

export async function POST(request: Request) {
  const auth = await requireGraphicStudioAccess(request, "pio-graphic-save", 40, 80)
  if (auth instanceof NextResponse) return auth
  const { session } = auth

  try {
    const body = await request.json()
    const graphicId = String(body.graphicId || "").trim()
    const imageDataUrl = String(body.imageDataUrl || "").trim()
    if (!graphicId || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "A graphic id and image are required to save." },
        { status: 400 }
      )
    }

    const stored = await storeGraphicStudioImageFromDataUrl(graphicId, imageDataUrl)
    const record = await markGraphicSaved({
      graphicId,
      userEmail: session.email,
      imageUrl: stored.url,
      headline: typeof body.headline === "string" ? body.headline : undefined,
      message: typeof body.message === "string" ? body.message : undefined,
      caption: typeof body.caption === "string" ? body.caption : undefined,
      topic: typeof body.topic === "string" ? body.topic : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      style: typeof body.style === "string" ? body.style : undefined,
    })

    if (!record) {
      return NextResponse.json({ error: "Could not save this graphic." }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      graphicId: record.graphic_id,
      imageUrl: record.image_url,
      savedAt: record.saved_at,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[api/pio/graphic-studio/save]", detail)
    return NextResponse.json(
      { error: detail || "Failed to save graphic." },
      { status: 500 }
    )
  }
}
