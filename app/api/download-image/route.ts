import { NextRequest, NextResponse } from "next/server"

function safeContentDispositionFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "image.jpg"
  return cleaned
}

/** Only fetch images from this site or known media hosts (SSRF guard). */
function isAllowedImageUrl(urlString: string, siteHost: string): boolean {
  let u: URL
  try {
    u = new URL(urlString)
  } catch {
    return false
  }

  if (u.protocol !== "https:" && u.protocol !== "http:") return false

  const host = u.hostname.toLowerCase()
  const site = siteHost.toLowerCase()

  if (host === site || host === "localhost" || host === "127.0.0.1") return true
  if (host.endsWith(".public.blob.vercel-storage.com")) return true
  if (host.endsWith(".blob.vercel-storage.com")) return true

  return false
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url")
  const filenameParam = request.nextUrl.searchParams.get("filename") ?? "image.jpg"

  if (!urlParam) {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }

  const siteHost = request.nextUrl.hostname
  if (!isAllowedImageUrl(urlParam, siteHost)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 })
  }

  try {
    const upstream = await fetch(urlParam, { cache: "no-store" })
    if (!upstream.ok) {
      return NextResponse.json({ error: "Image not found" }, { status: 502 })
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
    const isImage = contentType.startsWith("image/")
    const isVideo = contentType === "video/mp4" || contentType.startsWith("video/mp4")
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Not an allowed media type" }, { status: 400 })
    }

    const buffer = await upstream.arrayBuffer()
    const filename = safeContentDispositionFilename(filenameParam)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to download image" }, { status: 502 })
  }
}
