"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Video, Copy, Check, Trash2, Languages } from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { addPioHistoryItem } from "@/lib/pio-history-store"
import { VideoRequestGuidelinesNote } from "@/components/pio/video-request-guidelines-note"
import {
  PioFormPanel,
  PioPageHeader,
  PioSectionTitle,
  PioStepFooter,
  PioStepper,
} from "@/components/pio/pio-form-shell"
import { PIOPreviewGate } from "@/components/pio-preview-gate"
import { GenerationLimitModal } from "@/components/generation-limit-modal"
import { track } from "@/lib/track"
import { trackPioAction } from "@/lib/pio-analytics-client"
import { GenerationFeedback } from "@/components/pio/generation-feedback"
import { validateVideoRequestInput } from "@/lib/pio-generate-validation"

const STEPS = [
  { id: "incident", label: "Incident" },
  { id: "footage", label: "Footage" },
  { id: "contact", label: "Contact" },
  { id: "preview", label: "Review" },
] as const

type StepId = (typeof STEPS)[number]["id"]

const incidentTypes = [
  "Burglary",
  "Theft",
  "Robbery",
  "Assault",
  "Shooting",
  "Officer-Involved Shooting",
  "Vehicle Break-In",
  "Carjacking",
  "Hit and Run",
  "Package Theft",
  "Drug Seizure",
  "Missing Person",
  "Vandalism",
  "Arson",
  "Fire",
  "Structure Fire",
  "Vehicle Fire",
  "Fire Investigation",
  "Traffic Incident",
  "Vehicle Accident",
  "Domestic Dispute",
  "Suspicious Activity",
  "Other",
]

