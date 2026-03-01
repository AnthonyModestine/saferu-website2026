import React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMembersList, getRevenueSummary } from "@/lib/admin-members"
import { MembersListClient } from "./members-list-client"

export default async function AdminMembersPage() {
  const [membersResult, revenueResult] = await Promise.all([
    getMembersList(),
    getRevenueSummary(),
  ])
  const revenueAvailable = revenueResult.error ? 0 : revenueResult.availableCents / 100
  const revenueTotal = revenueResult.error ? 0 : revenueResult.totalRevenueCents / 100
  const payingCount = membersResult.members.filter((m) => m.paid).length

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-gray-500">
            Anyone can become a member (free signup on the site); paying members have a Stripe subscription or payment. List includes both. No passwords or payment card details are stored or exported.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
            Open Stripe Dashboard
            <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {!membersResult.error && membersResult.total > 0 && (
        <div className="mb-6 flex gap-4">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
            <p className="text-sm text-gray-500">Members</p>
            <p className="text-xl font-bold text-gray-900">{membersResult.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
            <p className="text-sm text-gray-500">Paying members</p>
            <p className="text-xl font-bold text-emerald-700">{payingCount}</p>
          </div>
        </div>
      )}

      {revenueResult.error && (
        <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Revenue: {revenueResult.error}
        </p>
      )}
      {!revenueResult.error && (
        <div className="mb-6 flex gap-4">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
            <p className="text-sm text-gray-500">Available balance</p>
            <p className="text-xl font-bold text-gray-900">
              ${revenueAvailable.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
            <p className="text-sm text-gray-500">Total revenue (all time)</p>
            <p className="text-xl font-bold text-gray-900">
              ${revenueTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <MembersListClient
        initialMembers={membersResult.members}
        total={membersResult.total}
        error={membersResult.error}
      />
    </div>
  )
}
