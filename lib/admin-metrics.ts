import { getContentAnalytics } from "@/lib/content-analytics"
import { getAllArticlePaths } from "@/lib/content-paths"
import { getPressCenterDashboard, type DateRange } from "@/lib/pio-analytics"

export async function getAdminMetricsDashboard(
  range: DateRange,
  groupBy: "day" | "week" | "month" = "day"
) {
  const [pressCenter, content] = await Promise.all([
    getPressCenterDashboard(range, groupBy),
    getContentAnalytics(range, getAllArticlePaths()),
  ])

  return { pressCenter, content }
}
