import { getMemberFeedbackList } from "@/lib/member-feedback-store"
import { MemberFeedbackListClient } from "./member-feedback-list-client"

export const dynamic = "force-dynamic"

export default async function AdminMemberFeedbackPage() {
  const feedback = await getMemberFeedbackList()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Member feedback</h1>
        <p className="mt-1 text-gray-500">
          Responses from free members surveyed 20 days after signup. Use positive quotes on your
          website — always get permission before publishing names publicly.
        </p>
      </div>

      <MemberFeedbackListClient feedback={feedback} />
    </div>
  )
}
