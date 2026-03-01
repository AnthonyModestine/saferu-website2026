import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle, FileText, Shield, AlertTriangle, Mail } from "lucide-react"

const faqs = [
  {
    question: "How does the AI generate press releases?",
    answer:
      "The AI uses your structured input to generate professional press releases. It follows strict guidelines to only use facts you provide, never inventing information. The AI automatically removes speculation, opinions, and emotional language to ensure legally safe communications.",
  },
  {
    question: "When should I use 'alleged' in my press release?",
    answer:
      "Use 'alleged' when actions are unconfirmed. If actions are confirmed by officers, video evidence, or reliable witnesses and you indicate this in the form, the AI will write them as facts without 'alleged.' For unconfirmed actions, the AI automatically uses 'alleged' or neutral language.",
  },
  {
    question: "How do I protect a minor's identity?",
    answer:
      "When adding a person entry, check the 'Minor (do not release name)' checkbox. The AI will automatically exclude the minor's name and use appropriate language like 'a juvenile' or 'a minor.'",
  },
  {
    question: "Can I edit the generated press release?",
    answer:
      "Yes! The generated press release is a starting point. You can copy it and make any necessary edits before distribution. We recommend reviewing all AI-generated content before publication.",
  },
  {
    question: "What information should I NOT include?",
    answer:
      "Avoid including: criminal history of suspects, speculation about intoxication, witness emotions or reactions, unconfirmed identities, and any information that could compromise an ongoing investigation.",
  },
  {
    question: "How do I export my press release?",
    answer:
      "After generating a press release, you can export it as PDF from the preview panel. The downloaded PDF includes a finalized version of your press release with your agency's logo on it. You can also view and export past releases from the History page.",
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">
          Press Center helps agencies draft clear, structured public messaging. AI assists with wording; final review always remains with your team.
        </p>
      </div>

      {/* Quick Tips */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Facts Only</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Enter only confirmed facts. The AI will not invent information and
              will automatically clean speculation from your input.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Legal Safety</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              The AI follows strict guardrails to ensure your press releases are
              legally safe and professionally written.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-base">Review Before Publishing</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Always review AI-generated content before distribution. Make any
              necessary edits to ensure accuracy.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/30">
                <Mail className="h-5 w-5 text-accent-foreground" />
              </div>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Contact our support team at support@saferu.com for assistance with
              the Press Center.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
