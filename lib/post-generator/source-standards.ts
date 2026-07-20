/**
 * Source priority and URL quality standards for Post Generator.
 */

export function isLikelyHomepageUrl(url?: string | null): boolean {
  if (!url?.trim()) return false
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, "") || "/"
    // Bare domain or generic landing paths are not specific advisories.
    if (path === "/" || path === "") return true
    if (/^\/(index\.html?)?$/i.test(path)) return true
    if (/^\/(news|alerts?|press)?\/?$/i.test(path)) return true
    return false
  } catch {
    return false
  }
}

export function sourceStandardsBrief(): string {
  return `SOURCE STANDARDS:
- Prefer official sources: agency site/social, municipal/county, police/fire/EMS/EM, NWS, NHC, state DOT/511, utilities, schools, health departments, AirNow, USGS, FEMA/Ready.gov, CDC, USFA, NHTSA, FTC, FBI/IC3, CISA, NIFC/InciWeb, Watch Duty, then established local media quoting officials.
- Do not treat unverified scanner posts, rumors, anonymous reports, opinion, promotional articles, search snippets, or AI summaries as verified sources.
- Every external recommendation needs a working URL that directly supports the facts. A general homepage is not sufficient when a specific advisory/notice/article exists.
- Agency-created SaferU content follow-ups use sourceContentId / sourceType instead of inventing a fake external URL.`
}

export function currentnessBrief(): string {
  return `CURRENTNESS:
- Prefer active-now, published within 48 hours and still relevant, scheduled within 3 days, or within 7 days when preparation time is needed.
- Reject expired alerts, completed closures, past events, resolved outages, and stale articles.
- Validate against the current date; judge the underlying event/impact timing, not only the article publish date.`
}