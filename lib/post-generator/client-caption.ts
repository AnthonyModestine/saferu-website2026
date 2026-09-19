import type { GeneratorResult, PostOpportunity } from "./types"
import { buildOpportunityFallbackMessage } from "./caption-voice"

export type CaptionAgencyContext = {
  agencyName: string
  agencyType: string
  agencyTypeOther: string
  city: string
  county?: string
  state: string
}

export async function fetchOpportunityCaption(
  _opp: PostOpportunity,
  _ctx: CaptionAgencyContext
): Promise<string | null> {
  return null
}

export function opportunityCaptionFallback(
  opp: PostOpportunity,
  ctx: CaptionAgencyContext
): string {
  return buildOpportunityFallbackMessage(
    opp,
    ctx.agencyName,
    { city: ctx.city, county: ctx.county, state: ctx.state }
  )
}

export async function resolveOpportunityCaption(
  opp: PostOpportunity,
  ctx: CaptionAgencyContext
): Promise<{ message: string; usedFallback: boolean }> {
  const ai = await fetchOpportunityCaption(opp, ctx)
  if (ai) return { message: ai, usedFallback: false }
  return { message: opportunityCaptionFallback(opp, ctx), usedFallback: true }
}

function patchList(
  list: PostOpportunity[],
  messages: Map<string, string>
): PostOpportunity[] {
  return list.map((opp) => {
    const caption = messages.get(opp.id)
    return caption ? { ...opp, curatedMessage: caption } : opp
  })
}

/** Generate Facebook-ready captions for live community recommendations. */
export async function generateCaptionsForBriefing(
  result: GeneratorResult,
  ctx: CaptionAgencyContext,
  options?: { useAi?: boolean; onProgress?: (generatingIds: string[]) => void }
): Promise<GeneratorResult> {
  const live = [
    ...result.topRecommended,
    ...result.couldPost,
    ...result.urgent,
    ...result.recommendedToday,
    ...result.planAhead,
  ].filter((opp, index, all) => all.findIndex((item) => item.id === opp.id) === index)

  const needsCaption = live.filter(
    (opp) =>
      opp.opportunitySource !== "saferu_curated" && !opp.curatedMessage?.trim()
  )
  if (!needsCaption.length) return result

  const messages = new Map<string, string>()
  options?.onProgress?.(needsCaption.map((opp) => opp.id))

  if (options?.useAi) {
    await Promise.all(
      needsCaption.map(async (opp) => {
        const { message } = await resolveOpportunityCaption(opp, ctx)
        messages.set(opp.id, message)
      })
    )
  } else {
    for (const opp of needsCaption) {
      messages.set(opp.id, opportunityCaptionFallback(opp, ctx))
    }
  }

  options?.onProgress?.([])

  if (!messages.size) return result

  return {
    ...result,
    urgent: patchList(result.urgent, messages),
    recommendedToday: patchList(result.recommendedToday, messages),
    planAhead: patchList(result.planAhead, messages),
    topRecommended: patchList(result.topRecommended, messages),
    couldPost: patchList(result.couldPost, messages),
    fromSaferU: patchList(result.fromSaferU, messages),
  }
}

export function briefingNeedsCaptions(result: GeneratorResult): boolean {
  return [
    ...result.topRecommended,
    ...result.couldPost,
    ...result.urgent,
    ...result.recommendedToday,
    ...result.planAhead,
  ].some(
    (opp) =>
      opp.opportunitySource !== "saferu_curated" && !opp.curatedMessage?.trim()
  )
}
