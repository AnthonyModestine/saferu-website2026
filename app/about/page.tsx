import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Shield, Users, Clock, CheckCircle, ArrowRight } from "lucide-react"

export const metadata = {
  title: "About - SaferU",
  description: "Learn about SaferU: ready-to-share safety content and Press Center for confident public safety communication.",
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
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                About SaferU
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                SaferU helps public safety agencies and local government communicate clearly with their communities. Ready-to-share safety content plus tools to draft press releases and community requests—so you can inform, educate, and protect.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold text-foreground">Our Mission</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Creating clear social media content, professional press releases, and community requests takes time many agencies don’t have.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                SaferU provides a free content library and Press Center. Press Center helps agencies draft clear, structured public messaging in minutes—without compromising oversight or professionalism.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-foreground">
              What We Offer
            </h2>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  Free Content Library
                </h3>
                <p className="mt-4 text-muted-foreground">
                  A curated library of ready-to-share social media safety content
                  and templates. Browse by category, copy captions, and download
                  graphics instantly.
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
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  Press Center
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Confident communication for public safety. Draft press releases and community requests with guided drafting and consistent tone. All messaging is reviewed and finalized by your team before distribution. Download a branded PDF that includes your agency logo, or copy into your workflow.
                </p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Press releases for media and public statements
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Community requests for footage and tips—for social media and community platforms
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Structured wording to protect your agency
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Branded PDF with your agency logo; fits your workflow
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
              <h2 className="mt-6 text-3xl font-bold text-foreground">
                Who We Serve
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">
                SaferU is for PIOs, social media managers, and anyone who communicates for public safety—at police and fire departments, EMS, emergency management, and city or county government.
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
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Start with ready-to-share safety content, or add Press Center to draft press releases and community requests.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href="/member-site">
                Join Free
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
