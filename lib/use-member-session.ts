"use client"

import { useState, useEffect } from "react"
import {
  isLocalGuestPreviewClient,
  isLocalPreviewClient,
  LOCAL_PREVIEW_MEMBER,
} from "@/lib/local-preview"

export interface MemberSession {
  id: string
  email: string
  name: string | null
  paid: boolean
}

function localPreviewMember(): MemberSession {
  return {
    id: LOCAL_PREVIEW_MEMBER.memberId,
    email: LOCAL_PREVIEW_MEMBER.email,
    name: LOCAL_PREVIEW_MEMBER.name,
    paid: true,
  }
}

export function useMemberSession(): {
  member: MemberSession | null
  isLoading: boolean
} {
  const [member, setMember] = useState<MemberSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Localhost guest preview: never hydrate the auto-login member.
    if (isLocalGuestPreviewClient()) {
      setMember(null)
      setIsLoading(false)
      return
    }

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data?.member) {
          setMember(data.member)
        } else if (isLocalPreviewClient()) {
          setMember(localPreviewMember())
        } else {
          setMember(null)
        }
      })
      .catch(() => {
        if (cancelled) return
        setMember(isLocalPreviewClient() ? localPreviewMember() : null)
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
