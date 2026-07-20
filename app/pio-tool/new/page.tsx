"use client"

import { useState, useEffect, useRef } from "react"
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
  Loader2,
  Trash2,
  Download,
  Copy,
  Check,
  Plus,
  X,
  FileText,
  Languages,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { track } from "@/lib/track"
import { trackPioAction } from "@/lib/pio-analytics-client"
import type { GenerationActionType } from "@/lib/pio-analytics"
import { GenerationFeedback } from "@/components/pio/generation-feedback"
import { PIOPreviewGate } from "@/components/pio-preview-gate"
import { GenerationLimitModal } from "@/components/generation-limit-modal"
import { VideoRequestGuidelinesNote } from "@/components/pio/video-request-guidelines-note"
import {
  PioFormPanel,
  PioPageHeader,
  PioSectionTitle,
  PioStepFooter,
  PioStepper,
} from "@/components/pio/pio-form-shell"
import { downloadPressReleasePDF } from "@/lib/pdf-export"
import { addPioHistoryItem } from "@/lib/pio-history-store"
import Image from "next/image"

import {
  DEFAULT_MULTI_OUTPUT_SELECTION,
  selectionHasAny,
  type MultiOutputSelection,
} from "@/lib/multi-output-ai"
import { PIO_INCIDENT_TYPES, incidentTypeToValue } from "@/lib/pio-incident-types"
import { validatePressReleaseInput } from "@/lib/pio-generate-validation"

const STEPS = [
  { id: "header", label: "Header" },
  { id: "incident", label: "Incident" },
  { id: "details", label: "Details" },
  { id: "contact", label: "Contact" },
  { id: "outputs", label: "Messages" },
  { id: "preview", label: "Review" },
] as const

type StepId = (typeof STEPS)[number]["id"]

type OutputKey = "pressRelease" | "facebook" | "twitter" | "talkingPoints" | "videoRequest"

const OUTPUT_OPTIONS: Array<{
  id: OutputKey
  label: string
  hint: string
}> = [
  {
    id: "pressRelease",
    label: "Press Release",
    hint: "Full release for media",
  },
  {
    id: "facebook",
    label: "Facebook Post",
    hint: "Short community post",
  },
  {
    id: "twitter",
    label: "X Post",
    hint: "Under 280 characters",
  },
  {
    id: "talkingPoints",
    label: "Talking Points",
    hint: "Quick bullets for briefings",
  },
  {
    id: "videoRequest",
    label: "Public Assistance Request",
    hint: "Ask for witnesses, information, or footage",
  },
]

