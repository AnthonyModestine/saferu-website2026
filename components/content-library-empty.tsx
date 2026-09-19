import Link from "next/link"
import { ImageIcon, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type ContentLibraryEmptyProps = {
  title?: string
  description?: string
  icon?: LucideIcon
  actionHref?: string
  actionLabel?: string
}

/**
 * Empty state for curated Content Library sections with no graphics/articles yet.
 */
export function ContentLibraryEmpty({
  title = "Check back soon",
  description = "Ready-to-share graphics for this section are being prepared. Please check back later.",
  icon: Icon = ImageIcon,
  actionHref,
  actionLabel,
}: ContentLibraryEmptyProps) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#E2E8F5] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F4F8]">
        <Icon className="h-6 w-6 text-[#5c6b85]" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#1A365D]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#42536e]">{description}</p>
      {actionHref && actionLabel ? (
        <Button
          asChild
          className="mt-6 rounded-xl bg-[#1A365D] px-6 font-semibold text-white hover:bg-[#1A365D]/90"
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
