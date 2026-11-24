import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

/** Minimal .env.local loader for eval scripts (does not override existing env). */
export function loadEnvLocal(rootDir: string): void {
  const file = path.join(rootDir, ".env.local")
  if (!existsSync(file)) return
  const text = readFileSync(file, "utf8")
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env) || !process.env[key]) {
      process.env[key] = val
    }
  }
}
