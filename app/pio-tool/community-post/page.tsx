"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  Trash2,
  Copy,
  Check,
  MessageSquare,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { addPioHistoryItem } from "@/lib/pio-history-store"
import { PIOPreviewGate } from "@/components/pio-preview-gate"
import { track } from "@/lib/track"

const incidentTypes = [
  "Burglary",
  "Robbery",
  "Theft",
  "Vehicle Break-In",
  "Carjacking",
  "Hit and Run",
  "Assault",
  "Shooting",
  "Suspicious Activity",
  "Missing Person",
  "Vandalism",
  "Package Theft",
  "Arson",
  "Structure Fire",
  "Vehicle Fire",
  "Fire Investigation",
  "Other",
]



export default function CommunityPostPage() {
  const { settings: agencySettings } = useAgency()

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("incident")

  // Incident fields
  const [incidentType, setIncidentType] = useState("")
  const [otherIncidentType, setOtherIncidentType] = useState("")
  const [address, setAddress] = useState("")
  const [incidentDate, setIncidentDate] = useState("")
  const [description, setDescription] = useState("")

  // Video footage fields
  const [footageTimeframe, setFootageTimeframe] = useState("")
  const [whatToLookFor, setWhatToLookFor] = useState("")

  // Contact / submission fields
  const [agencyName, setAgencyName] = useState("")
  const [contactDetails, setContactDetails] = useState("")
  const [caseNumber, setCaseNumber] = useState("")
  const [tipLine, setTipLine] = useState("")

  // Generated post
  const [generatedPost, setGeneratedPost] = useState("")

  // Pre-fill from agency settings
  useEffect(() => {
    if (agencySettings.agencyName && !agencyName) setAgencyName(agencySettings.agencyName)
    if (!contactDetails) {
      const parts: string[] = []
      if (agencySettings.contactName) parts.push(agencySettings.contactName)
      if (agencySettings.contactPhone) parts.push(agencySettings.contactPhone)
      if (agencySettings.contactEmail) parts.push(agencySettings.contactEmail)
      if (parts.length) setContactDetails(parts.join(" — "))
    }
  }, [agencySettings])

  const handleGenerate = async () => {
    setGenerating(true)
    const displayAgency = agencyName || "Agency Name"
    const displayIncident = incidentType === "other" ? otherIncidentType : incidentType || "incident"
    const displayAddress = address || "the area"
    const displayDate = incidentDate
      ? new Date(incidentDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "a recent date"
    const footageStr = footageTimeframe || "during the time of the incident"
    const lookForStr = whatToLookFor || "any activity related to this incident"
    const contactStr = contactDetails
      ? `Contact ${contactDetails}`
      : `Contact the ${displayAgency}`
    const caseStr = caseNumber ? ` Reference case #${caseNumber}.` : ""
    const tipStr = tipLine ? ` Anonymous tips can be submitted to ${tipLine}.` : ""

    try {
      const res = await fetch("/api/pio/generate-community-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: displayAgency,
          incidentType: incidentType || "incident",
          otherIncidentType: otherIncidentType?.trim() || undefined,
          address: address?.trim() || undefined,
          incidentDate: incidentDate || undefined,
          description: description?.trim() || undefined,
          footageTimeframe: footageTimeframe?.trim() || undefined,
          whatToLookFor: whatToLookFor?.trim() || undefined,
          contactDetails: contactDetails?.trim() || undefined,
          caseNumber: caseNumber?.trim() || undefined,
          tipLine: tipLine?.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.content) {
        setGeneratedPost(data.content)
        addPioHistoryItem({
          title: `${displayIncident || "Incident"} - Community Request`,
          type: displayIncident || "Incident",
          format: "Community Request",
          content: data.content,
        })
        setGenerating(false)
        setGenerated(true)
        setActiveTab("preview")
        track("pio_generate", { source: "community_post" })
        return
      }
    } catch {
      // Fall through to template
    }

    // Fallback template when AI is unavailable or fails
    const post = `${displayAgency.toUpperCase()} - REQUESTING COMMUNITY ASSISTANCE

The ${displayAgency} is investigating a ${displayIncident.toLowerCase()} that occurred on ${displayDate} in the area of ${displayAddress}.

${description ? `${description}\n\n` : ""}We are requesting video footage from residents and businesses in the area from ${footageStr}. We are looking for ${lookForStr}.

If you have video footage from a doorbell camera, security camera, or dashcam, please share it with us. ${contactStr}.${caseStr}${tipStr}

Do not approach any suspicious individuals. If you see something, call 911.`

    setGeneratedPost(post)
    addPioHistoryItem({
      title: `${displayIncident || "Incident"} - Community Request`,
      type: displayIncident || "Incident",
      format: "Community Request",
      content: post,
    })
    setGenerating(false)
    setGenerated(true)
    setActiveTab("preview")
    track("pio_generate", { source: "community_post" })
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setGenerated(false)
    setGeneratedPost("")
    setIncidentType("")
    setOtherIncidentType("")
    setAddress("")
    setIncidentDate("")
    setDescription("")
    setFootageTimeframe("")
    setWhatToLookFor("")
    setContactDetails("")
    setCaseNumber("")
    setTipLine("")
    setActiveTab("incident")
  }

  return (
    <PIOPreviewGate>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Request</h1>
        <p className="text-muted-foreground">
          Draft a direct message requesting video footage or community assistance. Use on Neighbors by Ring, social media, or your usual channels.
        </p>
      </div>

      {/* Form Section - Full Width */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="incident">Incident</TabsTrigger>
          <TabsTrigger value="footage">Footage</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generated}>
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Incident Tab */}
        <TabsContent value="incident" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
              <CardDescription>
                What happened and where. Exact addresses are never shared.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incidentType">Type of Incident</Label>
                <Select value={incidentType} onValueChange={setIncidentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {incidentType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="otherIncident">Specify Incident Type</Label>
                  <Input
                    id="otherIncident"
                    placeholder="Describe the incident type"
                    className="placeholder:text-muted-foreground/60"
                    value={otherIncidentType}
                    onChange={(e) => setOtherIncidentType(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., 1200 block of Main St"
                  className="placeholder:text-muted-foreground/60"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be generalized to protect privacy. Exact addresses are never shared.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentDate">Incident Date</Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Additional Details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional context about the incident..."
                  className="min-h-[120px] w-full resize-y placeholder:text-muted-foreground/60"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footage Tab */}
        <TabsContent value="footage" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Footage Request</CardTitle>
              <CardDescription>
                What timeframe and what should residents look for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footageTimeframe">Timeframe for Footage</Label>
                <Input
                  id="footageTimeframe"
                  placeholder="e.g., January 10 between 8:00 PM and 11:00 PM"
                  className="placeholder:text-muted-foreground/60"
                  value={footageTimeframe}
                  onChange={(e) => setFootageTimeframe(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The date and time range you need footage from
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatToLookFor">What Should Residents Look For</Label>
                <Textarea
                  id="whatToLookFor"
                  placeholder="e.g., dark colored sedan, two individuals on foot, person carrying a large bag..."
                  className="min-h-[150px] w-full resize-y placeholder:text-muted-foreground/60"
                  value={whatToLookFor}
                  onChange={(e) => setWhatToLookFor(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Never include private information such as full names, exact addresses, or victim details.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Submit Footage</CardTitle>
              <CardDescription>
                Where should residents send video footage or tips
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyNameField">Agency Name</Label>
                <Input
                  id="agencyNameField"
                  placeholder="Agency Name"
                  className="placeholder:text-muted-foreground/60"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactDetails">Who Should Residents Contact</Label>
                <Input
                  id="contactDetails"
                  placeholder="e.g. John Smith — 555-555-5555 — press@agency.gov"
                  className="placeholder:text-muted-foreground/60"
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case Number (optional)</Label>
                  <Input
                    id="caseNumber"
                    placeholder="e.g., 2026-001234"
                    className="placeholder:text-muted-foreground/60"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipLine">Anonymous Tip Line (optional)</Label>
                  <Input
                    id="tipLine"
                    placeholder="e.g., 1-800-TIPS"
                    className="placeholder:text-muted-foreground/60"
                    value={tipLine}
                    onChange={(e) => setTipLine(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Generated Community Request
              </CardTitle>
              <CardDescription>
                Switch platforms, edit if needed, and copy when ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <textarea
                  value={generatedPost}
                  onChange={(e) => setGeneratedPost(e.target.value)}
                  className="w-full min-h-[400px] whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                  placeholder="Your generated community request will appear here..."
                />
              </div>

              {/* Privacy reminder */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  <strong>Privacy reminder:</strong> This post uses general location information only. 
                  No exact addresses or victim names are included. Always review before posting.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="bg-transparent">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Text
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pb-8">
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-primary text-primary-foreground"
        >
          {generating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Post
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleClear} className="bg-transparent">
          <Trash2 className="mr-2 h-4 w-4" />
          Clear Form
        </Button>
      </div>
    </div>
    </PIOPreviewGate>
  )
}
