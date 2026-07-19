import type { AiResult } from "@/lib/ai-result"
import { STAGE_3_RESPONSE_FORMAT, stage3DecisionSchema } from "@/lib/post-generator/pipeline-schemas"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
  Stage2Draft,
  Stage3Decision,
} from "@/lib/post-generator/pipeline-types"

const STAGE_3_SYSTEM_PROMPT = `You are SaferU’s Final PIO Quality Gate.

You are an experienced public-safety communications director, factual editor, risk reviewer, and community-communication strategist.
Your job is not to automatically approve the draft.

Approve it only when it is factually supported, properly attributed, correct for the jurisdiction, appropriate for this agency, useful to residents, professionally written, human and community-oriented, free from unsupported urgency or ownership, and ready for agency review and publication.

1. FACTUAL SUPPORT
Confirm every factual statement is supported by verified facts. Reject or repair invented details, expanded claims, unsupported context, false trends, incorrect dates/times/locations, expired alerts, unsupported statistics, added causes/restoration estimates, or added agency involvement.

2. ATTRIBUTION
Confirm the issuing authority is named when appropriate; the customer agency does not claim another organization’s work; Watch Duty is accurately attributed when it is the source; the original evacuation authority is used when supplied; and Esri is not incorrectly named as the issuing authority.

3. JURISDICTION
Confirm the post does not imply ownership outside jurisdiction, neighboring information is a travel/regional heads-up, the information clearly affects residents, and statewide information is not presented as local without a local connection.

4. AGENCY ROLE
Confirm the agency sounds and acts like its configured type, has a legitimate reason to communicate, and does not stretch into another authority’s role.

5. RESIDENT VALUE
Residents must understand why it matters, what it means, what action is useful, where it came from, and why this agency is communicating it.

6. RELATIONSHIP QUALITY
The post should increase understanding or preparedness, reassure, explain a service, help residents assist responders, show the agency as useful and accessible, or encourage appropriate reporting/action. Do not require warmth in urgent alerts.

7. HUMAN VOICE
The draft must sound like a real agency, not generic AI, a news rewrite, corporate copy, a lecture, or filler. It must use clear natural sentences and fit the supplied platform.

8. PRIVACY AND OPERATIONAL SAFETY
Reject or remove private victim, patient, juvenile, witness, protected address, license plate, investigative tactic, responder-sensitive, graphic, or unreleased suspect information.

DECISIONS
Return approved when ready.
Return approved_with_revision when facts are sufficient and writing can be safely corrected.
Return needs_human_review when facts conflict, a mandatory instruction lacks a clear authority, involvement is unclear, a sensitive detail cannot be confirmed, the source does not fully support the message, or safe repair requires new information.
Return rejected when the recommendation should never have been approved, is irrelevant/deceptive/stale, has no agency role, creates unnecessary fear, or is generic filler.

Return only valid JSON matching the required schema.
Never expose internal quality review in the public post.`

export async function runStage3QualityGate(
  context: PipelineAgencyContext,
  recommendation: Stage1Recommendation,
  draft: Stage2Draft
): Promise<AiResult<Stage3Decision>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const prompt = `Final-check this SaferU-generated agency post.

Agency name: ${context.agencyName}

Agency type: ${context.agencyType}

Agency role profile:
${context.agencyRoleProfile}

Agency voice profile:
${context.agencyVoiceProfile}

Service area: ${[context.city, context.county, context.state].filter(Boolean).join(", ")}

Platform: Facebook

Approved recommendation:

${JSON.stringify(recommendation)}

Generated draft:

${JSON.stringify(draft)}

Compare every factual statement to the recommendation’s verified facts.
Check attribution, agency ownership, jurisdiction, role fit, resident usefulness, relationship quality, human voice, privacy, and operational safety.
Repair the post only when the necessary facts are already verified.
Return the required JSON only.`

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STAGE_3_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: STAGE_3_RESPONSE_FORMAT,
      max_tokens: 1600,
      temperature: 0.15,
    })
    const raw = completion.choices[0]?.message?.content
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = stage3DecisionSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }
    return { ok: true, data: parsed.data }
  } catch (error) {
    return {
      ok: false,
      reason: "openai_error",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}
