/** Category accent colors per docs/SAFERU-UI-UX.md §4 */
export const CATEGORY_ACCENTS: Record<string, string> = {
  "crime-prevention": "#1470AF",
  "fire-prevention": "#E07C3E",
  "whats-new": "#F2B233",
  "weather-preparedness": "#5B7A9D",
  "natural-disaster": "#C44D4D",
  "community-awareness": "#4A9D6B",
}

export function getCategoryAccent(categoryId: string): string {
  return CATEGORY_ACCENTS[categoryId] ?? "#1470AF"
}
