import "server-only"

type SharpModule = typeof import("sharp")

let sharpModule: SharpModule["default"] | null = null

export async function getSharp() {
  if (!sharpModule) {
    const mod = await import("sharp")
    sharpModule = mod.default
  }
  return sharpModule
}
