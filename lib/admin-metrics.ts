import { getContentAnalytics, loadContentEventsInRange } from "@/lib/content-analytics"
import { getAllArticlePaths } from "@/lib/content-paths"
import { getDatabaseStorageMeta } from "@/lib/db"
import { getMemberPaymentStatusMap } from "@/lib/member-payment-status"
import { buildPaymentSegmentAnalytics, type PaymentSegmentAnalytics } from "@/lib/payment-segment-analytics"
import {
  getMetricsStorageWarning,
  type MetricsStorageMeta,
} from "@/lib/metrics-storage-message"
import {
  getPressCenterDashboard,
  loadGenerationActionsInRange,
  loadGenerationSessionsInRange,
  type DateRange,
} from "@/lib/pio-analytics"

export type { MetricsStorageMeta, PaymentSegmentAnalytics }
export { getMetricsStorageWarning }

export async function getAdminMetricsDashboard(
  range: DateRange,
  groupBy: "day" | "week" | "month" = "day"
) {
  const [pressCenter, content, meta, statusMap, contentEvents, sessions, actions] =
    await Promise.all([
      getPressCenterDashboard(range, groupBy),
      getContentAnalytics(range, getAllArticlePaths()),
      getDatabaseStorageMeta(),
      getMemberPaymentStatusMap(),
      loadContentEventsInRange(range),
      loadGenerationSessionsInRange(range),
      loadGenerationActionsInRange(range),
    ])

  const paymentSegments = buildPaymentSegmentAnalytics({
    statusMap,
    contentEvents,
    sessions,
    actions,
  })

  return {
    meta,
    pressCenter,
    content,
    paymentSegments,
  }
}
