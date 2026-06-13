export type AiFailureReason =
  | "missing_api_key"
  | "openai_error"
  | "empty_response"
  | "invalid_json"
  | "empty_input"

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: AiFailureReason; detail?: string }

export function aiErrorMessage(reason: AiFailureReason): string {
  if (reason === "missing_api_key") {
    return "Press Center drafting is not configured on the server. Add OPENAI_API_KEY in Vercel and redeploy."
  }
  if (reason === "openai_error") {
    return "OpenAI returned an error. Check your API key, billing, and rate limits in the OpenAI dashboard, then try again."
  }
  if (reason === "empty_input") {
    return "Nothing to translate."
  }
  if (reason === "invalid_json" || reason === "empty_response") {
    return "Drafting returned an incomplete response. Please try again."
  }
  return "Drafting is temporarily unavailable. Please try again in a few minutes."
}

export function aiErrorPayload(reason: AiFailureReason, detail?: string) {
  return {
    error: aiErrorMessage(reason),
    code: reason,
    ...(process.env.NODE_ENV === "development" && detail ? { detail } : {}),
  }
}
