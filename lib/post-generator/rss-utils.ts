export type RssItem = {
  title: string
  link: string
  pubDate?: string
  guid?: string
}

/** Minimal RSS 2.0 parser — sufficient for IC3 and other simple feeds. */
export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = []
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []
  for (const block of itemBlocks) {
    const title = extractTag(block, "title")
    const link = extractTag(block, "link")
    if (!title || !link) continue
    items.push({
      title,
      link,
      pubDate: extractTag(block, "pubDate"),
      guid: extractTag(block, "guid"),
    })
  }
  return items
}

function extractTag(block: string, tag: string): string | undefined {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(block)
  if (cdata?.[1]) return cdata[1].trim()
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block)
  if (!plain?.[1]) return undefined
  return plain[1].replace(/<[^>]+>/g, "").trim()
}

export function parseRssDate(value?: string): Date | null {
  if (!value?.trim()) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
