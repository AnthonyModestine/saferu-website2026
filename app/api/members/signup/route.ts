import { NextResponse } from "next/server"
import { addFreeMember } from "@/lib/members-store"
import { recordEvent } from "@/lib/metrics"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // 5 signups per IP per hour to prevent account farming
  const ip = getClientIp(request)
  if (!checkRateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : ""
    const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 100) : ""
    const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 100) : ""
    const agency = typeof body.agency === "string" ? body.agency.trim().slice(0, 200) : undefined
    const password = typeof body.password === "string" ? body.password : undefined

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password is required (min 8 characters)" }, { status: 400 })
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password too long" }, { status: 400 })
    }

    const name = [firstName, lastName].filter(Boolean).join(" ") || email
    const result = await addFreeMember({ email, name, agency, password })

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    recordEvent({ event: "signup" })
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
