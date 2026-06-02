import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

try {
  const env = readFileSync(".env.local", "utf8")
  for (const line of env.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // no local env
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL
if (!url) {
  console.error("NO_DB_URL")
  process.exit(1)
}

const sql = neon(url)

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS cms_additions (
      id TEXT PRIMARY KEY DEFAULT 'singleton',
      data JSONB NOT NULL DEFAULT '{}'
    )
  `

  const rows = await sql`
    SELECT id, data, jsonb_typeof(data) AS t
    FROM cms_additions
    WHERE id = 'singleton'
  `
  console.log("ROW_COUNT:", rows.length)
  if (rows.length > 0) {
    const raw = rows[0].data
    console.log("RAW_TYPE:", typeof raw)
    console.log("JSONB_TYPEOF:", rows[0].t)
    const data = typeof raw === "string" ? JSON.parse(raw) : raw
    console.log("ARTICLE_COUNT:", Array.isArray(data?.articles) ? data.articles.length : "NOT_ARRAY")
    if (Array.isArray(data?.articles) && data.articles.length > 0) {
      console.log("LAST_ARTICLE:", JSON.stringify(data.articles[data.articles.length - 1]))
    }
  }

  const backup = rows[0]?.data ?? null

  const test = {
    subcategories: [],
    articles: [
      {
        categoryId: "crime-prevention",
        subcategoryId: "home-security",
        id: "test-roundtrip",
        title: "Test",
        description: "",
      },
    ],
    posts: [],
  }

  console.log("\n--- Test JSON.stringify + ::jsonb ---")
  await sql`
    INSERT INTO cms_additions (id, data)
    VALUES ('singleton', ${JSON.stringify(test)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `
  const afterStringify = await sql`SELECT data, jsonb_typeof(data) AS t FROM cms_additions WHERE id = 'singleton'`
  const raw1 = afterStringify[0].data
  const data1 = typeof raw1 === "string" ? JSON.parse(raw1) : raw1
  console.log("stringify write -> type:", typeof raw1, "jsonb:", afterStringify[0].t, "articles:", data1?.articles?.length)

  console.log("\n--- Test direct object ---")
  await sql`
    INSERT INTO cms_additions (id, data)
    VALUES ('singleton', ${test})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `
  const afterObject = await sql`SELECT data, jsonb_typeof(data) AS t FROM cms_additions WHERE id = 'singleton'`
  const raw2 = afterObject[0].data
  const data2 = typeof raw2 === "string" ? JSON.parse(raw2) : raw2
  console.log("object write -> type:", typeof raw2, "jsonb:", afterObject[0].t, "articles:", data2?.articles?.length)

  if (backup !== null) {
    await sql`
      INSERT INTO cms_additions (id, data)
      VALUES ('singleton', ${typeof backup === "string" ? backup : backup})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `
    console.log("\nRestored backup row")
  }
}

main().catch((e) => {
  console.error("ERR", e)
  process.exit(1)
})
