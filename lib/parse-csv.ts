/**
 * Minimal CSV parser (quoted fields, commas, newlines).
 * Enough for admin contact imports — no external dependency.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  const input = text.replace(/^\uFEFF/, "")

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(field.trim())
      field = ""
    } else if (ch === "\n") {
      row.push(field.trim())
      field = ""
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
    } else if (ch === "\r") {
      // ignore; handle \r\n via \n
    } else {
      field += ch
    }
  }

  row.push(field.trim())
  if (row.some((cell) => cell.length > 0)) rows.push(row)
  return rows
}

export function csvRowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {}
    headers.forEach((header, i) => {
      if (!header) return
      obj[header] = (cells[i] || "").trim()
    })
    return obj
  })
}

const EMAIL_KEYS = ["email", "e-mail", "email address", "emailaddress", "mail"]
const NAME_KEYS = ["name", "full name", "fullname", "contact", "contact name"]
const AGENCY_KEYS = ["agency", "organization", "organisation", "org", "department", "dept"]
const NOTES_KEYS = ["notes", "note", "comments", "comment"]

function pick(obj: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (obj[key]) return obj[key]
  }
  return ""
}

export function mapContactCsvRow(obj: Record<string, string>): {
  email: string
  name: string
  agency: string
  notes: string
} {
  return {
    email: pick(obj, EMAIL_KEYS),
    name: pick(obj, NAME_KEYS),
    agency: pick(obj, AGENCY_KEYS),
    notes: pick(obj, NOTES_KEYS),
  }
}
