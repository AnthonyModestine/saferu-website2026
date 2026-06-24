"use client"

import { useCallback, useState } from "react"
import { SIGNUP_PLACEHOLDER_CLASS } from "@/lib/signup-form-copy"
import { cn } from "@/lib/utils"

/**
 * Placeholders clear on focus or first keystroke so example text
 * (John, you@agency.gov, etc.) never looks like pre-filled data.
 */
export function useSignupPlaceholders() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const hide = useCallback((key: string) => {
    setHidden((prev) => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  const placeholder = useCallback(
    (key: string, text: string) => (hidden[key] ? "" : text),
    [hidden]
  )

  const inputProps = useCallback(
    (
      key: string,
      example: string,
      extra?: { onChange?: () => void; className?: string }
    ) => ({
      placeholder: placeholder(key, example),
      onFocus: () => hide(key),
      onChange: (_e: React.ChangeEvent<HTMLInputElement>) => {
        hide(key)
        extra?.onChange?.()
      },
      className: cn(SIGNUP_PLACEHOLDER_CLASS, extra?.className),
    }),
    [hide, placeholder]
  )

  return { hide, placeholder, inputProps }
}
