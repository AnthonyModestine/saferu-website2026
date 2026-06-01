"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"

const LONG_MESSAGE_CHAR_LIMIT = 280
const LONG_MESSAGE_LINE_LIMIT = 6

function isLongMessage(message: string): boolean {
  if (message.length > LONG_MESSAGE_CHAR_LIMIT) return true
  return message.split("\n").length > LONG_MESSAGE_LINE_LIMIT
}

interface PostMessageBlockProps {
  postId: string
  postTitle: string
  message: string
  copiedId: string | null
  copyErrorId: string | null
  onCopy: (text: string, id: string, postTitle?: string) => void
}

export function PostMessageBlock({
  postId,
  postTitle,
  message,
  copiedId,
  copyErrorId,
  onCopy,
}: PostMessageBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const long = isLongMessage(message)

  return (
    <>
      <div className="relative rounded-xl bg-gray-50 p-3 pb-8 mb-2">
        <p
          className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${
            long && !expanded ? "line-clamp-6" : ""
          } ${long && expanded ? "max-h-80 overflow-y-auto pr-1" : ""}`}
        >
          {message || "No message yet."}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-label={expanded ? "Collapse message" : "Expand message"}
            aria-expanded={expanded}
            className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-[#1470AF] shadow-sm hover:bg-gray-50 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <Button
        type="button"
        onClick={() => onCopy(message, postId, postTitle)}
        className="w-full bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold mb-3"
      >
        {copiedId === postId ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Copied!
          </>
        ) : copyErrorId === postId ? (
          "Copy failed — select text manually"
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy Message
          </>
        )}
      </Button>
    </>
  )
}

/** Standalone copy helper for other post UIs if needed. */
export async function copyPostMessage(text: string): Promise<boolean> {
  return copyTextToClipboard(text)
}

export { isLongMessage }
