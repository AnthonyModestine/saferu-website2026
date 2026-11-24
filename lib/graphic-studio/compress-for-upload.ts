/** Shrink a graphic data URL so revise/save POSTs fit under Vercel body limits.
 * Prefer PNG when size allows to avoid lossy JPEG degradation of revised artwork.
 */

export type CompressGraphicOptions = {
  maxWidth?: number
  /** JPEG quality 0–1 when falling back to JPEG. */
  quality?: number
  /** Prefer PNG when encoded size stays under this many chars (data URL). */
  preferPngMaxChars?: number
}

export async function compressGraphicDataUrlForUpload(
  dataUrl: string,
  maxWidthOrOpts: number | CompressGraphicOptions = 1536,
  qualityArg = 0.82
): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl

  const opts: CompressGraphicOptions =
    typeof maxWidthOrOpts === "number"
      ? { maxWidth: maxWidthOrOpts, quality: qualityArg }
      : maxWidthOrOpts

  const maxWidth = opts.maxWidth ?? 1536
  const quality = opts.quality ?? 0.9
  const preferPngMaxChars = opts.preferPngMaxChars ?? 3_500_000

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.naturalWidth)
        const width = Math.max(1, Math.round(img.naturalWidth * scale))
        const height = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not prepare graphic for edit."))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)

        // Prefer PNG to avoid lossy recompression of revised graphics.
        const png = canvas.toDataURL("image/png")
        if (png.length <= preferPngMaxChars) {
          resolve(png)
          return
        }
        resolve(canvas.toDataURL("image/jpeg", quality))
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }
    img.onerror = () => reject(new Error("Could not read the current graphic."))
    img.src = dataUrl
  })
}
