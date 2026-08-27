import zlib from "node:zlib"

/** 16:9 landscape canvas for GPT Image multi-image edit (1536×1024). */
export const GRAPHIC_CANVAS_WIDTH = 1536
export const GRAPHIC_CANVAS_HEIGHT = 1024

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]!) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii")
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const combined = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(combined), 0)
  return Buffer.concat([len, combined, crc])
}

function setPixel(
  raw: Buffer,
  width: number,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number
) {
  if (x < 0 || y < 0 || x >= width) return
  const rowSize = 1 + width * 3
  const rowStart = y * rowSize
  if (rowStart >= raw.length) return
  const i = rowStart + 1 + x * 3
  raw[i] = r
  raw[i + 1] = g
  raw[i + 2] = b
}

/**
 * Layout-guide 16:9 PNG — substrate only.
 * Shows content safe area (left) and empty logo corner (bottom-right) for the model.
 */
export function createBlankLandscapeCanvas(): Buffer {
  const width = GRAPHIC_CANVAS_WIDTH
  const height = GRAPHIC_CANVAS_HEIGHT
  const rowSize = 1 + width * 3
  const raw = Buffer.alloc(rowSize * height)

  const marginX = Math.round(width * 0.18)
  const marginY = Math.round(height * 0.18)
  const textMaxX = Math.round(width * 0.48)
  const logoMinX = Math.round(width * 0.76)
  const logoMinY = Math.round(height * 0.78)

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize
    raw[rowStart] = 0
    for (let x = 0; x < width; x++) {
      let r = 228
      let g = 230
      let b = 235

      // Logo reserve — bottom-right
      if (x >= logoMinX && y >= logoMinY) {
        r = 210
        g = 214
        b = 222
      } else if (x >= marginX && x <= textMaxX && y >= marginY && y <= height - marginY) {
        // Text/content safe column — upper-left
        r = 245
        g = 246
        b = 248
      }

      const i = rowStart + 1 + x * 3
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
    }
  }

  // Subtle guide borders (will be painted over — layout hints only)
  for (let x = marginX; x <= textMaxX; x++) {
    setPixel(raw, width, x, marginY, 200, 204, 212)
    setPixel(raw, width, x, height - marginY, 200, 204, 212)
  }
  for (let y = marginY; y <= height - marginY; y++) {
    setPixel(raw, width, marginX, y, 200, 204, 212)
    setPixel(raw, width, textMaxX, y, 200, 204, 212)
  }
  for (let x = logoMinX; x < width; x++) {
    setPixel(raw, width, x, logoMinY, 190, 196, 206)
  }
  for (let y = logoMinY; y < height; y++) {
    setPixel(raw, width, logoMinX, y, 190, 196, 206)
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}
