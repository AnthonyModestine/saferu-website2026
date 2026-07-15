"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { DEMO_AGENCY_LOGO_URL } from "@/lib/agency-context"
import { US_HOLIDAY_CATALOG, createHolidayImage } from "@/lib/pio-holiday-graphic"

const AGENCY = "Demo Public Safety Department"

export default function HolidayPreviewPage() {
  const [images, setImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next: Record<string, string> = {}
      for (const item of US_HOLIDAY_CATALOG) {
        const dataUrl = await createHolidayImage({
          logoUrl: DEMO_AGENCY_LOGO_URL,
          agencyName: AGENCY,
          slogan: item.slogan,
          theme: item.theme,
        })
        if (cancelled) return
        next[item.label] = dataUrl
      }
      if (!cancelled) {
        setImages(next)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-zinc-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold">USA holiday graphic previews</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {US_HOLIDAY_CATALOG.length} holidays with dedicated themes and festive decorations.
          Same 16:9 layout on every card — logo, slogan, agency name.
        </p>

        {loading ? (
          <p className="mt-10 text-zinc-500">Generating {US_HOLIDAY_CATALOG.length} previews…</p>
        ) : (
          <div className="mt-10 grid gap-8">
            {US_HOLIDAY_CATALOG.map((item) => (
              <section key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h2 className="mb-3 text-lg font-medium">{item.label}</h2>
                {images[item.label] ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-700">
                    <Image
                      src={images[item.label]}
                      alt={`${item.label} holiday graphic`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-zinc-500">
                  Theme: <span className="text-zinc-400">{item.theme}</span> · Slogan:{" "}
                  <span className="text-zinc-400">{item.slogan}</span>
                </p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
