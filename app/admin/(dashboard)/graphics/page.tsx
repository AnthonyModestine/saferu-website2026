import { listGraphicsForAdmin } from "@/lib/graphic-studio-store"
import { AdminGraphicsListClient } from "./graphics-list-client"

export const dynamic = "force-dynamic"

export default async function AdminGraphicsPage() {
  const graphics = await listGraphicsForAdmin(200)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Graphic Studio</h1>
        <p className="mt-1 text-gray-500">
          Copies of graphics agencies created in Press Center, including thumbs-up / thumbs-down
          feedback.
        </p>
      </div>
      <AdminGraphicsListClient graphics={graphics} />
    </div>
  )
}
