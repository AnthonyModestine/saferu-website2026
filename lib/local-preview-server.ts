import "server-only"
import { headers } from "next/headers"
import { isLocalHostname } from "@/lib/local-preview"

/**
 * Server: true only in Next.js development when the request Host is localhost.
 * Production never synthesizes preview sessions — Host alone is not trusted.
 */
export async function isLocalPreviewServer(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") return false
  try {
    const h = await headers()
    return isLocalHostname(h.get("host"))
  } catch {
    return false
  }
}
