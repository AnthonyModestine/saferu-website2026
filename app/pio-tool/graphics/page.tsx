"use client"

import Link from "next/link"
import { ArrowLeft, ImageIcon, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GraphicStudioPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-3 text-[#475569]">
          <Link href="/pio-tool">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-[#0f1c3f]">Graphic Studio</h1>
        <p className="mt-2 max-w-2xl text-[#64748B]">
          Create professional 16:9 safety graphics for your agency. Describe the topic, approve the
          message, and generate artwork with your agency logo and a ready social caption.
        </p>
      </div>

      <Link
        href="/pio-tool/graphics/safety-tip"
        className="group block rounded-2xl border border-[#e2e8f5] bg-white p-6 shadow-sm transition hover:border-[#F2B233] hover:shadow-md"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F2B233]/15 text-[#B45309]">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0f1c3f] group-hover:text-[#92400E]">
          Safety Graphic
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
          Educational graphics for crime prevention, fire safety, scams, child safety, emergencies,
          and other community safety topics.
        </p>
        <p className="mt-4 text-sm font-semibold text-[#2563EB]">Create safety graphic →</p>
      </Link>

      <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[#F8FAFC] p-5">
        <div className="flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" />
          <div>
            <p className="text-sm font-semibold text-[#0f1c3f]">Agency logo</p>
            <p className="mt-1 text-sm text-[#64748B]">
              Upload your official logo in{" "}
              <Link href="/pio-tool/settings" className="font-semibold text-[#2563EB] hover:underline">
                Agency Settings
              </Link>
              . OpenAI places your exact logo on the graphic — scaled larger, not redrawn.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
