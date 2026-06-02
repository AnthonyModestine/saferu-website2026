import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"

export default async function WhatsNewLayout({ children }: { children: React.ReactNode }) {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
  return children
}
