"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkout } from "@/components/checkout"

export function CheckoutModal({
  label = "Get Press Center",
  className,
  productId = "pio-tool-monthly",
}: {
  label?: string
  className?: string
  productId?: string
}) {
  const [open, setOpen] = useState(false)
  const isAnnual = productId === "pio-tool-annual"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className={className ?? "w-full mt-8 py-6 text-base font-semibold bg-[#1470AF] text-white hover:bg-[#1470AF]/90"}
        >
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#1a365d]">
            {isAnnual
              ? "Subscribe to Press Center — $999/year"
              : "Subscribe to Press Center — $99/month"}
          </DialogTitle>
        </DialogHeader>
        <Checkout productId={productId} />
      </DialogContent>
    </Dialog>
  )
}