export default function CommunityPostPage() {
  const { settings: agencySettings } = useAgency()

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<StepId>("incident")
  const [showGenLimitModal, setShowGenLimitModal] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [incidentType, setIncidentType] = useState("")
  const [otherIncidentType, setOtherIncidentType] = useState("")
  const [address, setAddress] = useState("")
  const [incidentDate, setIncidentDate] = useState("")
  const [description, setDescription] = useState("")

  const [footageTimeframe, setFootageTimeframe] = useState("")
  const [whatToLookFor, setWhatToLookFor] = useState("")

  const [agencyName, setAgencyName] = useState("")
  const [contactDetails, setContactDetails] = useState("")
  const [caseNumber, setCaseNumber] = useState("")
  const [tipLine, setTipLine] = useState("")

  const [generatedPost, setGeneratedPost] = useState("")
  const [generatedSpanish, setGeneratedSpanish] = useState("")
  const [langView, setLangView] = useState<"en" | "es">("en")
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [videoSessionId, setVideoSessionId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

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

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  function goNext() {
    if (stepIndex < STEPS.length - 1) {
      const next = STEPS[stepIndex + 1]
      if (next.id === "preview" && !generated) return
      setStep(next.id)
    }
  }

  function goBack() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].id)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateError(null)

    const validationError = validateVideoRequestInput({
      incidentType,
      otherIncidentType,
      description,
      whatToLookFor,
      footageTimeframe,
      address,
    })
    if (validationError) {
      setGenerateError(validationError)
      setGenerating(false)
      return
    }

    const displayIncident = incidentType === "other" ? otherIncidentType : incidentType

    try {
      const res = await fetch("/api/pio/generate-community-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: agencyName.trim(),
          incidentType: incidentType === "other" ? "other" : incidentType,
          otherIncidentType: incidentType === "other" ? otherIncidentType.trim() : undefined,
          address: address?.trim() || undefined,
          incidentDate: incidentDate || undefined,
          description: description?.trim() || undefined,
          footageTimeframe: footageTimeframe?.trim() || undefined,
          whatToLookFor: whatToLookFor?.trim() || undefined,
          contactDetails: contactDetails?.trim() || undefined,
          caseNumber: caseNumber?.trim() || undefined,
          tipLine: tipLine?.trim() || undefined,
          agencyType: agencySettings.agencyType,
          departmentType: agencySettings.agencyType,
          departmentOther:
            agencySettings.agencyType === "other"
              ? agencySettings.agencyTypeOther.trim() || undefined
              : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.content) {
        setGeneratedPost(data.content)
        setGeneratedSpanish("")
        setLangView("en")
        setTranslateError(null)
        setVideoSessionId(data.sessionId ?? null)
        setShowFeedback(true)
        addPioHistoryItem({
          title: `${displayIncident || "Incident"} - Video Request`,
          type: displayIncident || "Incident",
          format: "Video Request",
          content: data.content,
        })
        setGenerating(false)
        setGenerated(true)
        setStep("preview")
        track("pio_generate", { source: "community_post" })
        return
      }
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

  const handleCopy = async () => {
    const text =
      langView === "es" && generatedSpanish.trim() ? generatedSpanish : generatedPost
    await navigator.clipboard.writeText(text)
    trackPioAction(
      videoSessionId,
      langView === "es" ? "spanish_copied" : "video_request_copied"
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTranslate = async () => {
    const source = generatedPost.trim()
    if (!source) return

    setTranslating(true)
    setTranslateError(null)
    try {
      const res = await fetch("/api/pio/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: source,
          generationSessionId: videoSessionId,
        }),
      })
      const data = await res.json()
      if (res.ok && data.translation) {
        setGeneratedSpanish(data.translation)
        setLangView("es")
        return
      }
      setTranslateError(data?.error || "Translation failed. Please try again.")
    } catch {
      setTranslateError("Could not reach the server. Check your connection and try again.")
    } finally {
      setTranslating(false)
    }
  }

  const handleClear = () => {
    setGenerated(false)
    setGeneratedPost("")
    setGeneratedSpanish("")
    setLangView("en")
    setTranslateError(null)
    setVideoSessionId(null)
    setShowFeedback(false)
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
    setStep("incident")
    setGenerateError(null)
  }

  return (
    <PIOPreviewGate>
      <GenerationLimitModal open={showGenLimitModal} onOpenChange={setShowGenLimitModal} />
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        <PioPageHeader
          icon={<Video className="h-6 w-6" />}
          title="Video Request"
          description="Draft a clear request for doorbell or security camera footage."
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
                  <>Generate Message →</>
                )}
              </Button>
            </>
          }
        />

        <VideoRequestGuidelinesNote />

        <PioStepper
          steps={STEPS}
          currentId={step}
          onSelect={(id) => setStep(id as StepId)}
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
          {step === "incident" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Incident Details"
                description="What happened and where. Exact addresses are never shared."
              />
              <div className="space-y-2">
                <Label htmlFor="incidentType">Type of Incident</Label>
                <Select value={incidentType} onValueChange={setIncidentType}>
                  <SelectTrigger className="h-11">
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
                    className="h-11"
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
                  className="h-11"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                <p className="text-xs text-[#7a8ab0]">
                  This will be generalized to protect privacy.
                </p>
              </div>
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
                <Label htmlFor="description">Additional Details (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional context about the incident..."
                  className="min-h-[120px] w-full resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === "footage" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Footage Needed"
                description="Timeframe and what residents should look for."
              />
              <div className="space-y-2">
                <Label htmlFor="footageTimeframe">Timeframe for Footage</Label>
                <Input
                  id="footageTimeframe"
                  placeholder="e.g., January 10 between 8:00 PM and 11:00 PM"
                  className="h-11"
                  value={footageTimeframe}
                  onChange={(e) => setFootageTimeframe(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatToLookFor">What Should Residents Look For</Label>
                <Textarea
                  id="whatToLookFor"
                  placeholder="e.g., dark colored sedan, two individuals on foot..."
                  className="min-h-[150px] w-full resize-y"
                  value={whatToLookFor}
                  onChange={(e) => setWhatToLookFor(e.target.value)}
                />
                <p className="text-xs text-[#7a8ab0]">
                  Never include full names, exact addresses, or victim details.
                </p>
              </div>
            </div>
          )}

          {step === "contact" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="How to Submit"
                description="Where residents should send footage or tips."
              />
              <div className="space-y-2">
                <Label htmlFor="agencyNameField">Agency Name</Label>
                <Input
                  id="agencyNameField"
                  placeholder="Agency Name"
                  className="h-11"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactDetails">Who Should Residents Contact</Label>
                <Input
                  id="contactDetails"
                  placeholder="e.g. John Smith — 555-555-5555 — press@agency.gov"
                  className="h-11"
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
                    className="h-11"
                    value={caseNumber}
                    onChange={(e) => setCaseNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipLine">Anonymous Tip Line (optional)</Label>
                  <Input
                    id="tipLine"
                    placeholder="e.g., 1-800-TIPS"
                    className="h-11"
                    value={tipLine}
                    onChange={(e) => setTipLine(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-5">
              <PioSectionTitle
                title="Review & Copy"
                description="Edit if needed, then copy when ready."
              />
              {showFeedback && videoSessionId && (
                <GenerationFeedback
                  generationSessionId={videoSessionId}
                  onDone={() => setShowFeedback(false)}
                />
              )}
              <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                {generatedSpanish && (
                  <div className="mb-3 flex gap-2">
                    <Button
                      type="button"
                      variant={langView === "en" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLangView("en")}
                    >
                      English
                    </Button>
                    <Button
                      type="button"
                      variant={langView === "es" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLangView("es")}
                    >
                      Español
                    </Button>
                  </div>
                )}
                <textarea
                  value={
                    langView === "es" && generatedSpanish ? generatedSpanish : generatedPost
                  }
                  onChange={(e) => {
                    if (langView === "es" && generatedSpanish) {
                      setGeneratedSpanish(e.target.value)
                    } else {
                      setGeneratedPost(e.target.value)
                      setGeneratedSpanish("")
                    }
                  }}
                  className="min-h-[360px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-[#405172] focus:outline-none focus:ring-0"
                  placeholder="Your generated video request will appear here..."
                />
              </div>
              {translateError && (
                <p className="text-sm text-destructive">{translateError}</p>
              )}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <strong>Privacy reminder:</strong> Review before posting. No exact addresses or
                victim names should be included.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleTranslate()}
                  disabled={!generatedPost.trim() || translating}
                >
                  {translating ? (
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
            </div>
          )}

          <PioStepFooter
            onBack={goBack}
            backDisabled={stepIndex === 0}
            next={
              step !== "preview" ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                >
                  Next →
                </Button>
              ) : (
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
                    <>Generate Message →</>
                  )}
                </Button>
              )
            }
          />
        </PioFormPanel>
      </div>
    </PIOPreviewGate>
  )
}
