import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy - SaferU",
  description: "How SaferU collects, uses, discloses, and safeguards your information when you use our website and services.",
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary/5 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-2 text-muted-foreground">Last Updated: 3/15/2026</p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              SaferU (&quot;SaferU,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy and is committed to protecting the information you provide when accessing our website and services (the &quot;Services&quot;).
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              This Privacy Policy explains how we collect, use, disclose, and safeguard information when you access our website, create an account, or use our Services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By using the Services, you agree to the terms of this Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We may collect the following categories of information:
            </p>

            <h3 className="text-xl font-semibold text-foreground mt-6">A. Account Information</h3>
            <p className="text-muted-foreground leading-relaxed mt-2">
              If you create a free membership account, we may collect:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Name</li>
              <li>Email address</li>
              <li>Organization or agency affiliation</li>
              <li>Login credentials</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">B. User-Submitted Content</h3>
            <p className="text-muted-foreground leading-relaxed mt-2">
              If you use AI-assisted features, we may process:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Prompts you submit</li>
              <li>Generated outputs</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">C. Technical and Usage Information</h3>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We may automatically collect:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device information</li>
              <li>Access timestamps</li>
              <li>Pages visited</li>
              <li>Interaction data</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6">D. Payment Information (If Applicable)</h3>
            <p className="text-muted-foreground leading-relaxed mt-2">
              If you purchase a paid subscription in the future, payments will be processed by Stripe, Inc. SaferU does not store full credit card numbers or sensitive payment credentials.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">2. How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We use collected information to:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Provide and maintain the Services</li>
              <li>Create and manage membership accounts</li>
              <li>Deliver weekly &quot;What&apos;s New&quot; content</li>
              <li>Improve platform functionality and security</li>
              <li>Communicate service-related updates</li>
              <li>Respond to inquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We do not sell, rent, or trade personal information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">3. Artificial Intelligence Processing</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU incorporates third-party artificial intelligence services, including OpenAI, to assist in generating content.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              User-submitted prompts may be transmitted to such providers solely for the purpose of generating requested outputs.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU does not use customer-submitted content to independently train proprietary AI models.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Users are responsible for ensuring they do not submit confidential, classified, or restricted operational information into AI-assisted tools.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">4. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We may share information with trusted service providers that support our operations, including:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Cloud hosting providers</li>
              <li>AI processing providers (e.g., OpenAI)</li>
              <li>Payment processors (Stripe, if applicable)</li>
              <li>Email service providers</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              These providers process information pursuant to contractual safeguards.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We may also disclose information:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>To comply with legal obligations</li>
              <li>To protect rights, property, or safety</li>
              <li>In connection with a merger, acquisition, or business transfer</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU does not sell personal information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We retain personal information only as long as reasonably necessary to:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1 text-muted-foreground">
              <li>Provide the Services</li>
              <li>Maintain business records</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              You may request deletion of your account by contacting us at the email below.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU implements commercially reasonable administrative, technical, and physical safeguards designed to protect personal information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              However, no internet-based system can guarantee absolute security.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">7. California Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To the extent applicable under the California Consumer Privacy Act (CCPA), California residents may request access to, correction of, or deletion of their personal information, subject to legal exceptions.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU does not sell personal information.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Requests may be submitted to:{" "}
              <a href="mailto:support@saferu.com" className="text-primary hover:underline">
                support@saferu.com
              </a>
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">8. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The Services are not directed to individuals under the age of 13. SaferU does not knowingly collect personal information from children.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">9. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              The Services may contain links to third-party websites. SaferU is not responsible for the privacy practices of external sites.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU may update this Privacy Policy at any time. Changes will be effective upon posting.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-10">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed mt-2">
              SaferU
              <br />
              SaferU LLC
              <br />
              <a href="mailto:support@saferu.com" className="text-primary hover:underline">
                support@saferu.com
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
