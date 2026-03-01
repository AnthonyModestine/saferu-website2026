"use client"

import { useState, useEffect } from "react"

export interface MemberSession {
  id: string
  email: string
  name: string | null
  paid: boolean
}

export function useMemberSession(): {
  member: MemberSession | null
  isLoading: boolean
} {
  const [member, setMember] = useState<MemberSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.member) setMember(data.member)
      })
      .catch(() => {
        if (!cancelled) setMember(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { member, isLoading }
}
