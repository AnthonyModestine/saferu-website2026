# Graphic Studio + Post Generator status

## Customer-facing now
- **Graphic Studio** at `/pio-tool/graphics`
  - Safety Tip (`/pio-tool/graphics/safety-tip`)
    - Research-first copy + OpenAI image generation (`lib/pio-graphic-studio-ai.ts`)
    - Client stamps exact SaferU logo bottom-left and agency logo bottom-right (`compositeSafetyTipLogos`)
    - Guiding rule: teach one thing extremely well
  - Event (`/pio-tool/graphics/event`) — agency logo only; optional background image

## Hidden for later (not destroyed)
- AI Post Generator code remains under `lib/post-generator/` and `/pio-tool/ideas`
- Feature flag: `lib/press-center-features.ts` → `postGeneratorVisible: false`
- Visiting `/pio-tool/ideas` redirects to Graphic Studio while the flag is off
- To bring Post Generator back: set `postGeneratorVisible: true`
