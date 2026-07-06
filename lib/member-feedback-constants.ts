/** Days after free member signup before the feedback popup appears */
export const MEMBER_FEEDBACK_DAYS_AFTER_SIGNUP = 20

export const MEMBER_FEEDBACK_HELP_OPTIONS = [
  { value: "ready_to_use_graphics", label: "Ready-to-use graphics" },
  { value: "post_wording_captions", label: "Post wording/captions" },
  { value: "finding_safety_topics", label: "Finding safety topics to share" },
  { value: "saving_time", label: "Saving time" },
  { value: "consistent_messaging", label: "Keeping community messaging consistent" },
  { value: "easier_to_post", label: "Making safety content easier to post" },
  { value: "other", label: "Other" },
] as const

export type MemberFeedbackHelpValue = (typeof MEMBER_FEEDBACK_HELP_OPTIONS)[number]["value"]

const HELP_LABELS = Object.fromEntries(
  MEMBER_FEEDBACK_HELP_OPTIONS.map((o) => [o.value, o.label])
) as Record<MemberFeedbackHelpValue, string>

export function formatHelpedWithLabels(
  values: string[] | null | undefined,
  other?: string | null
): string[] {
  if (!values?.length) return []
  return values.map((v) => {
    if (v === "other") {
      const trimmed = other?.trim()
      return trimmed ? `Other: ${trimmed}` : "Other"
    }
    return HELP_LABELS[v as MemberFeedbackHelpValue] ?? v
  })
}
