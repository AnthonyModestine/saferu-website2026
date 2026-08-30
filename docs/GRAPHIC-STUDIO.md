# Graphic Studio

Safety graphics for Press Center agencies.

## Flow

1. **Prepare message** — `POST /api/pio/graphic-studio/prepare-message`  
   GPT-5.6 (Responses API + web search) researches the topic and returns headline, message, visual concept.

2. **User review** — edit headline and on-graphic message in the UI.

3. **Generate** — `POST /api/pio/graphic-studio/generate`  
   GPT Image 2 creates 2048×1152 artwork (logo as reference when available). Sharp composites the original agency logo bottom-right. Optional vision QA before display.

## Models (env overrides)

| Variable | Default |
|----------|---------|
| `OPENAI_GRAPHIC_RESEARCH_MODEL` | `gpt-5.6` |
| `OPENAI_GRAPHIC_IMAGE_MODEL` | `gpt-image-2` |
| `OPENAI_GRAPHIC_QA_MODEL` | `gpt-4o-mini` |

## Code layout

```
lib/graphic-studio/
  constants.ts      — dimensions, logo box, model names
  prompts.ts        — research + image prompts
  schemas.ts        — Zod + JSON schemas
  research.ts       — Responses API research step
  generate-image.ts   — GPT Image 2 generate/edit
  logo-assets.ts    — load logo, blank canvas
  logo-composite.ts — Sharp compositing (unaltered logo)
  qa.ts             — optional vision QA
  generate.ts       — orchestrator
  api-auth.ts       — session + rate limits

lib/graphic-studio-store.ts — logo resolve + generation log
```

## Logo rules

- AI sees logo as reference only — does not draw it
- Original logo file composited programmatically after generation
- Bottom-right, ~220–260px wide max, preserved aspect ratio
- No SaferU branding on public output
