import { getTickets } from "@/lib/tickets-store"
import { TicketsListClient } from "./tickets-list-client"

export default async function AdminTicketsPage() {
  const tickets = await getTickets()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contact tickets</h1>
        <p className="mt-1 text-gray-500">
          Messages submitted from the Contact Us page. Reply to users via the email they provided. Filter by New or Replied, mark as replied when you’ve sent a message, or delete.
        </p>
      </div>

      <TicketsListClient tickets={tickets} />
    </div>
  )
}
