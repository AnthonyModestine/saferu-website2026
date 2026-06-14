import { getContentAnalytics } from "@/lib/content-analytics"
import { getAllArticlePaths } from "@/lib/content-paths"
import { getDatabaseStorageMeta } from "@/lib/db"
import {
  getMetricsStorageWarning,
  type MetricsStorageMeta,
} from "@/lib/metrics-storage-message"
import { getPressCenterDashboard, type DateRange } from "@/lib/pio-analytics"

export type { MetricsStorageMeta }
export { getMetricsStorageWarning }

export async function getAdminMetricsDashboard(
  range: DateRange,
  groupBy: "day" | "week" | "month" = "day"
) {
  const [pressCenter, content, meta] = await Promise.all([
    getPressCenterDashboard(range, groupBy),
    getContentAnalytics(range, getAllArticlePaths()),
    getDatabaseStorageMeta(),
  ])

  return {
    meta,
    pressCenter,
    content,
  }
}
