import { loadCmsAdditions } from "@/lib/cms-additions-persist"
import { loadVisibility } from "@/lib/content-visibility-persist"

/** Load CMS additions and publish state from Postgres/file before reading merged content. */
export async function ensureContentLoaded(): Promise<void> {
  await Promise.all([loadCmsAdditions(), loadVisibility()])
}
