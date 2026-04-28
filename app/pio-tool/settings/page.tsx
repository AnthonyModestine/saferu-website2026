"use client"

import React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Upload, Building2, X, CreditCard, ExternalLink } from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import Image from "next/image"

export default function AgencySettingsPage() {
  const { settings, updateSettings } = useAgency()
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agency Settings</h1>
        <p className="text-muted-foreground">
          Set defaults for your press releases and community requests. These details auto-fill in Press Center so you can draft faster.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agency Information
          </CardTitle>
          <CardDescription>
            These details will be used as defaults in your press releases and community requests.
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
              <Label htmlFor="defaultCity">Default City</Label>
              <Input
                id="defaultCity"
                placeholder="City Name"
                className="placeholder:text-muted-foreground/60"
                value={settings.city}
                onChange={(e) => updateSettings({ city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultState">Default State</Label>
              <Input
                id="defaultState"
                placeholder="State"
                className="placeholder:text-muted-foreground/60"
                value={settings.state}
                onChange={(e) => updateSettings({ state: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boilerplate">Default Boilerplate Paragraph</Label>
            <Textarea
              id="boilerplate"
              placeholder="Add a standard paragraph to include at the end of press releases and community requests..."
              className="placeholder:text-muted-foreground/60"
              rows={4}
              value={settings.boilerplate}
              onChange={(e) => updateSettings({ boilerplate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              This paragraph will be automatically added to the end of your press releases and community requests.
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
              <p className="text-sm text-muted-foreground">Monthly subscription - $30/month</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Use the Stripe Customer Portal to update payment methods, view invoices, or cancel your subscription.
          </p>
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
        <Button onClick={handleSave} className="bg-primary text-primary-foreground">
          <Save className="mr-2 h-4 w-4" />
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
