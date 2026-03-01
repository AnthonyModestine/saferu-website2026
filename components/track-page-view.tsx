"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { track } from "@/lib/track"

export function TrackPageView() {
  const pathname = usePathname()
  useEffect(() => {
    if (pathname) track("page_view", { path: pathname })
  }, [pathname])
  return null
}
