/**
 * Recurring event templates for Press Center.
 * Stored in localStorage (key: pio_event_templates). Client-only.
 */

export type PioEventTemplate = {
  id: string
  title: string
  description: string
  location: string
  address?: string
  startTime: string
  endTime?: string
  eventType?: string
  category?: string
  highlights?: string[]
  contactEmail?: string
  contactPhone?: string
  audienceGoals?: string
  contentPrefs?: string
  hostingRole?: string
  hostOrganization?: string
  audience?: string
  parking?: string
  registration?: string
  registrationRequired?: boolean
  registrationDeadline?: string
  registrationUrl?: string
  cost?: string
  accessibility?: string
  arrivalInstructions?: string
  website?: string
  primaryImage?: string
  additionalAssets?: string
  capacityStatus?: string
  weatherPlan?: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "pio_event_templates"

function getStorage(): PioEventTemplate[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PioEventTemplate[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setStorage(items: PioEventTemplate[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function getEventTemplates(): PioEventTemplate[] {
  return getStorage().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getEventTemplateById(id: string): PioEventTemplate | null {
  return getStorage().find((t) => t.id === id) ?? null
}

/** Upsert template by title+location for the same recurring series, or create new. */
export function saveEventTemplate(
  input: Omit<PioEventTemplate, "id" | "createdAt" | "updatedAt"> & { id?: string }
): PioEventTemplate {
  const all = getStorage()
  const now = new Date().toISOString()
  const existingIdx = input.id
    ? all.findIndex((t) => t.id === input.id)
    : all.findIndex(
        (t) =>
          t.title.trim().toLowerCase() === input.title.trim().toLowerCase() &&
          t.location.trim().toLowerCase() === input.location.trim().toLowerCase()
      )

  if (existingIdx >= 0) {
    const prev = all[existingIdx]!
    const next: PioEventTemplate = {
      ...prev,
      ...input,
      id: prev.id,
      createdAt: prev.createdAt,
      updatedAt: now,
    }
    all[existingIdx] = next
    setStorage(all)
    return next
  }

  const created: PioEventTemplate = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    location: input.location,
    address: input.address,
    startTime: input.startTime,
    endTime: input.endTime,
    eventType: input.eventType,
    category: input.category,
    highlights: input.highlights,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    audienceGoals: input.audienceGoals,
    contentPrefs: input.contentPrefs,
    hostingRole: input.hostingRole,
    hostOrganization: input.hostOrganization,
    audience: input.audience,
    parking: input.parking,
    registration: input.registration,
    registrationRequired: input.registrationRequired,
    registrationDeadline: input.registrationDeadline,
    registrationUrl: input.registrationUrl,
    cost: input.cost,
    accessibility: input.accessibility,
    arrivalInstructions: input.arrivalInstructions,
    website: input.website,
    primaryImage: input.primaryImage,
    additionalAssets: input.additionalAssets,
    capacityStatus: input.capacityStatus,
    weatherPlan: input.weatherPlan,
    createdAt: now,
    updatedAt: now,
  }
  all.push(created)
  setStorage(all)
  return created
}

export function deleteEventTemplate(id: string): void {
  setStorage(getStorage().filter((t) => t.id !== id))
}
