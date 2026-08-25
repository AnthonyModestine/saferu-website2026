# Graphic Studio + Post Generator status

## Customer-facing now
- **Graphic Studio** at `/pio-tool/graphics`
  - Safety Graphic (`/pio-tool/graphics/safety-tip`)
    - Research brief first (`/api/pio/graphic-studio/safety-research`), user reviews copy, then image generation
    - Agency logo is passed as an OpenAI image input and placed bottom-right
    - No SaferU logo on customer-facing graphics
    - Guiding rule: teach one thing extremely well
  - Event Graphic (`/pio-tool/graphics/event`) — AI 16:9 flyer or simple template; agency logo only

## Hidden for later (not destroyed)
- AI Post Generator code remains under `lib/post-generator/` and `/pio-tool/ideas`
- Feature flag: `lib/press-center-features.ts` → `postGeneratorVisible: false`
- Visiting `/pio-tool/ideas` redirects to Graphic Studio while the flag is off
- To bring Post Generator back: set `postGeneratorVisible: true`
