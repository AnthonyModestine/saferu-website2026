import { NextResponse } from "next/server"
import { addTicket } from "@/lib/tickets-store"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // 5 contact submissions per IP per hour
  const ip = getClientIp(request)
  if (!checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : ""
    const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : ""
    const agency = typeof body.agency === "string" ? body.agency.trim().slice(0, 200) : undefined
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 100) : "general"
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 5000) : ""

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const { id } = await addTicket({ name, email, agency, topic, message })
    return NextResponse.json({ ok: true, id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
