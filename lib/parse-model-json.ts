/**
 * Parse JSON from an LLM response (handles markdown fences and extra prose).
 */
export function parseModelJson<T extends Record<string, unknown>>(raw: string): T | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const attempts: string[] = [trimmed]

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) attempts.push(fenced[1].trim())

  const start = trimmed.indexOf("{")
  const end = trimmed.lastIndexOf("}")
  if (start >= 0 && end > start) {
    attempts.push(trimmed.slice(start, end + 1))
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as T
      if (parsed && typeof parsed === "object") return parsed
    } catch {
      // try next candidate
    }
  }

  return null
}
