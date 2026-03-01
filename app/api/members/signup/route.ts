import { NextResponse } from "next/server"
import { addFreeMember } from "@/lib/members-store"
import { recordEvent } from "@/lib/metrics"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : ""
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : ""
    const agency = typeof body.agency === "string" ? body.agency.trim() : undefined
    const password = typeof body.password === "string" ? body.password : undefined

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password is required (min 8 characters)" }, { status: 400 })
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
