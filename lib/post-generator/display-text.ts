/** Strip markdown labels and list noise from AI briefing fields shown in the UI. */
export function cleanDisplayTitle(raw: string): string {
  let text = raw.trim()
  if (!text) return ""

  text = text.replace(/^-\s+/, "")

  const labeled = text.match(/^\*\*([^*]+)\*\*:?\s*(.+)$/i)
  if (labeled?.[2]?.trim()) {
    text = labeled[2].trim()
  }

  text = text.replace(/\*\*([^*]+)\*\*:?\s*/g, "")
  text = text.replace(
    /^(event|post topic|road closure|weather alert|traffic advisory)\s*[—–-]\s*/i,
    ""
  )
  text = text.replace(/^(event|post topic|road closure|weather alert|traffic advisory):\s*/i, "")
  text = text.replace(/\s+/g, " ").trim()
  text = text.replace(/^[-—–:]\s*/, "").trim()

  return text
}

export function isGenericWhyText(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return true
  const lower = trimmed.toLowerCase()
  if (
    /fosters trust|enhances public safety and community|engaging with the community through local events|builds trust between residents|community well-being/.test(
      lower
    )
  ) {
    return true
  }
  if (trimmed.length > 160 && !/\d|street|st\.|avenue|ave\.|road| highway | am| pm|monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(lower)) {
    return true
  }
  return false
}
