"use client"

import React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
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
import { Mail, MessageSquare, Send, CheckCircle } from "lucide-react"

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
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Contact Us
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Have questions or feedback? We would love to hear from you.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3">
              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Email</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href="mailto:support@saferu.com"
                      className="text-primary hover:underline"
                    >
                      support@saferu.com
                    </a>
                    <p className="mt-2 text-sm text-muted-foreground">
                      We typically respond within 24 hours.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      We are always looking to improve. Share your ideas for new
                      content categories or features you would like to see.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Send us a message</CardTitle>
                    <CardDescription>
                      Fill out the form below and we will get back to you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {submitted ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-foreground">
                          Message Sent!
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          Thank you for reaching out. We will get back to you
                          soon.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-6 bg-transparent"
                          onClick={() => setSubmitted(false)}
                        >
                          Send another message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                          </p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Your name" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@agency.gov"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="agency">Agency (optional)</Label>
                          <Input
                            id="agency"
                            placeholder="Your agency name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="topic">Topic</Label>
                          <Select value={topic} onValueChange={setTopic}>
                            <SelectTrigger>
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

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            placeholder="How can we help you?"
                            rows={5}
                            required
                          />
                        </div>

                        <Button type="submit" className="w-full sm:w-auto" disabled={sending}>
                          <Send className="mr-2 h-4 w-4" />
                          {sending ? "Sending…" : "Send Message"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
