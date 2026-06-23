/** Validate image uploads by magic bytes, not only Content-Type. */

const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP checked below
]

export function detectImageMime(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    if (buffer.length < sig.bytes.length) continue
    if (sig.bytes.every((b, i) => buffer[i] === b)) {
      if (sig.mime === "image/webp") {
        if (buffer.length >= 12 && buffer.toString("ascii", 8, 12) === "WEBP") {
          return "image/webp"
        }
        continue
      }
      return sig.mime
    }
  }
  return null
}

export function isAllowedImageBuffer(
  buffer: Buffer,
  allowedTypes: readonly string[]
): boolean {
  const mime = detectImageMime(buffer)
  return mime !== null && allowedTypes.includes(mime)
}
