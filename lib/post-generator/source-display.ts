/** Extract a direct URL from markdown links or plain text. */
export function extractSourceUrl(text: string): string | undefined {
  const trimmed = text.trim()
  if (!trimmed) return undefined

  const markdown = trimmed.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i)
  if (markdown?.[1]) return cleanTrailingPunctuation(markdown[1])

  const bare = trimmed.match(/https?:\/\/[^\s)\]>]+/i)
  if (bare?.[0]) return cleanTrailingPunctuation(bare[0])

  return undefined
}

function cleanTrailingPunctuation(url: string): string {
  return url.replace(/[.,;]+$/, "")
}

function cleanSourceLine(raw: string): string {
  return raw
    .trim()
    .replace(/^[-*•]\s*/, "")
    .replace(/\*\*[^*]+\*\*:?\s*/g, "")
    .replace(/^official source organization:\s*/i, "")
    .replace(/^\(+|\)+$/g, "")
    .trim()
}

function hostnameLabel(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./i, "")
  } catch {
    return undefined
  }
}

/** Human-readable source label for cards (never raw markdown). */
export function parseSourceDisplayName(text: string, url?: string): string {
  const markdown = text.match(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/i)
  if (markdown?.[1]?.trim()) {
    return cleanSourceLine(markdown[1]).slice(0, 120)
  }

  for (const raw of text.split("\n")) {
    const cleaned = cleanSourceLine(raw)
    if (!cleaned) continue
    if (/^page or alert title:/i.test(cleaned)) continue
    if (/^publication or update date:/i.test(cleaned)) continue
    if (/^https?:\/\//i.test(cleaned)) {
      const host = hostnameLabel(cleaned)
      if (host) return host
      continue
    }
    if (!/\(https?:\/\//.test(cleaned)) return cleaned.slice(0, 120)
  }

  if (url) {
    const host = hostnameLabel(url)
    if (host) return host
  }

  return "Official source"
}
