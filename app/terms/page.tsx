import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Terms of Service - SaferU",
  description: "Terms of Service governing your access to and use of SaferU website, digital tools, and related services.",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary/5 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="mt-2 text-muted-foreground">Last Updated: 3/15/2026</p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the SaferU website, digital tools, graphics, templates, and related services (collectively, the &quot;Services&quot;) provided by SaferU (&quot;SaferU,&quot; &quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By accessing or using the Services, including creating an account, you agree to be bound by these Terms. If you do not agree, you may not use the Services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              If you access the Services on behalf of an organization or agency, you represent that you have authority to bind that organization to these Terms.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">1. Nature of the Services</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU provides communication support tools, safety messaging, original graphics, and AI-assisted drafting functionality designed for public information and community engagement purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The Services are not intended for the storage, processing, or management of confidential, classified, evidentiary, or law enforcement-sensitive operational data.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              All content generated or provided through the Services is for drafting and informational purposes only. Users are responsible for reviewing and approving all content prior to public dissemination.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">2. Public Access and Membership Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Certain content may be publicly accessible. Additional content, including the &quot;What&apos;s New&quot; section and weekly updates, may require creation of a free membership account.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              By creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Provide accurate information</li>
              <li>Maintain the confidentiality of your login credentials</li>
              <li>Be responsible for activity under your account</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU reserves the right to suspend or terminate membership accounts at its discretion.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Membership access does not create any ownership interest in platform content.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">3. License to Use SaferU Graphics and Content</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU grants users a limited, non-exclusive, non-transferable license to use SaferU-created graphics, messaging, and templates solely for lawful public communication purposes.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2 font-medium text-foreground">Users may:</p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Share materials on official organizational platforms</li>
              <li>Use materials for community outreach</li>
              <li>Distribute materials in newsletters or public messaging</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2 font-medium text-foreground">Users may not:</p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Resell, sublicense, or commercially redistribute SaferU materials</li>
              <li>Remove or obscure SaferU branding where present</li>
              <li>Claim SaferU-created materials as their own intellectual property</li>
              <li>Copy or archive large portions of the &quot;What&apos;s New&quot; section for redistribution</li>
              <li>Use automated tools to scrape or download platform content</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              All intellectual property rights in SaferU-created materials remain the exclusive property of SaferU.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">4. Third-Party Images and Attribution</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Some graphics may incorporate publicly available or properly licensed third-party images. Where applicable, SaferU provides attribution to the original source.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Users are responsible for ensuring that their use complies with any applicable third-party licensing requirements.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">5. Artificial Intelligence Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU incorporates third-party artificial intelligence services, including OpenAI, to assist in content generation.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              AI-generated outputs may contain inaccuracies or unintended results. SaferU makes no representation or warranty regarding the accuracy, completeness, or legal sufficiency of AI-generated content.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Users must independently review all AI-assisted outputs prior to use.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">6. Prohibited Uses</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">You may not:</p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Submit confidential, classified, or restricted operational data</li>
              <li>Reverse engineer or attempt to access platform source code</li>
              <li>Use bots, scrapers, or automated systems to extract content</li>
              <li>Interfere with platform security or functionality</li>
              <li>Use the Services for unlawful or fraudulent purposes</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-10">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The Services are provided &quot;as is&quot; and &quot;as available.&quot;
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To the maximum extent permitted by law:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>SaferU shall not be liable for any indirect, incidental, consequential, special, punitive, or reputational damages arising from use of the Services.</li>
              <li>SaferU&apos;s total liability shall not exceed the amount paid by you to SaferU in the twelve (12) months preceding the claim. (If no payment has been made, liability shall not exceed $100.)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-10">9. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              You agree to indemnify and hold harmless SaferU and its affiliates from claims arising out of:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Your use of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Content you publish or distribute</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-10">10. Limited Time to Bring Claims</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Any claim arising out of or relating to the Services must be brought within one (1) year after the cause of action accrues.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania. Any dispute shall be brought exclusively in the state or federal courts located within Pennsylvania.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">12. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU may update these Terms at any time. Continued use of the Services constitutes acceptance of any revisions.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU
              <br />
              SaferU LLC
              <br />
              <a href="mailto:support@saferu.com" className="text-primary hover:underline">
                Support@SaferU.com
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
