import { NextResponse } from "next/server"
import { addTicket } from "@/lib/tickets-store"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { getMemberSession } from "@/lib/member-session"

export async function POST(request: Request) {
  // 5 volunteer pricing requests per IP per hour
  const ip = getClientIp(request)
  if (!checkRateLimit(`volunteer-pricing:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
  }

  const session = await getMemberSession()
  if (!session?.email) {
    return NextResponse.json({ error: "You must be signed in to submit this request." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const departmentName = typeof body.departmentName === "string" ? body.departmentName.trim().slice(0, 200) : ""
    const city = typeof body.city === "string" ? body.city.trim().slice(0, 100) : ""
    const state = typeof body.state === "string" ? body.state.trim().slice(0, 100) : ""
    const departmentType = typeof body.departmentType === "string" ? body.departmentType.trim().slice(0, 100) : ""
    const applicantName = typeof body.applicantName === "string" ? body.applicantName.trim().slice(0, 100) : ""
    const applicantRole = typeof body.applicantRole === "string" ? body.applicantRole.trim().slice(0, 100) : ""
    const website = typeof body.website === "string" ? body.website.trim().slice(0, 300) : ""
    const additionalInfo = typeof body.additionalInfo === "string" ? body.additionalInfo.trim().slice(0, 2000) : ""
    const confirmed = body.confirmed === true

    if (!departmentName || !city || !state || !departmentType || !applicantName || !applicantRole || !website) {
      return NextResponse.json({ error: "Please fill out all required fields." }, { status: 400 })
    }
    if (!confirmed) {
      return NextResponse.json(
        { error: "Please confirm the agency operates primarily with volunteer personnel." },
        { status: 400 },
      )
    }

    const message = [
      `Volunteer agency pricing request`,
      ``,
      `Department: ${departmentName}`,
      `Location: ${city}, ${state}`,
      `Department type: ${departmentType}`,
      `Applicant: ${applicantName} (${applicantRole})`,
      `Website / public agency page: ${website}`,
      additionalInfo ? `Additional information: ${additionalInfo}` : ``,
    ]
      .filter(Boolean)
      .join("\n")

    const { id } = await addTicket({
      name: applicantName,
      email: session.email,
      agency: departmentName,
      topic: "volunteer-pricing",
      message,
    })
    return NextResponse.json({ ok: true, id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
