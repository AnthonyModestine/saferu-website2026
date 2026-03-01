import { NextResponse } from "next/server"
import { addTicket } from "@/lib/tickets-store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim() : ""
    const agency = typeof body.agency === "string" ? body.agency.trim() : undefined
    const topic = typeof body.topic === "string" ? body.topic.trim() : "general"
    const message = typeof body.message === "string" ? body.message.trim() : ""

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
