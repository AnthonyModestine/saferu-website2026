/**
 * Accuracy-first execution requires genuinely validated visual assets.
 * Constrained image generation alone does NOT guarantee correctness.
 */

export type ValidatedVisualAsset = {
  id: string
  topicTags: string[]
  title: string
  /** Provenance: who validated and against what standard. */
  validatedBy: string
  validatedAt: string
  authorityReference: string
  /** What the asset is certified to depict correctly. */
  depictsCorrectly: string[]
  /** Explicit non-claims. */
  doesNotGuarantee: string[]
  /** Local or CDN path — empty means not yet provisioned. */
  assetPath: string | null
  status: "available" | "planned" | "retired"
}

/**
 * Registry of validated educational assets. Expand only with real reviewed assets.
 * Empty assetPath = strategy may recommend accuracy-first but must not pretend generation is validated.
 */
export const VALIDATED_VISUAL_ASSET_REGISTRY: ValidatedVisualAsset[] = [
  {
    id: "child-seat-rf-backseat-diagram-v1",
    topicTags: ["child-passenger", "car-seat", "airbag"],
    title: "Rear-facing car seat in back seat with front airbag prohibition mark",
    validatedBy: "pending_owner_review",
    validatedAt: "",
    authorityReference: "NHTSA child passenger safety guidance (to be attached on intake)",
    depictsCorrectly: [
      "Rear-facing seat located in rear seating position",
      "Clear prohibition of rear-facing seat in front of active airbag",
    ],
    doesNotGuarantee: [
      "Correct harness routing for every seat model",
      "Age/height fit for a specific child",
      "Vehicle-specific LATCH/seat-belt install",
    ],
    assetPath: null,
    status: "planned",
  },
]

export function findValidatedAssetsForTopic(topic: string): ValidatedVisualAsset[] {
  const t = topic.toLowerCase()
  return VALIDATED_VISUAL_ASSET_REGISTRY.filter(
    (a) =>
      a.status !== "retired" &&
      a.topicTags.some((tag) => t.includes(tag) || tag.includes(t.split(/\s+/)[0] || ""))
  )
}

export function accuracyFirstReady(topic: string): {
  ready: boolean
  assets: ValidatedVisualAsset[]
  reason: string
} {
  const assets = findValidatedAssetsForTopic(topic).filter(
    (a) => a.status === "available" && Boolean(a.assetPath)
  )
  if (assets.length === 0) {
    return {
      ready: false,
      assets: findValidatedAssetsForTopic(topic),
      reason:
        "No validated asset file available yet — do not treat constrained AI generation as accuracy-first. Use native/hybrid with human review or provision a validated asset.",
    }
  }
  return {
    ready: true,
    assets,
    reason: "Validated asset(s) available for compositing with approved text.",
  }
}