const incidentTypes = PIO_INCIDENT_TYPES

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
  const [showGenLimitModal, setShowGenLimitModal] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [incidentType, setIncidentType] = useState("")
  const [entryType, setEntryType] = useState("none")
  const [arrestsMade, setArrestsMade] = useState(false)
  const [requestAssistance, setRequestAssistance] = useState(false)
  const [investigationOngoing, setInvestigationOngoing] = useState(true)
  const [activeTab, setActiveTab] = useState<StepId>("header")
  
  // Form fields - pre-filled from agency settings
  const [agencyName, setAgencyName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactPhone2, setContactPhone2] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [releaseDate, setReleaseDate] = useState("")
  const [caseNumber, setCaseNumber] = useState("")
  const [otherIncidentType, setOtherIncidentType] = useState("")
  const [mutualAid, setMutualAid] = useState("")
  const [onlineTipsUrl, setOnlineTipsUrl] = useState("")
  
  const [persons, setPersons] = useState<PersonEntry[]>([])
  const [arrests, setArrests] = useState<ArrestEntry[]>([])

  const [incidentSummary, setIncidentSummary] = useState("")
  const [incidentDate, setIncidentDate] = useState("")
  const [incidentTime, setIncidentTime] = useState("")
  const [location, setLocation] = useState("")
  const [tipLine, setTipLine] = useState("")
  const [detectiveName, setDetectiveName] = useState("")
  const [detectiveEmail, setDetectiveEmail] = useState("")
  const [detectivePhone, setDetectivePhone] = useState("")
  const [resolutionText, setResolutionText] = useState("")

  const [requestFootage, setRequestFootage] = useState(false)
  const [footageFromDate, setFootageFromDate] = useState("")
  const [footageFromTime, setFootageFromTime] = useState("")
  const [footageToDate, setFootageToDate] = useState("")
  const [footageToTime, setFootageToTime] = useState("")
  const [whatToLookFor, setWhatToLookFor] = useState("")

  const [generatedRelease, setGeneratedRelease] = useState("")
  const [generatedFacebook, setGeneratedFacebook] = useState("")
  const [generatedFacebookSpanish, setGeneratedFacebookSpanish] = useState("")
  const [facebookLangView, setFacebookLangView] = useState<"en" | "es">("en")
  const [translatingFacebook, setTranslatingFacebook] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [generatedTwitter, setGeneratedTwitter] = useState("")
  const [generatedTalkingPoints, setGeneratedTalkingPoints] = useState("")
  const [generatedCommunityRequest, setGeneratedCommunityRequest] = useState<string | null>(null)
  const [generatedCommunityRequestSpanish, setGeneratedCommunityRequestSpanish] = useState("")
  const [qualityStatus, setQualityStatus] = useState<
    "approved" | "approved_with_revisions" | "needs_human_review" | null
  >(null)
  const [statusLabel, setStatusLabel] = useState("Draft")
  const [detailsToVerify, setDetailsToVerify] = useState<string[]>([])
  const [humanReviewReason, setHumanReviewReason] = useState("")
  const [communityRequestLangView, setCommunityRequestLangView] = useState<"en" | "es">("en")
  const [translatingCommunityRequest, setTranslatingCommunityRequest] = useState(false)
  const [includesVideoRequest, setIncludesVideoRequest] = useState(false)
  const [selectedOutputs, setSelectedOutputs] = useState<MultiOutputSelection>({
    ...DEFAULT_MULTI_OUTPUT_SELECTION,
  })
  const [pressReleaseSessionId, setPressReleaseSessionId] = useState<string | null>(null)
  const [videoRequestSessionId, setVideoRequestSessionId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [previewTab, setPreviewTab] = useState("press-release")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const didPrefill = useRef(false)

  // Pre-fill empty fields once from agency settings (never overwrite user input).
  useEffect(() => {
    if (didPrefill.current) return
    const hasStored =
      agencySettings.agencyName ||
      agencySettings.city ||
      agencySettings.state ||
      agencySettings.contactName ||
      agencySettings.contactPhone ||
      agencySettings.contactEmail
    if (!hasStored) return
    didPrefill.current = true
    setAgencyName((prev) => prev || agencySettings.agencyName)
    setCity((prev) => prev || agencySettings.city)
    setState((prev) => prev || agencySettings.state)
    setContactName((prev) => prev || agencySettings.contactName)
    setContactPhone((prev) => prev || agencySettings.contactPhone)
    setContactPhone2((prev) => prev || agencySettings.contactPhone2)
    setContactEmail((prev) => prev || agencySettings.contactEmail)
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

  function formatDateTimeLabel(date: string, time: string): string {
    if (!date) return ""
    const iso = time ? `${date}T${time}:00` : `${date}T00:00:00`
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) {
      return [date, time].filter(Boolean).join(" ")
    }
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(time ? { hour: "numeric", minute: "2-digit" } : {}),
    })
  }

  function buildFootageTimeframe(): string {
    const from = formatDateTimeLabel(footageFromDate, footageFromTime)
    const to = formatDateTimeLabel(footageToDate, footageToTime)
    if (from && to) return `${from} to ${to}`
    return from || to || ""
  }

  function buildDetectiveContact(): string {
    return [detectiveName.trim(), detectivePhone.trim(), detectiveEmail.trim()]
      .filter(Boolean)
      .join(" — ")
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)

    if (!selectionHasAny(selectedOutputs)) {
      setGenerateError("Select at least one message type to generate.")
      setActiveTab("outputs")
      setGenerating(false)
      return
    }

    const validationError = validatePressReleaseInput({
      incidentType,
      incidentSummary,
      otherIncidentType,
    })
    if (validationError) {
      setGenerateError(validationError)
      setGenerating(false)
      return
    }

    try {
      const res = await fetch("/api/pio/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          city: city.trim(),
          state: state.trim(),
          incidentType: incidentType === "other" ? "other" : incidentType,
          otherIncidentType: incidentType === "other" ? otherIncidentType.trim() : undefined,
          incidentSummary: incidentSummary.trim(),
          incidentDate: incidentDate || undefined,
          releaseDate: releaseDate || undefined,
          incidentTime: incidentTime || undefined,
          location: location.trim() || undefined,
          investigationOngoing,
          persons: persons.map((p) => ({ name: p.name, isMinor: p.isMinor, description: p.description })),
          entryType,
          arrests: arrests.map((a) => ({ name: a.name, details: a.details })),
          tipLine: tipLine.trim() || undefined,
          detectiveContact: buildDetectiveContact() || undefined,
          resolutionText: resolutionText.trim() || undefined,
          boilerplate: agencySettings.boilerplate?.trim() || undefined,
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          contactPhone2: contactPhone2?.trim() || undefined,
          contactEmail: contactEmail.trim(),
          requestFootage:
            selectedOutputs.videoRequest ||
            investigationOngoing ||
            Boolean(buildFootageTimeframe() || whatToLookFor.trim()),
          footageTimeframe: buildFootageTimeframe() || undefined,
          whatToLookFor: whatToLookFor.trim() || undefined,
          onlineTipsUrl: onlineTipsUrl.trim() || undefined,
          caseNumber: caseNumber.trim() || undefined,
          agencyType: agencySettings.agencyType,
          departmentType: agencySettings.agencyType,
          departmentOther:
            agencySettings.agencyType === "other"
              ? agencySettings.agencyTypeOther.trim() || undefined
              : undefined,
          outputs: selectedOutputs,
        }),
      })
      const data = await res.json()
      if (
        res.ok &&
        (data.qualityStatus ||
          data.pressRelease ||
          data.facebook ||
          data.twitter ||
          data.talkingPoints ||
          data.communityRequest)
      ) {
        setIncludesVideoRequest(Boolean(selectedOutputs.videoRequest && data.communityRequest))
        setGeneratedRelease(data.pressRelease || "")
        setGeneratedFacebook(data.facebook || "")
        setGeneratedFacebookSpanish("")
        setFacebookLangView("en")
        setTranslateError(null)
        setGeneratedTwitter(data.twitter || "")
        setGeneratedTalkingPoints(data.talkingPoints || "")
        setGeneratedCommunityRequest(data.communityRequest || null)
        setQualityStatus(data.qualityStatus || null)
        setStatusLabel(data.statusLabel || "Draft")
        setDetailsToVerify(Array.isArray(data.detailsToVerify) ? data.detailsToVerify : [])
        setHumanReviewReason(data.humanReviewReason || "")
        setGeneratedCommunityRequestSpanish("")
        setCommunityRequestLangView("en")
        setPressReleaseSessionId(data.sessionIds?.pressReleaseSessionId ?? null)
        setVideoRequestSessionId(data.sessionIds?.videoRequestSessionId ?? null)
        setShowFeedback(true)
        const historyContent =
          data.pressRelease ||
          data.facebook ||
          data.twitter ||
          data.talkingPoints ||
          data.communityRequest ||
          ""
        if (historyContent) {
          addPioHistoryItem({
            title: `${incidentType || "Incident"} - Press Release`,
            type: incidentType || "Incident",
            format: "Press Release",
            content: historyContent,
          })
        }
        setGenerated(true)
        const firstTab = selectedOutputs.pressRelease
          ? "press-release"
          : selectedOutputs.facebook
            ? "facebook"
            : selectedOutputs.twitter
              ? "twitter"
              : selectedOutputs.talkingPoints
                ? "talking-points"
                : "community-request"
        setPreviewTab(firstTab)
        setActiveTab("preview")
        track("pio_generate", { source: "multi_output" })
        setGenerating(false)
        return
      }
      // Out of generations — show purchase modal, keep form intact
      if (res.status === 403 && data?.error?.includes("generations")) {
        setGenerating(false)
        setShowGenLimitModal(true)
        return
      }
      setGenerateError(
        data?.error ||
          "AI drafting failed. OpenAI did not run — please try again in a few minutes."
      )
      setGenerating(false)
      return
    } catch {
      setGenerateError("Could not reach the server. Check your connection and try again.")
      setGenerating(false)
    }
  }

  const trackFieldAction = (field: string) => {
    const map: Record<string, { sessionId: string | null; action: GenerationActionType }> = {
      "press-release": { sessionId: pressReleaseSessionId, action: "press_release_copied" },
      facebook: { sessionId: pressReleaseSessionId, action: "facebook_copied" },
      "facebook-es": { sessionId: pressReleaseSessionId, action: "spanish_copied" },
      twitter: { sessionId: pressReleaseSessionId, action: "x_copied" },
      "talking-points": { sessionId: pressReleaseSessionId, action: "talking_points_downloaded" },
      "community-request": { sessionId: videoRequestSessionId, action: "video_request_copied" },
      "community-request-es": { sessionId: videoRequestSessionId, action: "spanish_copied" },
    }
    const entry = map[field]
    if (entry?.sessionId) trackPioAction(entry.sessionId, entry.action)
  }

  const handleCopyField = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    trackFieldAction(field)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleTranslateFacebook = async () => {
    const source = generatedFacebook.trim()
    if (!source) return

    setTranslatingFacebook(true)
    setTranslateError(null)
    try {
      const res = await fetch("/api/pio/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: source,
          generationSessionId: pressReleaseSessionId,
        }),
      })
      const data = await res.json()
      if (res.ok && data.translation) {
        setGeneratedFacebookSpanish(data.translation)
        setFacebookLangView("es")
        return
      }
      setTranslateError(data?.error || "Translation failed. Please try again.")
    } catch {
      setTranslateError("Could not reach the server. Check your connection and try again.")
    } finally {
      setTranslatingFacebook(false)
    }
  }

  const handleTranslateCommunityRequest = async () => {
    const source = (generatedCommunityRequest || "").trim()
    if (!source) return

    setTranslatingCommunityRequest(true)
    setTranslateError(null)
    try {
      const res = await fetch("/api/pio/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: source,
          generationSessionId: videoRequestSessionId || pressReleaseSessionId,
        }),
      })
      const data = await res.json()
      if (res.ok && data.translation) {
        setGeneratedCommunityRequestSpanish(data.translation)
        setCommunityRequestLangView("es")
        return
      }
      setTranslateError(data?.error || "Translation failed. Please try again.")
    } catch {
      setTranslateError("Could not reach the server. Check your connection and try again.")
    } finally {
      setTranslatingCommunityRequest(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedRelease)
    trackPioAction(pressReleaseSessionId, "press_release_copied")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setGenerated(false)
    setGeneratedRelease("")
    setGeneratedFacebook("")
    setGeneratedFacebookSpanish("")
    setFacebookLangView("en")
    setTranslateError(null)
    setGeneratedTwitter("")
    setGeneratedTalkingPoints("")
    setGeneratedCommunityRequest(null)
    setGeneratedCommunityRequestSpanish("")
    setQualityStatus(null)
    setStatusLabel("Draft")
    setDetailsToVerify([])
    setHumanReviewReason("")
    setCommunityRequestLangView("en")
    setIncludesVideoRequest(false)
    setPressReleaseSessionId(null)
    setVideoRequestSessionId(null)
    setShowFeedback(false)
    setPersons([])
    setArrests([])
    setArrestsMade(false)
    setRequestAssistance(false)
    setInvestigationOngoing(true)
    setIncidentType("")
    setOtherIncidentType("")
    setReleaseDate("")
    setCaseNumber("")
    setMutualAid("")
    setOnlineTipsUrl("")
    setEntryType("none")
    setIncidentSummary("")
    setIncidentDate("")
    setIncidentTime("")
    setLocation("")
    setTipLine("")
    setDetectiveName("")
    setDetectiveEmail("")
    setDetectivePhone("")
    setResolutionText("")
    setRequestFootage(false)
    setFootageFromDate("")
    setFootageFromTime("")
    setFootageToDate("")
    setFootageToTime("")
    setWhatToLookFor("")
    setSelectedOutputs({ ...DEFAULT_MULTI_OUTPUT_SELECTION })
    setIncludesVideoRequest(false)
    setPreviewTab("press-release")
    setActiveTab("header")
  }

  const stepIndex = STEPS.findIndex((s) => s.id === activeTab)

  function goNext() {
    if (stepIndex < STEPS.length - 1) {
      const next = STEPS[stepIndex + 1]
      if (next.id === "preview" && !generated) return
      setActiveTab(next.id)
    }
  }

  function goBack() {
    if (stepIndex > 0) setActiveTab(STEPS[stepIndex - 1].id)
  }

  function toggleOutput(key: OutputKey) {
    setSelectedOutputs((prev) => ({ ...prev, [key]: !prev[key] }))
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
    trackPioAction(pressReleaseSessionId, "press_release_downloaded")
  }

  const generateButton = (
    <Button
      type="button"
      onClick={handleGenerate}
      disabled={generating}
      className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
    >
      {generating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>Generate →</>
      )}
    </Button>
  )

  return (
    <PIOPreviewGate>
      <GenerationLimitModal open={showGenLimitModal} onOpenChange={setShowGenLimitModal} />
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        <PioPageHeader
          icon={<FileText className="h-6 w-6" />}
          title="New Press Release"
          description="Draft a press release, social posts, talking points, and an optional video request — review before you share."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="border-[#d5def0] bg-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              {generateButton}
            </>
          }
        />

        <PioStepper
          steps={STEPS}
          currentId={activeTab}
          onSelect={(id) => setActiveTab(id as StepId)}
          isLocked={(id) => id === "preview" && !generated}
        />

        {generateError && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {generateError}
          </p>
        )}

        <PioFormPanel>
          {activeTab === "header" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Header Information"
                description="Basic agency and release information"
              />
              <div className="space-y-2">
                <Label htmlFor="agency">Agency Name</Label>
                <Input
                  id="agency"
                  placeholder="Agency Name"
                  className="h-11 placeholder:text-muted-foreground/60"
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
                    className="h-11 placeholder:text-muted-foreground/60"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    className="h-11 placeholder:text-muted-foreground/60"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="releaseDate">Release Date</Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    className="h-11"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="caseNumber">Case Number</Label>
                  <Input
                    id="caseNumber"
                    placeholder="Case Number"
                    className="h-11 placeholder:text-muted-foreground/60"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "incident" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Incident Basics"
                description="Core details about the incident"
              />
              <div className="space-y-2">
                <Label htmlFor="incidentType">Incident Type</Label>
                <Select value={incidentType} onValueChange={setIncidentType}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidentTypes.map((type) => (
                      <SelectItem key={type} value={incidentTypeToValue(type)}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {incidentType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="otherType">Specify Incident Type</Label>
                  <Input
                    id="otherType"
                    placeholder="Describe the incident type"
                    className="h-11 placeholder:text-muted-foreground/60"
                    value={otherIncidentType}
                    onChange={(e) => setOtherIncidentType(e.target.value)}
                  />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">Incident Date</Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    className="h-11"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incidentTime">Incident Time</Label>
                  <Input
                    id="incidentTime"
                    type="time"
                    className="h-11"
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
                  className="h-11 placeholder:text-muted-foreground/60"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Incident Summary</Label>
                <p className="text-sm text-[#7a8ab0]">
                  Provide a summary of what happened. Press Center uses only the facts you provide. Aim for 2,000–4,500 characters for best results.
                </p>
                <Textarea
                  id="summary"
                  placeholder="Describe what happened..."
                  className="min-h-[200px] w-full resize-y placeholder:text-muted-foreground/60"
                  value={incidentSummary}
                  maxLength={4500}
                  onChange={(e) => setIncidentSummary(e.target.value)}
                />
                <p
                  className={`text-xs text-right ${
                    incidentSummary.length > 4000 ? "text-amber-600" : "text-[#7a8ab0]"
                  }`}
                >
                  {incidentSummary.length.toLocaleString()} / 4,500
                </p>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <PioSectionTitle
                title="Details"
                description="People involved and case status."
              />

              <div className="space-y-2">
                <Label htmlFor="peopleInvolved">People involved</Label>
                <Select value={entryType} onValueChange={handleEntryTypeChange}>
                  <SelectTrigger id="peopleInvolved" className="h-11">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="suspect">Suspect</SelectItem>
                    <SelectItem value="victim">Victim / Missing Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {entryType !== "none" && persons[0] && (
                <div className="space-y-3 rounded-2xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                  <Textarea
                    value={persons[0].description}
                    onChange={(e) =>
                      updatePerson(persons[0].id, "description", e.target.value)
                    }
                    placeholder={
                      entryType === "suspect"
                        ? "Describe the suspect (clothing, vehicle, etc.)"
                        : "Describe the person (if appropriate to release)"
                    }
                    rows={3}
                    className="bg-white"
                  />
                  <Input
                    value={persons[0].name}
                    onChange={(e) => updatePerson(persons[0].id, "name", e.target.value)}
                    placeholder="Name (optional)"
                    className="h-11 bg-white"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`minor-${persons[0].id}`}
                      checked={persons[0].isMinor}
                      onCheckedChange={(checked) =>
                        updatePerson(persons[0].id, "isMinor", checked as boolean)
                      }
                    />
                    <Label htmlFor={`minor-${persons[0].id}`} className="text-sm text-[#64748b]">
                      This person is a minor
                    </Label>
                  </div>
                  {persons.length > 1 &&
                    persons.slice(1).map((person, index) => (
                      <div
                        key={person.id}
                        className="space-y-2 border-t border-[#e2e8f5] pt-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#94A3B8]">
                            {entryType} {index + 2}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removePerson(person.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={person.description}
                          onChange={(e) =>
                            updatePerson(person.id, "description", e.target.value)
                          }
                          placeholder="Description…"
                          rows={2}
                          className="bg-white"
                        />
                      </div>
                    ))}
                  <button
                    type="button"
                    onClick={addPerson}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]"
                  >
                    <Plus className="h-4 w-4" />
                    Add another
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-[#0f1c3f]">Case status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInvestigationOngoing(true)
                      setRequestFootage(true)
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      investigationOngoing
                        ? "border-[#2563EB] bg-[#EFF6FF]"
                        : "border-[#e2e8f5] bg-white hover:border-[#93c5fd]"
                    }`}
                  >
                    <p className="font-semibold text-[#0f1c3f]">Ongoing</p>
                    <p className="text-xs text-[#7a8ab0]">Still investigating</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInvestigationOngoing(false)
                      setRequestFootage(false)
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      !investigationOngoing
                        ? "border-[#10B981] bg-[#ECFDF5]"
                        : "border-[#e2e8f5] bg-white hover:border-[#93c5fd]"
                    }`}
                  >
                    <p className="font-semibold text-[#0f1c3f]">Resolved</p>
                    <p className="text-xs text-[#7a8ab0]">Case closed</p>
                  </button>
                </div>
              </div>

              {investigationOngoing ? (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#0f1c3f]">Detective contact</p>
                    <div className="space-y-2">
                      <Label htmlFor="detectiveName">Name</Label>
                      <Input
                        id="detectiveName"
                        placeholder="e.g. Det. Smith"
                        className="h-11"
                        value={detectiveName}
                        onChange={(e) => setDetectiveName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="detectivePhone">Phone</Label>
                        <Input
                          id="detectivePhone"
                          type="tel"
                          placeholder="e.g. (555) 123-4567"
                          className="h-11"
                          value={detectivePhone}
                          onChange={(e) => setDetectivePhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="detectiveEmail">Email</Label>
                        <Input
                          id="detectiveEmail"
                          type="email"
                          placeholder="e.g. detective@agency.gov"
                          className="h-11"
                          value={detectiveEmail}
                          onChange={(e) => setDetectiveEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#0f1c3f]">Video footage needed</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="footageFromDate">From date</Label>
                        <Input
                          id="footageFromDate"
                          type="date"
                          className="h-11"
                          value={footageFromDate}
                          onChange={(e) => setFootageFromDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footageFromTime">From time</Label>
                        <Input
                          id="footageFromTime"
                          type="time"
                          className="h-11"
                          value={footageFromTime}
                          onChange={(e) => setFootageFromTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footageToDate">To date</Label>
                        <Input
                          id="footageToDate"
                          type="date"
                          className="h-11"
                          value={footageToDate}
                          onChange={(e) => setFootageToDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="footageToTime">To time</Label>
                        <Input
                          id="footageToTime"
                          type="time"
                          className="h-11"
                          value={footageToTime}
                          onChange={(e) => setFootageToTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatToLookFor">What to look for</Label>
                      <Textarea
                        id="whatToLookFor"
                        placeholder="e.g. dark sedan, person with a backpack near driveways…"
                        rows={3}
                        value={whatToLookFor}
                        onChange={(e) => setWhatToLookFor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="resolutionText">Why was the case resolved?</Label>
                  <Textarea
                    id="resolutionText"
                    placeholder="e.g. Arrest made, property recovered, charges filed…"
                    rows={4}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Media Contact"
                description="Who should the media contact for more information?"
              />
              <div className="space-y-2">
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  placeholder="e.g. John Smith"
                  className="h-11 placeholder:text-muted-foreground/60"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 555-555-5555"
                    className="h-11 placeholder:text-muted-foreground/60"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2">Secondary Phone (optional)</Label>
                  <Input
                    id="phone2"
                    placeholder="e.g. 555-555-5556"
                    className="h-11 placeholder:text-muted-foreground/60"
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
                  placeholder="e.g. press@agency.gov"
                  className="h-11 placeholder:text-muted-foreground/60"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === "outputs" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Which messages do you want?"
                description="Choose only what you need."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {OUTPUT_OPTIONS.map((opt) => {
                  const on = selectedOutputs[opt.id]
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOutput(opt.id)}
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        on
                          ? "border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/15"
                          : "border-[#e2e8f5] bg-white hover:border-[#93c5fd]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#0f1c3f]">{opt.label}</p>
                          <p className="mt-0.5 text-sm text-[#7a8ab0]">{opt.hint}</p>
                        </div>
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold ${
                            on
                              ? "border-[#2563EB] bg-[#2563EB] text-white"
                              : "border-[#cbd5e1] bg-white text-transparent"
                          }`}
                          aria-hidden
                        >
                          ✓
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {!selectionHasAny(selectedOutputs) && (
                <p className="text-sm text-amber-700">Select at least one message type.</p>
              )}
            </div>
          )}

          {activeTab === "preview" && generated && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Review"
                description="Only the messages you selected. Edit, copy, or export when ready."
              />
              <div
                className={`rounded-xl border p-4 ${
                  qualityStatus === "needs_human_review"
                    ? "border-amber-300 bg-amber-50 text-amber-950"
                    : "border-blue-200 bg-blue-50 text-blue-950"
                }`}
              >
                <p className="text-sm font-semibold">{statusLabel}</p>
                {qualityStatus === "needs_human_review" && humanReviewReason && (
                  <p className="mt-1 text-sm">{humanReviewReason}</p>
                )}
                {detailsToVerify.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide">
                      Details requiring verification
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                      {detailsToVerify.map((detail, index) => (
                        <li key={`${detail}-${index}`}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="mt-2 text-xs">
                  SaferU review is not agency approval. Review and authorize content before publication.
                </p>
              </div>
              {showFeedback && pressReleaseSessionId && (
                <GenerationFeedback
                  generationSessionId={pressReleaseSessionId}
                  onDone={() => setShowFeedback(false)}
                />
              )}
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-2">
                  {selectedOutputs.pressRelease && (
                    <TabsTrigger
                      value="press-release"
                      className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1D4ED8] data-[state=active]:shadow-sm sm:text-sm"
                    >
                      Press Release
                    </TabsTrigger>
                  )}
                  {selectedOutputs.facebook && (
                    <TabsTrigger
                      value="facebook"
                      className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1D4ED8] data-[state=active]:shadow-sm sm:text-sm"
                    >
                      Facebook
                    </TabsTrigger>
                  )}
                  {selectedOutputs.twitter && (
                    <TabsTrigger
                      value="twitter"
                      className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1D4ED8] data-[state=active]:shadow-sm sm:text-sm"
                    >
                      X / Twitter
                    </TabsTrigger>
                  )}
                  {selectedOutputs.talkingPoints && (
                    <TabsTrigger
                      value="talking-points"
                      className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1D4ED8] data-[state=active]:shadow-sm sm:text-sm"
                    >
                      Talking Points
                    </TabsTrigger>
                  )}
                  {includesVideoRequest && (
                    <TabsTrigger
                      value="community-request"
                      className="rounded-full px-3 py-1.5 text-xs data-[state=active]:bg-white data-[state=active]:text-[#1D4ED8] data-[state=active]:shadow-sm sm:text-sm"
                    >
                      Assistance Request
                    </TabsTrigger>
                  )}
                </TabsList>

                {selectedOutputs.pressRelease && (
                <TabsContent value="press-release" className="mt-4">
                  <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
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
                      className="min-h-[400px] w-full resize-none border-0 bg-transparent font-sans text-sm leading-relaxed whitespace-pre-wrap text-[#405172] focus:outline-none focus:ring-0"
                      placeholder="Your generated press release will appear here..."
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      className="bg-transparent"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export to PDF
                    </Button>
                  </div>
                </TabsContent>
                )}

                {selectedOutputs.facebook && (
                <TabsContent value="facebook" className="mt-4">
                  <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                    {generatedFacebookSpanish && (
                      <div className="mb-3 flex gap-2">
                        <Button
                          type="button"
                          variant={facebookLangView === "en" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFacebookLangView("en")}
                        >
                          English
                        </Button>
                        <Button
                          type="button"
                          variant={facebookLangView === "es" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFacebookLangView("es")}
                        >
                          Español
                        </Button>
                      </div>
                    )}
                    <textarea
                      value={
                        facebookLangView === "es" && generatedFacebookSpanish
                          ? generatedFacebookSpanish
                          : generatedFacebook
                      }
                      onChange={(e) => {
                        if (facebookLangView === "es" && generatedFacebookSpanish) {
                          setGeneratedFacebookSpanish(e.target.value)
                        } else {
                          setGeneratedFacebook(e.target.value)
                          setGeneratedFacebookSpanish("")
                        }
                      }}
                      className="min-h-[200px] w-full resize-none border-0 bg-transparent font-sans text-sm leading-relaxed whitespace-pre-wrap text-[#405172] focus:outline-none focus:ring-0"
                      placeholder="Facebook post will appear here..."
                    />
                  </div>
                  {translateError && (
                    <p className="mt-2 text-sm text-destructive">{translateError}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyField(
                          facebookLangView === "es" && generatedFacebookSpanish
                            ? generatedFacebookSpanish
                            : generatedFacebook,
                          facebookLangView === "es" ? "facebook-es" : "facebook"
                        )
                      }
                      className="bg-transparent"
                    >
                      {(copiedField === "facebook" && facebookLangView === "en") ||
                      (copiedField === "facebook-es" && facebookLangView === "es") ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Facebook Post
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleTranslateFacebook()}
                      disabled={!generatedFacebook.trim() || translatingFacebook}
                      className="bg-transparent"
                    >
                      {translatingFacebook ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Translating…
                        </>
                      ) : (
                        <>
                          <Languages className="mr-2 h-4 w-4" />
                          Translate to Spanish
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                )}

                {selectedOutputs.twitter && (
                <TabsContent value="twitter" className="mt-4">
                  <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                    <textarea
                      value={generatedTwitter}
                      onChange={(e) => setGeneratedTwitter(e.target.value)}
                      className="min-h-[100px] w-full resize-none border-0 bg-transparent font-sans text-sm leading-relaxed whitespace-pre-wrap text-[#405172] focus:outline-none focus:ring-0"
                      placeholder="X/Twitter post will appear here..."
                    />
                    <p className="mt-2 text-xs text-[#7a8ab0]">
                      {generatedTwitter.length} / 280 characters
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyField(generatedTwitter, "twitter")}
                      className="bg-transparent"
                    >
                      {copiedField === "twitter" ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy X Post
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                )}

                {selectedOutputs.talkingPoints && (
                <TabsContent value="talking-points" className="mt-4">
                  <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                    <textarea
                      value={generatedTalkingPoints}
                      onChange={(e) => setGeneratedTalkingPoints(e.target.value)}
                      className="min-h-[300px] w-full resize-none border-0 bg-transparent font-sans text-sm leading-relaxed whitespace-pre-wrap text-[#405172] focus:outline-none focus:ring-0"
                      placeholder="Talking points will appear here..."
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyField(generatedTalkingPoints, "talking-points")}
                      className="bg-transparent"
                    >
                      {copiedField === "talking-points" ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Talking Points
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
                )}

                {includesVideoRequest && (
                  <TabsContent value="community-request" className="mt-4 space-y-3">
                    <VideoRequestGuidelinesNote />
                    {generatedCommunityRequest ? (
                      <>
                        <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                          {generatedCommunityRequestSpanish && (
                            <div className="mb-3 flex gap-2">
                              <Button
                                type="button"
                                variant={communityRequestLangView === "en" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCommunityRequestLangView("en")}
                              >
                                English
                              </Button>
                              <Button
                                type="button"
                                variant={communityRequestLangView === "es" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCommunityRequestLangView("es")}
                              >
                                Español
                              </Button>
                            </div>
                          )}
                          <textarea
                            value={
                              communityRequestLangView === "es" && generatedCommunityRequestSpanish
                                ? generatedCommunityRequestSpanish
                                : generatedCommunityRequest
                            }
                            onChange={(e) => {
                              if (
                                communityRequestLangView === "es" &&
                                generatedCommunityRequestSpanish
                              ) {
                                setGeneratedCommunityRequestSpanish(e.target.value)
                              } else {
                                setGeneratedCommunityRequest(e.target.value)
                                setGeneratedCommunityRequestSpanish("")
                              }
                            }}
                            className="min-h-[200px] w-full resize-none border-0 bg-transparent font-sans text-sm leading-relaxed whitespace-pre-wrap text-[#405172] focus:outline-none focus:ring-0"
                            placeholder="Video request will appear here..."
                          />
                        </div>
                        {translateError && communityRequestLangView === "es" && (
                          <p className="text-sm text-destructive">{translateError}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyField(
                                communityRequestLangView === "es" &&
                                  generatedCommunityRequestSpanish
                                  ? generatedCommunityRequestSpanish
                                  : generatedCommunityRequest || "",
                                communityRequestLangView === "es"
                                  ? "community-request-es"
                                  : "community-request"
                              )
                            }
                            className="bg-transparent"
                          >
                            {(copiedField === "community-request" &&
                              communityRequestLangView === "en") ||
                            (copiedField === "community-request-es" &&
                              communityRequestLangView === "es") ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Video Request
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleTranslateCommunityRequest()}
                            disabled={
                              !(generatedCommunityRequest || "").trim() ||
                              translatingCommunityRequest
                            }
                            className="bg-transparent"
                          >
                            {translatingCommunityRequest ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Translating…
                              </>
                            ) : (
                              <>
                                <Languages className="mr-2 h-4 w-4" />
                                Translate to Spanish
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        Video request could not be generated. Try generating again, or use the
                        standalone Video Request tool.
                      </p>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          <PioStepFooter
            onBack={goBack}
            backDisabled={stepIndex === 0}
            next={
              activeTab === "outputs" || activeTab === "preview" ? (
                generateButton
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                >
                  Next →
                </Button>
              )
            }
          />
        </PioFormPanel>
      </div>
    </PIOPreviewGate>
  )
}
