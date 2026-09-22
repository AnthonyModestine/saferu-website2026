import "server-only"

/**
 * Canonical public site origin for Stripe redirects, email links, and portal return URLs.
 *
 * - Development: falls back to http://localhost:3000 when NEXT_PUBLIC_APP_URL is unset.
 * - Production: requires a valid absolute https URL; never falls back to localhost.
 */

function isLocalhostUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1" || host === "::1"
}

/**
 * Returns the production/public application base URL (no trailing slash).
 * Throws in production if missing, invalid, or pointing at localhost.
 */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const isProd = process.env.NODE_ENV === "production"

  if (!raw) {
    if (isProd) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is required in production. Set it to your public site origin (e.g. https://saferu.com)."
      )
    }
    return "http://localhost:3000"
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(
      `NEXT_PUBLIC_APP_URL is invalid: "${raw}". Use an absolute URL such as https://saferu.com.`
    )
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`NEXT_PUBLIC_APP_URL must use http or https. Got: ${url.protocol}`)
  }

  if (isProd) {
    if (url.protocol !== "https:") {
      throw new Error(
        "NEXT_PUBLIC_APP_URL must use https in production (customers must never be sent to an insecure origin)."
      )
    }
    if (isLocalhostUrl(url)) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL must not be localhost in production."
      )
    }
  }

  // Strip trailing slash for consistent joins
  return `${url.protocol}//${url.host}`
}
