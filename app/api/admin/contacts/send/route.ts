import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import { getContactsByIds, listContacts, type AdminContact } from "@/lib/contacts-store"
import { sendHtmlEmail } from "@/lib/send-reset-email"

export const maxDuration = 300

const MAX_RECIPIENTS = 500

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function personalize(template: string, contact: AdminContact): string {
  return template
    .replace(/\{\{\s*name\s*\}\}/gi, contact.name || "there")
    .replace(/\{\{\s*agency\s*\}\}/gi, contact.agency || "your agency")
    .replace(/\{\{\s*email\s*\}\}/gi, contact.email)
}

function toHtml(body: string): string {
  const paragraphs = escapeHtml(body)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 1em;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; line-height: 1.5; color: #1a365d;">
      ${paragraphs}
      <p style="margin-top:2em;font-size:13px;color:#666;">— SaferU</p>
    </div>
  `.trim()
}

export async function POST(request: Request) {
  const ok = await checkAdminSession()
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    const message = typeof body.message === "string" ? body.message.trim() : ""
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : null
    const sendAll = body.sendAll === true

    if (!subject || subject.length > 200) {
      return NextResponse.json({ error: "Subject is required (max 200 chars)" }, { status: 400 })
    }
    if (!message || message.length > 20000) {
      return NextResponse.json({ error: "Message is required (max 20,000 chars)" }, { status: 400 })
    }
    if (!sendAll && (!ids || ids.length === 0)) {
      return NextResponse.json({ error: "Select contacts or choose send all" }, { status: 400 })
    }

    const recipients = sendAll ? await listContacts() : await getContactsByIds(ids || [])
    if (recipients.length === 0) {
      return NextResponse.json({ error: "No contacts to email" }, { status: 400 })
    }
    if (recipients.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        {
          error: `Too many recipients (${recipients.length}). Max ${MAX_RECIPIENTS} per send. Narrow selection or export and use a bulk tool.`,
        },
        { status: 400 }
      )
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Sequential to stay within Resend rate limits
    for (const contact of recipients) {
      const personalized = personalize(message, contact)
      const result = await sendHtmlEmail({
        to: contact.email,
        subject: personalize(subject, contact),
        html: toHtml(personalized),
        text: `${personalized}\n\n— SaferU`,
      })
      if (result.ok) {
        sent += 1
      } else {
        failed += 1
        if (errors.length < 10) {
          errors.push(`${contact.email}: ${result.error || "failed"}`)
        }
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      sent,
      failed,
      total: recipients.length,
      errors,
    })
  } catch (err) {
    console.error("[admin/contacts/send]", err)
    return NextResponse.json({ error: "Send failed" }, { status: 500 })
  }
}
