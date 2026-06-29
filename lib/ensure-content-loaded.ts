import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadContentMeta } from "@/lib/content-meta-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"

/** Load CMS additions, order/overrides, and publish state before reading merged content. */
export async function ensureContentLoaded(): Promise<void> {
  await Promise.all([loadCmsAdditions(), loadContentMeta(), loadVisibility()])
}
