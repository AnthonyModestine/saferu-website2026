"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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
import {
  ArrowRight,
  CheckCircle,
  Clock3,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
} from "lucide-react"

const TOPIC_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "content", label: "Content Request" },
  { value: "feedback", label: "Feedback" },
  { value: "bug", label: "Report an Issue" },
  { value: "partnership", label: "Partnership" },
] as const

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [topic, setTopic] = useState<string>("general")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    const form = e.currentTarget
    const name = (form.querySelector("#name") as HTMLInputElement)?.value?.trim()
    const email = (form.querySelector("#email") as HTMLInputElement)?.value?.trim()
    const agency = (form.querySelector("#agency") as HTMLInputElement)?.value?.trim()
    const message = (form.querySelector("#message") as HTMLTextAreaElement)?.value?.trim()
    if (!name || !email || !message) {
      setError("Name, email, and message are required.")
      setSending(false)
      return
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, agency: agency || undefined, topic, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setSending(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Navy hero: verbiage left, form card right */}
        <section className="relative overflow-hidden bg-[#0B1B3A]">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -right-32 -top-40 h-[480px] w-[480px] rounded-full bg-[#2563EB]/20 blur-[130px]" />
            <div className="absolute -bottom-48 left-1/4 h-[420px] w-[420px] rounded-full bg-[#F2B233]/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20 lg:px-8 lg:py-20">
            <div className="lg:sticky lg:top-28">
              <span className="block h-1 w-14 rounded-full bg-[#F2B233]" aria-hidden="true" />
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">Contact SaferU</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#b8c7e0]">
                Whether you have a question, an idea, or need help with your account, our team is
                ready to help.
              </p>

              <div className="mt-9 space-y-4">
                <a
                  href="mailto:support@saferu.com"
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition-colors hover:bg-white/10"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-blue-950/30">
                    <Mail className="h-5 w-5 text-white" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#8fa5c7]">
                      Email us directly
                    </span>
                    <span className="mt-0.5 block truncate font-semibold text-white">
                      support@saferu.com
                    </span>
                  </span>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-[#F2B233] transition-transform group-hover:translate-x-1" />
                </a>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2B233]/15">
                    <Clock3 className="h-5 w-5 text-[#F2B233]" />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">Quick response</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-[#b8c7e0]">
                      We typically reply within two business days.
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4A9D6B]/15">
                    <ShieldCheck className="h-5 w-5 text-[#4A9D6B]" />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">Here to help</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-[#b8c7e0]">
                      Real support for public safety professionals.
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl shadow-black/20">
              <div className="border-b border-[#E2E8F5] px-6 py-7 sm:px-10">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF1FF]">
                    <MessageSquare className="h-5 w-5 text-[#2563EB]" />
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-[#1A365D]">
                    Send us a message
                  </h2>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                {submitted ? (
                  <div
                    className="flex min-h-[430px] flex-col items-center justify-center text-center"
                    aria-live="polite"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF7EF]">
                      <CheckCircle className="h-10 w-10 text-[#4A9D6B]" />
                    </div>
                    <h3 className="mt-6 text-2xl font-bold text-[#1A365D]">Message sent</h3>
                    <p className="mt-3 max-w-sm leading-relaxed text-[#5c6b85]">
                      Thanks for reaching out. A member of the SaferU team will get back to you
                      shortly.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-7 rounded-xl border-[#CBD6E5] bg-transparent px-6"
                      onClick={() => setSubmitted(false)}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-7">
                    {error && (
                      <p
                        className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700"
                        role="alert"
                      >
                        {error}
                      </p>
                    )}

                    <div className="grid gap-7 sm:grid-cols-2 sm:gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="name" className="font-semibold text-[#1A365D]">
                          Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          autoComplete="name"
                          placeholder="Your name"
                          className="h-11 rounded-xl border-[#CBD6E5] focus-visible:ring-[#2563EB]"
                          required
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="email" className="font-semibold text-[#1A365D]">
                          Work email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@agency.gov"
                          className="h-11 rounded-xl border-[#CBD6E5] focus-visible:ring-[#2563EB]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-7 sm:grid-cols-2 sm:gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="agency" className="font-semibold text-[#1A365D]">
                          Agency <span className="font-normal text-[#7b8ba5]">(optional)</span>
                        </Label>
                        <Input
                          id="agency"
                          name="agency"
                          autoComplete="organization"
                          placeholder="Your agency name"
                          className="h-11 rounded-xl border-[#CBD6E5] focus-visible:ring-[#2563EB]"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="topic" className="font-semibold text-[#1A365D]">
                          How can we help?
                        </Label>
                        <Select value={topic} onValueChange={setTopic}>
                          <SelectTrigger
                            id="topic"
                            className="h-11 w-full rounded-xl border-[#CBD6E5] focus:ring-[#2563EB]"
                          >
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {TOPIC_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="message" className="font-semibold text-[#1A365D]">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us how we can help..."
                        rows={4}
                        className="min-h-[100px] resize-y rounded-xl border-[#CBD6E5] focus-visible:ring-[#2563EB]"
                        required
                      />
                    </div>

                    <div className="flex justify-end border-t border-[#E2E8F5] pt-6">
                      <Button
                        type="submit"
                        className="h-11 rounded-xl bg-[#2563EB] px-6 font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-[#1D4ED8]"
                        disabled={sending}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? "Sending…" : "Send Message"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
