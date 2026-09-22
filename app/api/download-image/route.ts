import { NextRequest, NextResponse } from "next/server"

function safeContentDispositionFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || "image.jpg"
  return cleaned
}

/** Block loopback, link-local, and private IPv4/IPv6 ranges (SSRF). */
function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")

  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0") {
    return true
  }

  // IPv4 dotted quad
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (ipv4) {
    const parts = ipv4.slice(1).map(Number)
    if (parts.some((n) => n > 255)) return true
    const [a, b] = parts
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // carrier-grade NAT
    return false
  }

  // IPv6 local / unique-local
  if (host === "::" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) {
    return true
  }

  return false
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
  // Prefer HTTPS in production; allow http only for same-site if needed
  if (u.protocol === "http:" && process.env.NODE_ENV === "production") {
    // still allow if same host over http (unusual); private hosts already blocked
  }

  const host = u.hostname.toLowerCase()
  const site = siteHost.toLowerCase()

  if (isBlockedHostname(host)) return false

  if (host === site) return true
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
    const upstream = await fetch(urlParam, {
      cache: "no-store",
      redirect: "manual",
    })

    // Do not follow redirects to private hosts
    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location")
      if (!location || !isAllowedImageUrl(new URL(location, urlParam).toString(), siteHost)) {
        return NextResponse.json({ error: "URL not allowed" }, { status: 400 })
      }
      return NextResponse.json({ error: "Redirects not allowed" }, { status: 400 })
    }

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
