import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Privacy Policy - SaferU",
  description:
    "How SaferU collects, uses, processes, discloses, and retains personal information for the SaferU website, Content Library, Press Center, and related services.",
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-muted-foreground leading-relaxed">{children}</p>
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-2xl font-semibold text-foreground">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-xl font-semibold text-foreground">{children}</h3>
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary/5 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
            <p className="mt-2 text-muted-foreground">Last Updated: September 15, 2026</p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <P>
              SaferU LLC (&quot;SaferU,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects the privacy of individuals who
              visit our website, create an account, or use SaferU services.
            </P>
            <P>
              This Privacy Policy explains how SaferU collects, uses, processes, discloses, and
              retains personal information in connection with the SaferU website, Content Library,
              Press Center, AI-assisted tools, and related services (collectively, the
              &quot;Services&quot;).
            </P>

            <H2>1. Information We Collect</H2>

            <H3>Account Information</H3>
            <P>
              When you create an account, we may collect your name, email address, Organization or
              agency affiliation, department type, authentication information, password hash or
              authentication tokens, account status, and related account information.
            </P>

            <H3>Organization Profile Information</H3>
            <P>
              Press Center users may provide an Organization name, Organization type, service area,
              agency logo, boilerplate language, media contacts, and similar information used to
              customize Outputs.
            </P>

            <H3>Customer Content</H3>
            <P>
              When you use Press Center or AI-assisted features, we may process information you
              submit, including prompts, incident or event information, topics, revision
              instructions, agency profile information, agency logos, and other content needed to
              provide the requested feature.
            </P>
            <P>
              Depending on the feature, SaferU may process or store generated Outputs, associated
              metadata, generation history, or usage logs.
            </P>
            <P>
              Some drafts, events, history, preferences, or similar information may instead be
              stored locally in your web browser or device rather than on SaferU&apos;s servers.
            </P>

            <H3>Payment and Subscription Information</H3>
            <P>
              If you purchase a paid Service, payments are processed through third-party payment
              processors such as Stripe.
            </P>
            <P>SaferU does not store full payment-card numbers or card security codes.</P>
            <P>
              We may receive and retain information such as a Stripe customer identifier,
              subscription status, billing plan, payment status, transaction records, billing
              contact information, limited payment-method information, and purchase history.
            </P>

            <H3>AI Usage Information</H3>
            <P>
              SaferU may maintain information about AI usage, token usage, purchased token credits,
              monthly allowances, generation requests, and related metering information necessary to
              operate Press Center.
            </P>

            <H3>Technical and Usage Information</H3>
            <P>
              We may automatically collect IP address, browser and device information, operating
              system information, timestamps, pages or features accessed, session information,
              diagnostic information, security events, and interaction data.
            </P>

            <H3>Communications</H3>
            <P>
              If you contact SaferU, request support, apply for a volunteer discount, submit
              feedback, or otherwise communicate with us, we may retain the information contained in
              that communication.
            </P>

            <H2>2. Cookies and Local Storage</H2>
            <P>
              SaferU may use cookies, browser storage, authentication tokens, and similar
              technologies to keep users signed in, remember preferences, maintain security,
              operate account functionality, store certain drafts or settings, measure usage, and
              improve the Services.
            </P>
            <P>
              Information stored locally on your device may remain on that device until you clear
              browser data, delete it through an available feature, or otherwise remove it.
            </P>
            <P>
              Clearing browser data may permanently delete locally stored SaferU drafts or
              information.
            </P>

            <H2>3. How We Use Information</H2>
            <P>
              SaferU uses information to provide and operate the Services; create and authenticate
              accounts; customize Press Center for an Organization; generate requested content;
              process agency logos; provide AI-assisted functionality; track subscription and token
              usage; process and administer payments; provide customer support; maintain security;
              detect fraud or misuse; troubleshoot and improve functionality; communicate
              service-related information; administer discounts; comply with legal obligations;
              enforce our Terms; and protect SaferU, our users, and others.
            </P>
            <P>
              We may also use aggregated or de-identified information for analytics, product
              development, capacity planning, and understanding how the Services are used.
            </P>

            <H2>4. Artificial Intelligence Processing</H2>
            <P>
              SaferU uses third-party artificial-intelligence services, including OpenAI, to provide
              certain Press Center features.
            </P>
            <P>
              When you request an AI-assisted feature, SaferU may transmit information necessary to
              complete the request to the applicable AI provider. Depending on the feature, this may
              include user-entered information, agency profile information, agency logos, prompts,
              revision instructions, and other Customer Content.
            </P>
            <P>
              SaferU does not independently use Customer Content to train a proprietary SaferU AI
              model.
            </P>
            <P>
              Under SaferU&apos;s current use of OpenAI business/API services, OpenAI states that API
              inputs and outputs are not used to train OpenAI models by default. SaferU does not
              intentionally opt Customer Content into model training without separate notice or
              authorization.
            </P>
            <P>
              AI providers may process information as necessary to provide their services, maintain
              security, prevent abuse, and comply with applicable law and their applicable
              contractual obligations.
            </P>

            <H2>5. Restricted Information</H2>
            <P>SaferU is designed for preparing public-facing communications.</P>
            <P>
              Users should not submit Criminal Justice Information, NCIC information,
              criminal-history record information, CJIS-regulated information, classified
              information, evidentiary material, tactical information, protected health information,
              Social Security numbers, full financial-account information, authentication
              credentials, information under seal, or other confidential or legally restricted
              information.
            </P>
            <P>
              Users should submit incident information only when authorized to use that information
              for the intended public-communication purpose.
            </P>
            <P>
              SaferU does not represent that the Services are approved for storing or processing
              CJI, protected health information, classified information, or similar restricted data.
            </P>

            <H2>6. How We Disclose Information</H2>
            <P>
              SaferU may disclose information to vendors and service providers that assist us in
              operating the Services.
            </P>
            <P>
              These may include AI providers such as OpenAI; payment processors such as Stripe;
              cloud-hosting and infrastructure providers; database providers; email and
              customer-support providers; authentication and security providers; analytics
              providers; and professional advisers such as attorneys, accountants, insurers, and
              auditors.
            </P>
            <P>
              These providers may process information only in connection with the services they
              provide to SaferU and subject to applicable contractual and legal obligations.
            </P>
            <P>
              SaferU may also disclose information where reasonably necessary to comply with law,
              regulation, subpoena, court order, governmental request, or legal process; investigate
              fraud or security incidents; enforce agreements; protect the rights, property,
              security, or safety of SaferU, our users, or others; or complete a merger,
              acquisition, financing, restructuring, sale of assets, or similar corporate
              transaction.
            </P>

            <H2>7. Sale of Personal Information</H2>
            <P>
              SaferU does <strong className="font-semibold text-foreground">not sell personal information</strong> in
              exchange for money.
            </P>
            <P>
              SaferU does not currently share personal information for cross-context behavioral
              advertising.
            </P>
            <P>
              If these practices materially change, SaferU will update this Privacy Policy and
              provide any choices required by applicable law.
            </P>

            <H2>8. Organization-Managed Accounts</H2>
            <P>
              Where a SaferU subscription permits multiple users under one Organization account, the
              Organization&apos;s account owner or administrator may be able to invite or remove users,
              manage permissions, view account status, and access certain usage information relating
              to Authorized Users.
            </P>
            <P>
              Users of Organization-managed accounts should understand that their Organization may
              control their access to the Services.
            </P>

            <H2>9. Public Records and Legal Process</H2>
            <P>
              Organizations using SaferU may be subject to public-records, open-records,
              freedom-of-information, discovery, litigation-hold, or governmental records-retention
              requirements.
            </P>
            <P>The Organization is responsible for determining its obligations under those laws.</P>
            <P>
              SaferU is not intended to serve as an official government records-management or
              archival system.
            </P>
            <P>
              Information provided to SaferU may also be disclosed where SaferU is legally required
              to respond to valid legal process.
            </P>

            <H2>10. Data Retention</H2>
            <P>
              SaferU retains personal information for as long as reasonably necessary for the
              purposes described in this Policy, including providing the Services, maintaining an
              active account, processing payments, maintaining financial and business records,
              preventing fraud and abuse, resolving disputes, enforcing agreements, and complying
              with applicable law.
            </P>
            <P>Different categories of information may be retained for different periods.</P>
            <P>
              When information is no longer reasonably necessary, SaferU may delete, anonymize, or
              de-identify it.
            </P>
            <P>
              Information may remain temporarily in backups after deletion from active systems.
            </P>
            <P>
              SaferU may retain transaction, security, fraud-prevention, legal, or other records
              where retention is reasonably necessary or legally required.
            </P>
            <P>
              Information stored locally in a user&apos;s browser or device is controlled through that
              browser or device and may not be deleted when SaferU deletes server-side information.
            </P>

            <H2>11. Account Deletion</H2>
            <P>
              Users may request deletion of their SaferU account by contacting{" "}
              <a href="mailto:support@saferu.com" className="font-medium text-foreground underline">
                support@saferu.com
              </a>
              .
            </P>
            <P>
              Deletion requests are subject to identity verification and applicable legal
              exceptions.
            </P>
            <P>
              Deleting an account may result in permanent loss of access to saved information and
              may result in forfeiture of unused purchased token credits as described in the Terms
              of Service.
            </P>
            <P>
              Certain records may be retained where reasonably necessary for legal compliance,
              payment records, security, fraud prevention, dispute resolution, or enforcement of
              agreements.
            </P>

            <H2>12. Data Security</H2>
            <P>
              SaferU uses commercially reasonable administrative, technical, and organizational
              safeguards designed to protect personal information against unauthorized access,
              acquisition, alteration, destruction, or disclosure.
            </P>
            <P>
              These measures may include access controls, authentication protections, encryption or
              secure transmission where appropriate, service-provider controls, monitoring, and
              other safeguards appropriate to the information processed.
            </P>
            <P>No internet-based service can guarantee absolute security.</P>
            <P>
              Users are responsible for maintaining the confidentiality of their account credentials
              and promptly notifying SaferU of suspected unauthorized access.
            </P>

            <H2>13. Security Incidents</H2>
            <P>
              SaferU maintains processes intended to investigate and respond to suspected security
              incidents.
            </P>
            <P>
              If SaferU determines that a security incident requires notification under applicable
              law, SaferU will provide legally required notices to affected individuals, customers,
              governmental authorities, or other parties as applicable.
            </P>

            <H2>14. U.S. State Privacy Rights</H2>
            <P>
              Depending on your state of residence and whether the applicable privacy law covers
              SaferU or a particular processing activity, you may have rights concerning your
              personal information.
            </P>
            <P>
              These rights may include requesting access to or confirmation of personal information,
              correction of inaccurate information, deletion of information, obtaining a portable
              copy of certain information, or opting out of certain types of sale, sharing, or
              targeted advertising.
            </P>
            <P>
              Certain states may also provide a right to appeal the denial of a privacy request.
            </P>
            <P>
              These rights are subject to statutory definitions, exemptions, verification
              requirements, and exceptions.
            </P>
            <P>SaferU does not sell personal information.</P>
            <P>
              Requests may be submitted to{" "}
              <a href="mailto:support@saferu.com" className="font-medium text-foreground underline">
                support@saferu.com
              </a>
              .
            </P>
            <P>
              SaferU will not unlawfully discriminate against an individual for exercising an
              applicable privacy right.
            </P>

            <H2>15. California Privacy</H2>
            <P>
              Where the California Consumer Privacy Act or related California privacy requirements
              apply to SaferU and the requesting individual, SaferU will process applicable access,
              correction, deletion, and other requests in accordance with California law.
            </P>
            <P>
              Certain information or relationships may be exempt from some statutory requirements.
            </P>
            <P>SaferU does not sell personal information.</P>

            <H2>16. Children&apos;s Privacy</H2>
            <P>
              SaferU accounts and Press Center are intended for authorized adult users acting on
              behalf of organizations.
            </P>
            <P>Individuals under 18 should not create SaferU accounts.</P>
            <P>
              SaferU does not knowingly collect personal information from children under 13 through
              account registration.
            </P>
            <P>
              If SaferU learns that personal information from a child was improperly collected,
              SaferU may delete the information as appropriate.
            </P>

            <H2>17. Third-Party Websites</H2>
            <P>The Services may contain links to third-party websites or resources.</P>
            <P>
              SaferU does not control and is not responsible for the privacy, security, content, or
              practices of third-party websites.
            </P>
            <P>Users should review the policies of those services separately.</P>

            <H2>18. Processing Locations</H2>
            <P>
              SaferU and its service providers may process information in the United States and
              other locations where applicable service providers operate.
            </P>
            <P>
              SaferU does not represent that all Customer Content will remain exclusively within a
              particular state or geographic location unless SaferU expressly agrees to a
              data-location requirement in a separate written agreement.
            </P>

            <H2>19. Changes to This Privacy Policy</H2>
            <P>
              SaferU may update this Privacy Policy as the Services, technologies, vendors, or legal
              requirements change.
            </P>
            <P>The current version will display its updated date.</P>
            <P>
              Where a change materially affects how personal information is collected, used, or
              disclosed, SaferU may provide additional notice where appropriate or required by law.
            </P>

            <H2>20. Contact</H2>
            <P>Questions, privacy requests, or concerns may be sent to:</P>
            <P>
              <strong className="font-semibold text-foreground">SaferU LLC</strong>
            </P>
            <P>
              <a href="mailto:support@saferu.com" className="font-medium text-foreground underline">
                support@saferu.com
              </a>
            </P>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
