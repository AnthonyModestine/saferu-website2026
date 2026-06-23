import { EmailSetupClient } from "./email-setup-client"

export default function AdminEmailPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email setup</h1>
        <p className="mt-1 text-gray-500">
          Password reset and other transactional email goes through Resend.
        </p>
      </div>
      <EmailSetupClient />
    </div>
  )
}
