"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  Download,
  Copy,
  Check,
  Plus,
  X,
  FileText,
  Search,
  CheckCircle,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { track } from "@/lib/track"
import { PIOPreviewGate } from "@/components/pio-preview-gate"
import { downloadPressReleasePDF } from "@/lib/pdf-export"
import { addPioHistoryItem } from "@/lib/pio-history-store"
import Image from "next/image"

const incidentTypes = [
  "Burglary",
  "Theft",
  "Robbery",
  "Assault",
  "Fire",
  "Structure Fire",
  "Traffic Incident",
  "Vehicle Accident",
  "Officer-Involved Shooting",
  "Drug Seizure",
  "Missing Person",
  "Vandalism",
  "Domestic Dispute",
  "Suspicious Activity",
  "Other",
]

interface PersonEntry {
  id: string
  name: string
  isMinor: boolean
  description: string
}

interface ArrestEntry {
  id: string
  name: string
  details: string
}

export default function NewPressReleasePage() {
  const { settings: agencySettings } = useAgency()
  
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [incidentType, setIncidentType] = useState("")
  const [entryType, setEntryType] = useState("none")
  const [arrestsMade, setArrestsMade] = useState(false)
  const [requestAssistance, setRequestAssistance] = useState(false)
  const [investigationOngoing, setInvestigationOngoing] = useState(false)
  const [activeTab, setActiveTab] = useState("header")
  
  // Form fields - pre-filled from agency settings
  const [agencyName, setAgencyName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactPhone2, setContactPhone2] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  
  const [persons, setPersons] = useState<PersonEntry[]>([])
  const [arrests, setArrests] = useState<ArrestEntry[]>([])

  const [incidentSummary, setIncidentSummary] = useState("")
  const [incidentDate, setIncidentDate] = useState("")
  const [incidentTime, setIncidentTime] = useState("")
  const [location, setLocation] = useState("")
  const [propertyDamage, setPropertyDamage] = useState("")
  const [tipLine, setTipLine] = useState("")
  const [detectiveContact, setDetectiveContact] = useState("")
  const [resolutionText, setResolutionText] = useState("")

  const [requestFootage, setRequestFootage] = useState(false)
  const [footageTimeframe, setFootageTimeframe] = useState("")
  const [whatToLookFor, setWhatToLookFor] = useState("")

  const [generatedRelease, setGeneratedRelease] = useState("")
  const [generatedFacebook, setGeneratedFacebook] = useState("")
  const [generatedTwitter, setGeneratedTwitter] = useState("")
  const [generatedTalkingPoints, setGeneratedTalkingPoints] = useState("")
  const [generatedCommunityRequest, setGeneratedCommunityRequest] = useState<string | null>(null)
  const [previewTab, setPreviewTab] = useState("press-release")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Pre-fill from agency settings
  useEffect(() => {
    if (agencySettings.agencyName && !agencyName) setAgencyName(agencySettings.agencyName)
    if (agencySettings.city && !city) setCity(agencySettings.city)
    if (agencySettings.state && !state) setState(agencySettings.state)
    if (agencySettings.contactName && !contactName) setContactName(agencySettings.contactName)
    if (agencySettings.contactPhone && !contactPhone) setContactPhone(agencySettings.contactPhone)
    if (agencySettings.contactPhone2 && !contactPhone2) setContactPhone2(agencySettings.contactPhone2)
    if (agencySettings.contactEmail && !contactEmail) setContactEmail(agencySettings.contactEmail)
  }, [agencySettings])

  const handleEntryTypeChange = (value: string) => {
    setEntryType(value)
    if (value !== "none" && persons.length === 0) {
      setPersons([{ id: crypto.randomUUID(), name: "", isMinor: false, description: "" }])
    }
  }

  const addPerson = () => {
    setPersons([
      ...persons,
      { id: crypto.randomUUID(), name: "", isMinor: false, description: "" },
    ])
  }

  const removePerson = (id: string) => {
    setPersons(persons.filter((p) => p.id !== id))
  }

  const updatePerson = (id: string, field: keyof PersonEntry, value: string | boolean) => {
    setPersons(
      persons.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const addArrest = () => {
    setArrests([
      ...arrests,
      { id: crypto.randomUUID(), name: "", details: "" },
    ])
  }

  const removeArrest = (id: string) => {
    setArrests(arrests.filter((a) => a.id !== id))
  }

  const updateArrest = (id: string, field: keyof ArrestEntry, value: string) => {
    setArrests(
      arrests.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    )
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const displayAgency = agencyName || "Agency Name"
    const displayCity = city || "City Name"
    const displayState = state || "State"
    const displayContact = contactName || "Contact Name"
    const displayPhone = contactPhone || "Phone Number"
    const displayEmail = contactEmail || "Email Address"

    try {
      const res = await fetch("/api/pio/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: displayAgency,
          city: displayCity,
          state: displayState,
          incidentType: incidentType || "incident",
          incidentSummary: incidentSummary.trim() || undefined,
          incidentDate: incidentDate || undefined,
          incidentTime: incidentTime || undefined,
          location: location.trim() || undefined,
          investigationOngoing,
          persons: persons.map((p) => ({ name: p.name, isMinor: p.isMinor, description: p.description })),
          entryType,
          arrests: arrests.map((a) => ({ name: a.name, details: a.details })),
          propertyDamage: propertyDamage.trim() || undefined,
          tipLine: tipLine.trim() || undefined,
          detectiveContact: detectiveContact.trim() || undefined,
          resolutionText: resolutionText.trim() || undefined,
          boilerplate: agencySettings.boilerplate?.trim() || undefined,
          contactName: displayContact,
          contactPhone: displayPhone,
          contactPhone2: contactPhone2?.trim() || undefined,
          contactEmail: displayEmail,
          requestFootage,
          footageTimeframe: footageTimeframe.trim() || undefined,
          whatToLookFor: whatToLookFor.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.pressRelease) {
        setGeneratedRelease(data.pressRelease)
        setGeneratedFacebook(data.facebook || "")
        setGeneratedTwitter(data.twitter || "")
        setGeneratedTalkingPoints(data.talkingPoints || "")
        setGeneratedCommunityRequest(data.communityRequest || null)
        addPioHistoryItem({
          title: `${incidentType || "Incident"} - Press Release`,
          type: incidentType || "Incident",
          format: "Press Release",
          content: data.pressRelease,
        })
        setGenerated(true)
        setPreviewTab("press-release")
        setActiveTab("preview")
        track("pio_generate", { source: "multi_output" })
        setGenerating(false)
        return
      }
    } catch {
      // Fall through to template
    }

    const releaseText = `${displayAgency.toUpperCase()} PRESS RELEASE

${displayCity.toUpperCase()}, ${displayState.toUpperCase()} – ${incidentDate ? new Date(incidentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} – For Immediate Release

${displayAgency} is investigating a reported ${incidentType || "incident"}${location ? ` that occurred in ${location}` : ""}${incidentDate ? ` on ${new Date(incidentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}` : ""}${incidentTime ? ` at approximately ${incidentTime}` : ""}.

${incidentSummary ? `${incidentSummary.trim()}\n\n` : ""}${investigationOngoing ? "The investigation is ongoing. " : ""}Anyone with information regarding this incident is encouraged to contact ${displayAgency} at ${displayPhone} or submit an anonymous tip through Crime Stoppers.

${agencySettings.boilerplate ? `\n${agencySettings.boilerplate}\n` : ""}
Media Contact:
${displayContact}
${displayAgency}
Phone: ${displayPhone}${contactPhone2 ? `\nSecondary: ${contactPhone2}` : ""}
Email: ${displayEmail}`

    setGeneratedRelease(releaseText)
    setGeneratedFacebook("")
    setGeneratedTwitter("")
    setGeneratedTalkingPoints("")
    setGeneratedCommunityRequest(null)
    addPioHistoryItem({
      title: `${incidentType || "Incident"} - Press Release`,
      type: incidentType || "Incident",
      format: "Press Release",
      content: releaseText,
    })
    setGenerating(false)
    setGenerated(true)
    setPreviewTab("press-release")
    setActiveTab("preview")
    track("pio_generate", { source: "press_release" })
  }

  const handleCopyField = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedRelease)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setGenerated(false)
    setGeneratedRelease("")
    setGeneratedFacebook("")
    setGeneratedTwitter("")
    setGeneratedTalkingPoints("")
    setGeneratedCommunityRequest(null)
    setPersons([])
    setArrests([])
    setArrestsMade(false)
    setRequestAssistance(false)
    setInvestigationOngoing(false)
    setIncidentType("")
    setEntryType("none")
    setIncidentSummary("")
    setIncidentDate("")
    setIncidentTime("")
    setLocation("")
    setPropertyDamage("")
    setTipLine("")
    setDetectiveContact("")
    setResolutionText("")
    setRequestFootage(false)
    setFootageTimeframe("")
    setWhatToLookFor("")
    setPreviewTab("press-release")
    setActiveTab("header")
  }

  const handleExportPDF = async () => {
    const today = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    // Extract the main content from the generated release (between dateline and contact info)
    const contentMatch = generatedRelease.match(/(?:For Immediate Release\n\n)([\s\S]*?)(?=\n\n\*\*Media Contact)/i)
    const mainContent = contentMatch ? contentMatch[1].trim() : generatedRelease
    
    await downloadPressReleasePDF({
      agencyName: agencyName || "Agency Name",
      city: city || "City",
      state: state || "State",
      releaseDate: today,
      content: mainContent,
      contactName: contactName || "Contact Name",
      contactPhone: contactPhone || "Phone Number",
      contactPhone2: contactPhone2 || undefined,
      contactEmail: contactEmail || "email@agency.gov",
      logoUrl: agencySettings.logoUrl || undefined,
      boilerplate: agencySettings.boilerplate || undefined,
    })
  }

  return (
    <PIOPreviewGate>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Press Release</h1>
        <p className="text-muted-foreground">
          Fill in the details below. Press Center will generate a press release, Facebook post, X/Twitter post, talking points, and a community request (if selected)—review and edit before you export or share.
        </p>
      </div>

      {/* Form Section - Full Width */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="incident">Incident</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="preview" disabled={!generated}>
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Header Fields */}
        <TabsContent value="header" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Header Information</CardTitle>
              <CardDescription>
                Basic agency and release information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agency">Agency Name</Label>
                <Input
                  id="agency"
                  placeholder="Agency Name"
                  className="placeholder:text-muted-foreground/60"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City Name"
                    className="placeholder:text-muted-foreground/60"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    className="placeholder:text-muted-foreground/60"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date</Label>
                  <Input id="releaseDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case Number</Label>
                  <Input id="caseNumber" placeholder="Case Number" className="placeholder:text-muted-foreground/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incident Basics */}
        <TabsContent value="incident" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Basics</CardTitle>
              <CardDescription>
                Core details about the incident
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incidentType">Incident Type</Label>
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
                  <Label htmlFor="otherType">Specify Incident Type</Label>
                  <Input id="otherType" placeholder="Describe the incident type" className="placeholder:text-muted-foreground/60" />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="incidentTime">Incident Time</Label>
                  <Input
                    id="incidentTime"
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Exact Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. 1200 block of Main Street"
                  className="placeholder:text-muted-foreground/60"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Incident Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Provide a summary of what happened. The AI uses only these facts.
                </p>
                <Textarea
                  id="summary"
                  placeholder="Describe what happened..."
                  className="min-h-[200px] w-full resize-y placeholder:text-muted-foreground/60"
                  value={incidentSummary}
                  onChange={(e) => setIncidentSummary(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Section */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>People Involved</CardTitle>
              <CardDescription>
                Add suspects, victims, or missing persons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Entry Type</Label>
                <Select value={entryType} onValueChange={handleEntryTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select entry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="suspect">Suspect</SelectItem>
                    <SelectItem value="victim">Victim / Missing Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {entryType !== "none" && (
                <div className="space-y-4">
                  {persons.map((person) => (
                    <div
                      key={person.id}
                      className="rounded-lg border border-border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{entryType}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePerson(person.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Name (optional)</Label>
                        <Input
                          value={person.name}
                          onChange={(e) =>
                            updatePerson(person.id, "name", e.target.value)
                          }
                          placeholder="Name"
                          className="placeholder:text-muted-foreground/60"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`minor-${person.id}`}
                          checked={person.isMinor}
                          onCheckedChange={(checked) =>
                            updatePerson(person.id, "isMinor", checked as boolean)
                          }
                        />
                        <Label htmlFor={`minor-${person.id}`}>
                          Minor (do not release name)
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={person.description}
                          onChange={(e) =>
                            updatePerson(person.id, "description", e.target.value)
                          }
                          placeholder="Physical description or other details..."
                          rows={2}
                          className="placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPerson}
                    className="w-full bg-transparent"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add {entryType}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property & Damage</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe stolen items, damage, injuries, or other facts..."
                rows={3}
                className="placeholder:text-muted-foreground/60"
                value={propertyDamage}
                onChange={(e) => setPropertyDamage(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response & Status</CardTitle>
              <CardDescription>Select the current case status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Mutual Aid / Additional Agencies (optional)</Label>
                <Input placeholder="List any assisting agencies..." className="placeholder:text-muted-foreground/60" />
              </div>

              {/* Status Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ongoing Card */}
                <div
                  onClick={() => setInvestigationOngoing(true)}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    investigationOngoing
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      investigationOngoing ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Ongoing</p>
                      <p className="text-sm text-muted-foreground">Investigation in progress</p>
                    </div>
                  </div>
                </div>

                {/* Resolved Card */}
                <div
                  onClick={() => setInvestigationOngoing(false)}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    !investigationOngoing
                      ? "border-green-600 bg-green-50 ring-2 ring-green-600/20"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      !investigationOngoing ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Resolved</p>
                      <p className="text-sm text-muted-foreground">Case closed or cleared</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ongoing Details */}
              {investigationOngoing && (
                <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <p className="font-medium text-foreground">How can residents submit tips?</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Anonymous Tip Line</Label>
                      <Input
                        placeholder="e.g. 1-800-TIPS"
                        className="placeholder:text-muted-foreground/60 bg-background"
                        value={tipLine}
                        onChange={(e) => setTipLine(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Detective Contact</Label>
                      <Input
                        placeholder="e.g. Det. Smith (555) 123-4567"
                        className="placeholder:text-muted-foreground/60 bg-background"
                        value={detectiveContact}
                        onChange={(e) => setDetectiveContact(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Online Tip Submission (optional)</Label>
                    <Input
                      placeholder="e.g. www.agency.gov/tips"
                      className="placeholder:text-muted-foreground/60 bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Resolved Details */}
              {!investigationOngoing && (
                <div className="space-y-4 rounded-xl border border-green-600/30 bg-green-50 p-5">
                  <p className="font-medium text-foreground">How was this case resolved?</p>
                  <Textarea
                    placeholder="Describe the resolution (e.g. arrest made, suspect in custody, property recovered, charges filed, etc.)"
                    rows={3}
                    className="placeholder:text-muted-foreground/60 bg-background"
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community Video/Footage Request</CardTitle>
              <CardDescription>
                Check this if you want to ask the community for security camera footage or video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requestFootage"
                  checked={requestFootage}
                  onCheckedChange={(checked) => setRequestFootage(checked as boolean)}
                />
                <Label htmlFor="requestFootage" className="font-medium">
                  Request video footage from the community
                </Label>
              </div>
              {requestFootage && (
                <div className="space-y-4 rounded-xl border border-blue-500/30 bg-blue-50 p-5">
                  <div className="space-y-2">
                    <Label>Timeframe for footage</Label>
                    <Input
                      placeholder="e.g. Between 10pm Jan 5 and 2am Jan 6"
                      className="placeholder:text-muted-foreground/60 bg-background"
                      value={footageTimeframe}
                      onChange={(e) => setFootageTimeframe(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What to look for</Label>
                    <Textarea
                      placeholder="e.g. A dark-colored sedan, suspicious activity near driveways..."
                      rows={2}
                      className="placeholder:text-muted-foreground/60 bg-background"
                      value={whatToLookFor}
                      onChange={(e) => setWhatToLookFor(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Contact</CardTitle>
              <CardDescription>
                Who should the media contact for more information?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  placeholder="Contact Name"
                  className="placeholder:text-muted-foreground/60"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="Phone Number"
                    className="placeholder:text-muted-foreground/60"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2">Secondary Phone (optional)</Label>
                  <Input
                    id="phone2"
                    placeholder="Phone Number"
                    className="placeholder:text-muted-foreground/60"
                    value={contactPhone2}
                    onChange={(e) => setContactPhone2(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  className="placeholder:text-muted-foreground/60"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Content
              </CardTitle>
              <CardDescription>
                All outputs generated from your incident details. Review, edit, copy, or export each one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="flex flex-wrap gap-1 h-auto">
                  <TabsTrigger value="press-release" className="text-xs sm:text-sm">Press Release</TabsTrigger>
                  <TabsTrigger value="facebook" className="text-xs sm:text-sm">Facebook</TabsTrigger>
                  <TabsTrigger value="twitter" className="text-xs sm:text-sm">X / Twitter</TabsTrigger>
                  <TabsTrigger value="talking-points" className="text-xs sm:text-sm">Talking Points</TabsTrigger>
                  {generatedCommunityRequest && (
                    <TabsTrigger value="community-request" className="text-xs sm:text-sm">Community Request</TabsTrigger>
                  )}
                </TabsList>

                {/* Press Release */}
                <TabsContent value="press-release" className="mt-4">
                  <div className="rounded-lg border border-border bg-card p-6">
                    {agencySettings.logoUrl && (
                      <div className="mb-4">
                        <div className="relative h-16 w-16">
                          <Image
                            src={agencySettings.logoUrl || "/placeholder.svg"}
                            alt="Agency logo"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <textarea
                      value={generatedRelease}
                      onChange={(e) => setGeneratedRelease(e.target.value)}
                      className="w-full min-h-[400px] whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                      placeholder="Your generated press release will appear here..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="bg-transparent">
                      {copied ? <><Check className="mr-2 h-4 w-4" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy Text</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportPDF} className="bg-transparent">
                      <Download className="mr-2 h-4 w-4" />Export to PDF
                    </Button>
                  </div>
                </TabsContent>

                {/* Facebook */}
                <TabsContent value="facebook" className="mt-4">
                  <div className="rounded-lg border border-border bg-card p-6">
                    <textarea
                      value={generatedFacebook}
                      onChange={(e) => setGeneratedFacebook(e.target.value)}
                      className="w-full min-h-[200px] whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                      placeholder="Facebook post will appear here..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handleCopyField(generatedFacebook, "facebook")} className="bg-transparent">
                      {copiedField === "facebook" ? <><Check className="mr-2 h-4 w-4" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy Facebook Post</>}
                    </Button>
                  </div>
                </TabsContent>

                {/* X / Twitter */}
                <TabsContent value="twitter" className="mt-4">
                  <div className="rounded-lg border border-border bg-card p-6">
                    <textarea
                      value={generatedTwitter}
                      onChange={(e) => setGeneratedTwitter(e.target.value)}
                      className="w-full min-h-[100px] whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                      placeholder="X/Twitter post will appear here..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">{generatedTwitter.length} / 280 characters</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handleCopyField(generatedTwitter, "twitter")} className="bg-transparent">
                      {copiedField === "twitter" ? <><Check className="mr-2 h-4 w-4" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy X Post</>}
                    </Button>
                  </div>
                </TabsContent>

                {/* Talking Points */}
                <TabsContent value="talking-points" className="mt-4">
                  <div className="rounded-lg border border-border bg-card p-6">
                    <textarea
                      value={generatedTalkingPoints}
                      onChange={(e) => setGeneratedTalkingPoints(e.target.value)}
                      className="w-full min-h-[300px] whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                      placeholder="Talking points will appear here..."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handleCopyField(generatedTalkingPoints, "talking-points")} className="bg-transparent">
                      {copiedField === "talking-points" ? <><Check className="mr-2 h-4 w-4" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy Talking Points</>}
                    </Button>
                  </div>
                </TabsContent>

                {/* Community Request */}
                {generatedCommunityRequest && (
                  <TabsContent value="community-request" className="mt-4">
                    <div className="rounded-lg border border-border bg-card p-6">
                      <textarea
                        value={generatedCommunityRequest}
                        onChange={(e) => setGeneratedCommunityRequest(e.target.value)}
                        className="w-full min-h-[200px] whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
                        placeholder="Community footage request will appear here..."
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleCopyField(generatedCommunityRequest || "", "community-request")} className="bg-transparent">
                        {copiedField === "community-request" ? <><Check className="mr-2 h-4 w-4" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy Community Request</>}
                      </Button>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
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
              Generate All
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
