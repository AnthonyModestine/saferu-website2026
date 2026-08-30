export const GRAPHIC_WIDTH = 2048
export const GRAPHIC_HEIGHT = 1152
export const GRAPHIC_SIZE = `${GRAPHIC_WIDTH}x${GRAPHIC_HEIGHT}` as const

export const LOGO_MAX_WIDTH = 260
export const LOGO_MAX_HEIGHT = 130
export const LOGO_MARGIN_RIGHT = 62
export const LOGO_MARGIN_BOTTOM = 48

export const MAX_GENERATION_ATTEMPTS = 3

export function researchModel(): string {
  return process.env.OPENAI_GRAPHIC_RESEARCH_MODEL?.trim() || "gpt-5.6"
}

export function imageModel(): string {
  return process.env.OPENAI_GRAPHIC_IMAGE_MODEL?.trim() || "gpt-image-2"
}

export function qaModel(): string {
  return process.env.OPENAI_GRAPHIC_QA_MODEL?.trim() || "gpt-4o-mini"
}
