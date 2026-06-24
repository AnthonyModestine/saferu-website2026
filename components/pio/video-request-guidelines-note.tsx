import { Info } from "lucide-react"

/**
 * Shown in Press Center UI — not injected into AI-generated video request text.
 */
export function VideoRequestGuidelinesNote({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-lg border border-[#1470AF]/20 bg-[#1470AF]/5 px-4 py-3 text-sm text-muted-foreground ${className}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1470AF]" aria-hidden />
      <p>
        Video requests in Press Center are drafted to follow{" "}
        <span className="font-medium text-foreground">Neighbors by Ring community moderation guidelines</span>.
        Review and edit before posting to Neighbors, social media, or your usual channels.
      </p>
    </div>
  )
}
