import { Info } from "lucide-react"

/**
 * Shown in Press Center UI — not injected into AI-generated video request text.
 */
export function VideoRequestGuidelinesNote({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-[#e2e8f5] bg-white px-4 py-3 text-sm text-[#667795] shadow-sm ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" aria-hidden />
      <p>
        Video requests are drafted to follow{" "}
        <span className="font-medium text-[#0f1c3f]">Neighbors by Ring community moderation guidelines</span>.
        Review and edit before posting.
      </p>
    </div>
  )
}
