"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Save, Upload, Building2, X, CreditCard, ExternalLink } from "lucide-react"
import { useAgency, DEMO_AGENCY_LOGO_URL } from "@/lib/agency-context"
import { DEPARTMENT_TYPES, type SupportedDepartmentType } from "@/lib/department-types"
import { isLocalHostname } from "@/lib/local-preview"
import { useSubscription } from "@/lib/use-subscription"
import { useMemberSession } from "@/lib/use-member-session"
import Image from "next/image"
import Link from "next/link"

export default function AgencySettingsPage() {
  const { settings, updateSettings, persistSettings, locationReady, locationMissing } =
    useAgency()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { member, isLoading: sessionLoading } = useMemberSession()
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const isLoading = sessionLoading || subLoading
  const locked = !isSubscribed
  const isCityArea = settings.serviceAreaType === "city"
  const isCountyArea = settings.serviceAreaType === "county"
  const [genUsage, setGenUsage] = useState<{
    used: number
    quota: number
    packs: number
    remaining: number
  } | null>(null)

  useEffect(() => {
    if (!isSubscribed) return
    fetch("/api/pio/generations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.remaining !== undefined) setGenUsage(data)
      })
      .catch(() => {})
  }, [isSubscribed])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    const result = await persistSettings()
    setSaving(false)
    if (!result.ok) {
      setSaveError(result.error || "Could not save settings")
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        updateSettings({ logoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    updateSettings({ logoUrl: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1470AF] border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agency Settings</h1>
        <p className="text-muted-foreground">
          Set defaults for your press releases and video requests. These details auto-fill in Press Center so you can draft faster.
        </p>
      </div>

      {locked && (
        <div className="rounded-xl border border-[#1470AF]/20 bg-[#1470AF]/5 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-[#1a365d] text-lg">Get started with Press Center</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              $99/month. Confident communication for public safety — draft press releases and video requests in minutes without compromising oversight.
            </p>
          </div>
          <Button asChild className="shrink-0 bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold">
            <Link href="/pricing">Subscribe Now</Link>
          </Button>
        </div>
      )}

      <div className={locked ? "[&_input]:pointer-events-none [&_input]:opacity-50 [&_textarea]:pointer-events-none [&_textarea]:opacity-50 [&_select]:pointer-events-none [&_select]:opacity-50 [&_button:not([data-unlock])]:pointer-events-none [&_button:not([data-unlock])]:opacity-50" : ""}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agency Information
          </CardTitle>
          <CardDescription>
            These details will be used as defaults in your press releases and video requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency Name</Label>
            <Input
              id="agencyName"
              placeholder="Agency Name"
              className="placeholder:text-muted-foreground/60"
              value={settings.agencyName}
              onChange={(e) => updateSettings({ agencyName: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agencyType">Agency type</Label>
              <Select
                value={settings.agencyType}
                onValueChange={(value) =>
                  updateSettings({
                    agencyType: value as SupportedDepartmentType,
                    agencyTypeOther: "",
                  })
                }
              >
                <SelectTrigger id="agencyType" className="w-full">
                  <SelectValue placeholder="Choose agency type" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Shapes which Post Ideas are relevant for your agency — not only police topics.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-[#e2e8f5] bg-[#f8faff] p-4">
            <div>
              <p className="text-sm font-semibold text-[#0f1c3f]">Service area</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose how your agency covers the community. We use this to search the right area
                for Post Ideas.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serviceAreaType">Area type</Label>
                <Select
                  value={settings.serviceAreaType}
                  onValueChange={(value) =>
                    updateSettings({
                      serviceAreaType: value as "city" | "county" | "state",
                    })
                  }
                >
                  <SelectTrigger id="serviceAreaType" className="w-full bg-white">
                    <SelectValue placeholder="Choose coverage area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="city">City / township / borough</SelectItem>
                    <SelectItem value="county">County-wide</SelectItem>
                    <SelectItem value="state">Statewide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultState">State</Label>
                <Input
                  id="defaultState"
                  placeholder="e.g. PA"
                  className="placeholder:text-muted-foreground/60"
                  value={settings.state}
                  onChange={(e) => updateSettings({ state: e.target.value })}
                />
              </div>
            </div>

            {isCityArea && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultCity">City / township / borough</Label>
                  <Input
                    id="defaultCity"
                    placeholder="e.g. Lansdale"
                    className="placeholder:text-muted-foreground/60"
                    value={settings.city}
                    onChange={(e) => updateSettings({ city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceCounty">County (recommended)</Label>
                  <Input
                    id="serviceCounty"
                    placeholder="e.g. Montgomery County"
                    className="placeholder:text-muted-foreground/60"
                    value={settings.county}
                    onChange={(e) => updateSettings({ county: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional, but helps when city names appear in more than one county.
                  </p>
                </div>
              </div>
            )}

            {isCountyArea && (
              <div className="space-y-2">
                <Label htmlFor="serviceCounty">County</Label>
                <Input
                  id="serviceCounty"
                  placeholder="e.g. Montgomery County"
                  className="placeholder:text-muted-foreground/60"
                  value={settings.county}
                  onChange={(e) => updateSettings({ county: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="serviceZips">Service ZIP codes</Label>
              <Input
                id="serviceZips"
                placeholder="e.g. 19446, 19454"
                className="placeholder:text-muted-foreground/60"
                value={settings.serviceZips}
                onChange={(e) => updateSettings({ serviceZips: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                One or more ZIP codes in your primary service area, separated by commas. Used for
                weather alerts and local source matching in the Post Generator.
              </p>
            </div>

          </div>

          <div className="space-y-2">
            <Label htmlFor="boilerplate">Default Boilerplate Paragraph</Label>
            <Textarea
              id="boilerplate"
              placeholder="Add a standard paragraph to include at the end of press releases and video requests..."
              className="placeholder:text-muted-foreground/60"
              rows={4}
              value={settings.boilerplate}
              onChange={(e) => updateSettings({ boilerplate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This paragraph will be automatically added to the end of your press releases and video requests.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agency Logo</CardTitle>
          <CardDescription>
            Upload your agency logo. The downloaded PDF includes a finalized version of your press release with your agency's logo on it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
              {settings.logoUrl ? (
                <>
                  <Image
                    src={settings.logoUrl || "/placeholder.svg"}
                    alt="Agency logo"
                    fill
                    className="object-contain p-1"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG or JPG, max 2MB. Recommended size: 200x200px
              </p>
              {typeof window !== "undefined" &&
                isLocalHostname(window.location.hostname) &&
                settings.logoUrl === DEMO_AGENCY_LOGO_URL && (
                  <p className="text-xs text-[#2563EB]">
                    Demo badge loaded for localhost testing. Upload your own logo to replace it.
                  </p>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Contact Information</CardTitle>
          <CardDescription>
            Pre-fill contact details for media inquiries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name / Title</Label>
            <Input
              id="contactName"
              placeholder="Contact Name"
              className="placeholder:text-muted-foreground/60"
              value={settings.contactName}
              onChange={(e) => updateSettings({ contactName: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                placeholder="Phone Number"
                className="placeholder:text-muted-foreground/60"
                value={settings.contactPhone}
                onChange={(e) => updateSettings({ contactPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone2">Secondary Phone (optional)</Label>
              <Input
                id="contactPhone2"
                placeholder="Phone Number"
                className="placeholder:text-muted-foreground/60"
                value={settings.contactPhone2}
                onChange={(e) => updateSettings({ contactPhone2: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="Email Address"
              className="placeholder:text-muted-foreground/60"
              value={settings.contactEmail}
              onChange={(e) => updateSettings({ contactEmail: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription, payment methods, and billing history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <p className="font-medium text-foreground">Press Center Pro</p>
              <p className="text-sm text-muted-foreground">Monthly subscription - $99/month</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Use the Stripe Customer Portal to update payment methods, view invoices, or cancel your subscription.
          </p>
          {isSubscribed && genUsage && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">AI generations this month</p>
              <p>
                {genUsage.used} of {genUsage.quota} included generations used
                {genUsage.packs > 0 ? ` · ${genUsage.packs} extra from packs` : ""}
              </p>
              <p className="text-xs">Included generations reset at the start of each calendar month.</p>
            </div>
          )}
          <Button
            variant="outline"
            className="bg-transparent"
            onClick={() => {
              // In production, this would call createCustomerPortalSession with the user's Stripe customer ID
              // For now, show a placeholder
              window.open('https://billing.stripe.com/p/login/test', '_blank')
            }}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Manage Billing
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => void handleSave()}
          disabled={saving || locked}
          className="bg-primary text-primary-foreground"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
        </Button>
        {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
        {!locationReady && locationMissing.length > 0 ? (
          <p className="text-sm text-[#92400e]">
            Post Generator still needs: {locationMissing.join(", ")}.
          </p>
        ) : null}
      </div>
      </div>
    </div>
  )
}
