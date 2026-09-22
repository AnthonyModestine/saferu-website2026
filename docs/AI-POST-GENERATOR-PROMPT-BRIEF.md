# SaferU AI Post Generator — Prompt (reset)

**Status:** The OpenAI briefing prompt has been cleared. The AI Post Generator does **not** call OpenAI until a new prompt is written.

## Where to add the new prompt

| Piece | File |
|-------|------|
| Enable OpenAI again | `lib/post-generator/tomorrow-briefing-prompt.ts` → set `TOMORROW_BRIEFING_PROMPT_ENABLED = true` |
| System prompt | `buildTomorrowBriefingPrompt()` in same file |
| User message | `buildTomorrowBriefingUserMessage()` in same file |
| Parser (markdown → cards) | `lib/post-generator/tomorrow-briefing-parse.ts` |
| OpenAI call | `lib/post-generator/tomorrow-briefing.ts` |
| API route | `app/api/pio/post-opportunities/route.ts` |

## Product context for rewriting

See prior notes in git history and `docs/SAFERU-STEERING.md` for who SaferU serves and what the Ideas page should do.

## Current behavior while prompt is empty

1. `runTomorrowBriefing()` returns zero live recommendations (no OpenAI request).
2. The engine may still surface **SaferU curated library** content as fallback cards.
3. Parser, verification gates, and card UI remain in place for when the new prompt is wired up.
