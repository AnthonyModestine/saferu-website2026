import "server-only"
import { headers } from "next/headers"
import { isLocalHostname } from "@/lib/local-preview"

/** Server: true when the request Host is localhost (local rebuild / next dev). */
export async function isLocalPreviewServer(): Promise<boolean> {
  try {
    const h = await headers()
    return isLocalHostname(h.get("host"))
  } catch {
    return false
  }
}
