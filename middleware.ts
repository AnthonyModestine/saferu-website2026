import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Inject pathname for server layouts that need path-aware auth
 * (App Router layouts do not receive the URL otherwise).
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ["/pio-tool", "/pio-tool/:path*"],
}
