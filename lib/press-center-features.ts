/**
 * Press Center feature flags.
 *
 * AI Post Generator is preserved in the codebase for later work, but hidden
 * from customers until the briefing prompt and quality bar are ready again.
 */
export const PRESS_CENTER_FEATURES = {
  /** When false, hide /pio-tool/ideas from nav, dashboard, and marketing. */
  postGeneratorVisible: false,
  /** Graphic Studio: safety tips + event flyers. */
  graphicStudioVisible: true,
} as const

export const GRAPHIC_STUDIO_PATH = "/pio-tool/graphics"
export const POST_GENERATOR_PATH = "/pio-tool/ideas"
