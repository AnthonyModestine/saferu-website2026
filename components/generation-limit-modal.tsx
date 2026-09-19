"use client"

import { useState } from "react"
import { Loader2, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { startHostedCheckoutSession } from "@/app/actions/stripe"

const PACKS = [
  { id: "generations-5", label: "25,000 tokens", price: "$10" },
  { id: "generations-12", label: "50,000 tokens", price: "$20", popular: true },
  { id: "generations-35", label: "125,000 tokens", price: "$50" },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerationLimitModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleBuy(productId: string) {
    setLoading(productId)
    try {
      const url = await startHostedCheckoutSession(productId)
      if (url) window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-5 w-5 text-[#f2b233]" />
            <DialogTitle className="text-[#1a365d]">Out of AI Tokens</DialogTitle>
          </div>
          <DialogDescription>
            You&apos;ve used all 100,000 AI tokens included this month. Your form is saved — purchase a
            pack and generate right away.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border mt-2">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={loading !== null}
              onClick={() => handleBuy(pack.id)}
              className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors text-left disabled:opacity-60 ${
                pack.popular
                  ? "bg-[#1470AF]/5 hover:bg-[#1470AF]/10"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{pack.label}</span>
                {pack.popular && (
                  <span className="text-[10px] font-semibold text-[#1470AF] bg-[#1470AF]/10 px-2 py-0.5 rounded-full">
                    Most popular
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{pack.price}</span>
                {loading === pack.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>

        <Button variant="ghost" className="mt-2 w-full" onClick={() => onOpenChange(false)}>
          Not now
        </Button>
      </DialogContent>
    </Dialog>
  )
}
