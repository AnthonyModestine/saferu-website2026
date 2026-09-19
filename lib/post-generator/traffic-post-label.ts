/** Distinguish real road closures from speed-limit changes and other traffic notices. */

export function isSpeedLimitChange(text: string): boolean {
  const lower = text.toLowerCase()
  return /speed limit|limit reduction|reduced from \d+|mph\b|miles per hour/.test(lower)
}

export function isActualRoadClosure(text: string): boolean {
  const lower = text.toLowerCase()
  if (isSpeedLimitChange(lower)) return false
  return (
    /road (?:closed|closure)|lane closure|street closed|bridge closed|roadway closed|full closure|detour|closed between|closed from|closed to|closed overnight|will be closed|is closed/.test(
      lower
    ) ||
    /\bclosed\b.{0,40}\b(?:street|road|avenue|boulevard|highway|route)\b/i.test(text)
  )
}

export function trafficPostTypeLabel(
  text: string
): "Road Closure" | "Traffic Advisory" | null {
  if (isSpeedLimitChange(text)) return "Traffic Advisory"
  if (isActualRoadClosure(text)) return "Road Closure"
  if (
    /traffic signal|signal work|lane restriction|construction|utility work|congestion|crash|collision|penndot|511/.test(
      text.toLowerCase()
    )
  ) {
    return "Traffic Advisory"
  }
  return null
}

export function inferTrafficCategory(text: string): string | null {
  if (isSpeedLimitChange(text)) return "traffic_advisory"
  if (isActualRoadClosure(text)) return "road_closure"
  if (trafficPostTypeLabel(text) === "Traffic Advisory") return "traffic_advisory"
  return null
}
