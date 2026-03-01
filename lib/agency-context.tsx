"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

const STORAGE_KEY = "pio_agency_settings"

interface AgencySettings {
  agencyName: string
  city: string
  state: string
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
  city: "",
  state: "",
  boilerplate: "",
  logoUrl: null,
  contactName: "",
  contactPhone: "",
  contactPhone2: "",
  contactEmail: "",
}

function loadStored(): AgencySettings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AgencySettings>
      return { ...defaultSettings, ...parsed }
    }
  } catch {
    // ignore
  }
  return defaultSettings
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
    setSettings(loadStored())
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
