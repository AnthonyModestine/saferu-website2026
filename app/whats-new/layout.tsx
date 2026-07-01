import { ensureContentLoaded } from "@/lib/ensure-content-loaded"

export const dynamic = "force-dynamic"

export default async function WhatsNewLayout({ children }: { children: React.ReactNode }) {
  await ensureContentLoaded()
  return children
}
