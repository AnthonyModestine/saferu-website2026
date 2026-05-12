import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Users, Clock, CheckCircle, ArrowRight } from "lucide-react"

export const metadata = {
  title: "About - SaferU",
  description: "SaferU is a public safety communications platform built for police, fire, and emergency management agencies.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary/5 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-[#1a365d] sm:text-5xl">
                About SaferU
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                SaferU is a public safety communications platform built for police, fire, and emergency management agencies. It helps departments share clear, timely information with their communities without adding to their workload. Designed for teams with limited time and resources, SaferU makes it easier to communicate consistently and professionally.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold text-[#1a365d]">Our Mission</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Public safety agencies are expected to communicate quickly and clearly, but many teams do not have the time or staffing to manage that process effectively. Writing, reviewing, and sharing information can slow operations and create unnecessary strain.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                SaferU exists to support agencies in delivering accurate, professional communication—especially those working with limited resources. The platform provides practical tools and ready-to-use content so departments can keep their communities informed without adding to their workload.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-[#1a365d]">
              What We Offer
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-[#1a365d]">
                  Free Content Library
                </h3>
                <p className="mt-4 text-muted-foreground">
                  A curated library of ready-to-share safety messaging designed for public safety agencies. Built to help teams communicate common safety topics quickly, especially when time and resources are limited.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Crime Prevention
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Fire Prevention
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Weather Preparedness
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Natural Disaster
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Community Awareness
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {"What's New"}
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/30">
                  <Clock className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-[#1a365d]">
                  Press Center
                </h3>
                <p className="mt-4 text-muted-foreground">
                  A structured drafting tool that helps agencies create clear, professional messaging for public release. Designed to support your process while saving time.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Draft press releases based on key facts
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Create community requests for tips or video
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Maintain consistent tone and structure
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Export content or copy into your workflow
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Translate messaging into Spanish
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="mt-6 text-3xl font-bold text-[#1a365d]">
                Who We Serve
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                SaferU is built for public safety professionals responsible for communicating with their communities, including agencies with limited staff or dedicated communication resources. It supports teams that need to share information clearly, quickly, and professionally.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  "Police Departments",
                  "Fire Departments",
                  "EMS Agencies",
                  "Emergency Management",
                  "City/County Government",
                  "Sheriff's Offices",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Start communicating with confidence
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Join SaferU and give your team the tools to share clear, accurate information—without adding to your workload.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/member-site">
                Join Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
