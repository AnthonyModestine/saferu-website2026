import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getMemberSession } from "@/lib/member-session"
import { PioToolShell } from "@/components/pio/pio-tool-shell"

/** Guest-accessible Press Center paths (marketing dashboard, subscribe, post-checkout). */
function isPublicPioPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/"
  return (
    normalized === "/pio-tool" ||
    normalized === "/pio-tool/subscribe" ||
    normalized === "/pio-tool/checkout-success"
  )
}

export default async function PIOToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = await headers()
  const pathname = h.get("x-pathname")

  // Fail closed: if pathname is unknown, require a session (do not assume guest dashboard).
  const allowGuest = pathname != null && isPublicPioPath(pathname)
  if (!allowGuest) {
    const session = await getMemberSession()
    if (!session?.memberId) {
      redirect("/pio-tool?guest=1")
    }
  }

  return <PioToolShell>{children}</PioToolShell>
}
