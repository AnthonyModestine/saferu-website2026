import "server-only"

import { getSharp } from "@/lib/graphic-studio/sharp"
import {
  GRAPHIC_HEIGHT,
  GRAPHIC_WIDTH,
  LOGO_MARGIN_BOTTOM,
  LOGO_MARGIN_RIGHT,
  LOGO_MAX_HEIGHT,
  LOGO_MAX_WIDTH,
} from "@/lib/graphic-studio/constants"

export async function normalizeArtworkSize(artwork: Buffer): Promise<Buffer> {
  const sharp = await getSharp()
  const meta = await sharp(artwork).metadata()
  if (meta.width === GRAPHIC_WIDTH && meta.height === GRAPHIC_HEIGHT) {
    return artwork
  }
  return sharp(artwork)
    .resize(GRAPHIC_WIDTH, GRAPHIC_HEIGHT, { fit: "cover", position: "centre" })
    .png()
    .toBuffer()
}

export async function compositeAgencyLogo(
  artwork: Buffer,
  logo: Buffer
): Promise<Buffer> {
  const sharp = await getSharp()
  const normalized = await normalizeArtworkSize(artwork)

  const resizedLogo = await sharp(logo)
    .resize({
      width: LOGO_MAX_WIDTH,
      height: LOGO_MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer()

  const logoMeta = await sharp(resizedLogo).metadata()
  const logoW = logoMeta.width ?? LOGO_MAX_WIDTH
  const logoH = logoMeta.height ?? LOGO_MAX_HEIGHT

  const left = GRAPHIC_WIDTH - LOGO_MARGIN_RIGHT - logoW
  const top = GRAPHIC_HEIGHT - LOGO_MARGIN_BOTTOM - logoH

  return sharp(normalized)
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toBuffer()
}
