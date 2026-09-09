/** Shrink a graphic data URL so revise POSTs fit under Vercel body limits. */
export async function compressGraphicDataUrlForUpload(
  dataUrl: string,
  maxWidth = 1536,
  quality = 0.82
): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl

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
        resolve(canvas.toDataURL("image/jpeg", quality))
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    }
    img.onerror = () => reject(new Error("Could not read the current graphic."))
    img.src = dataUrl
  })
}
