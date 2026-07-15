"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { DepartmentType } from "@/lib/department-types"
import { isLocalHostname } from "@/lib/local-preview"

const STORAGE_KEY = "pio_agency_settings"

/** Generic public-safety badge for localhost testing (Settings + weather graphics). */
export const DEMO_AGENCY_LOGO_URL = "/images/demo-agency-badge.svg"

interface AgencySettings {
  agencyName: string
  agencyType: DepartmentType
  agencyTypeOther: string
  city: string
  state: string
  /** Comma- or space-separated ZIPs the agency serves — used for Local Ideas. */
  serviceZips: string
  boilerplate: string
  logoUrl: string | null
  contactName: string
  contactPhone: string
  contactPhone2: string
  contactEmail: string
}

interface AgencyContextType {
  settings: AgencySettings
  updateSettings: (settings: Partial<AgencySettings>) => void
}

const defaultSettings: AgencySettings = {
  agencyName: "",
  agencyType: "other",
  agencyTypeOther: "",
  city: "",
  state: "",
  serviceZips: "",
  boilerplate: "",
  logoUrl: null,
  contactName: "",
  contactPhone: "",
  contactPhone2: "",
  contactEmail: "",
}

const PERSONAL_INFO_REPLACEMENTS: Partial<Record<keyof AgencySettings, string>> = {
  contactName: "John Smith",
  contactPhone: "555-555-5555",
  contactPhone2: "",
  contactEmail: "John.Smith@DemoAgency.gov",
}

const PERSONAL_VALUES_TO_REPLACE = [
  "anthony modestine",
  "6102205432",
  "a@saferu.com",
]

function sanitizeSettings(settings: AgencySettings): AgencySettings {
  const result = { ...settings }
  for (const key of Object.keys(PERSONAL_INFO_REPLACEMENTS) as (keyof AgencySettings)[]) {
    const val = result[key]
    if (typeof val === "string" && PERSONAL_VALUES_TO_REPLACE.includes(val.toLowerCase().trim())) {
      (result as Record<string, unknown>)[key] = PERSONAL_INFO_REPLACEMENTS[key]
    }
  }
  return result
}

function withLocalTestingDefaults(settings: AgencySettings): AgencySettings {
  if (typeof window === "undefined") return settings
  if (!isLocalHostname(window.location.hostname)) return settings

  let next = settings
  if (!settings.logoUrl) {
    next = { ...next, logoUrl: DEMO_AGENCY_LOGO_URL }
  }
  if (!settings.agencyName.trim()) {
    next = { ...next, agencyName: "Demo Township Police Department" }
  }
  return next
}

function loadStored(): AgencySettings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AgencySettings>
      const merged = { ...defaultSettings, ...parsed }
      if (!merged.agencyType) merged.agencyType = "other"
      if (typeof merged.agencyTypeOther !== "string") merged.agencyTypeOther = ""
      if (typeof merged.serviceZips !== "string") merged.serviceZips = ""
      const sanitized = sanitizeSettings(merged)
      const withTesting = withLocalTestingDefaults(sanitized)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTesting))
      return withTesting
    }
  } catch {
    // ignore
  }
  const withTesting = withLocalTestingDefaults(defaultSettings)
  if (withTesting.logoUrl || withTesting.agencyName) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTesting))
    } catch {
      // ignore
    }
  }
  return withTesting
}

function saveStored(settings: AgencySettings): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore (e.g. quota)
  }
}

const AgencyContext = createContext<AgencyContextType | null>(null)

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AgencySettings>(defaultSettings)

  useEffect(() => {
    const hadStored =
      typeof window !== "undefined" && Boolean(localStorage.getItem(STORAGE_KEY))
    const stored = loadStored()
    setSettings(stored)

    if (hadStored) return

    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const member = data?.member
        if (!member) return
        setSettings((prev) => {
          const next: AgencySettings = {
            ...prev,
            agencyName: member.agency || prev.agencyName,
            agencyType: member.departmentType || prev.agencyType,
            agencyTypeOther: member.departmentOther || prev.agencyTypeOther,
          }
          saveStored(next)
          return next
        })
      })
      .catch(() => {})
  }, [])

  const updateSettings = (newSettings: Partial<AgencySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings }
      saveStored(next)
      return next
    })
  }

  return (
    <AgencyContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AgencyContext.Provider>
  )
}

export function useAgency() {
  const context = useContext(AgencyContext)
  if (!context) {
    throw new Error("useAgency must be used within an AgencyProvider")
  }
  return context
}
