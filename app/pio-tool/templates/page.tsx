"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PIOPaywall } from "@/components/pio-paywall"
import {
  deleteEventTemplate,
  getEventTemplates,
  type PioEventTemplate,
} from "@/lib/pio-event-templates-store"
import { CalendarDays, Plus, Trash2, Copy } from "lucide-react"

export default function TemplatesPage() {
  return (
    <PIOPaywall>
      <TemplatesPageInner />
    </PIOPaywall>
  )
}

function TemplatesPageInner() {
  const [templates, setTemplates] = useState<PioEventTemplate[]>([])

  function refresh() {
    setTemplates(getEventTemplates())
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1c3f]">Templates</h1>
          <p className="mt-1 text-sm text-[#667795]">
            Recurring community events you marked to reuse. Open a template to create the next
            occurrence.
          </p>
        </div>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1d4ed8]">
          <Link href="/pio-tool/events?new=1">
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c7d2e5] bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#10B981]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="font-semibold text-[#0f1c3f]">No recurring event templates yet</p>
          <p className="mt-1 text-sm text-[#7a8ab0]">
            When creating an event, check <span className="font-medium">This is a recurring event</span>{" "}
            — it will be saved here automatically.
          </p>
          <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1d4ed8]">
            <Link href="/pio-tool/events?new=1">Create Community Event</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#e2e8f5] bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0f1c3f]">{t.title}</p>
                <p className="mt-0.5 text-sm text-[#6b7c9c]">
                  {t.location}
                  {t.startTime ? ` · ${t.startTime}` : ""}
                  {t.endTime ? `–${t.endTime}` : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[#405172]">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {t.hostingRole && t.hostingRole !== "hosting" && (
                    <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#92400e]">
                      {t.hostingRole === "co_hosting"
                        ? "Co-hosting"
                        : t.hostingRole === "participating"
                          ? "Participating"
                          : "Promoting"}
                      {t.hostOrganization ? ` · ${t.hostOrganization}` : ""}
                    </span>
                  )}
                  {t.eventType && (
                    <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[11px] font-semibold text-[#1D4ED8]">
                      {t.eventType}
                    </span>
                  )}
                  <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-medium text-[#6b7280]">
                    Updated {new Date(t.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild size="sm" className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                  <Link href={`/pio-tool/events?new=1&template=${t.id}`}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Use template
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    deleteEventTemplate(t.id)
                    refresh()
                  }}
                  aria-label="Delete template"
                >
                  <Trash2 className="h-3.5 w-3.5 text-[#94A3B8]" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
