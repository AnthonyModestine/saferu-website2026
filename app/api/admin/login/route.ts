import { NextResponse } from "next/server"
import { verifyAdminPassword } from "@/lib/admin-auth"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    if (!identifier || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const isValid = await verifyAdminPassword(identifier, password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
