import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Terms of Service - SaferU",
  description:
    "Terms of Service governing access to and use of the SaferU website, Content Library, Press Center, AI-assisted tools, and related services.",
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-muted-foreground leading-relaxed">{children}</p>
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-2xl font-semibold text-foreground">{children}</h2>
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary/5 py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Terms of Service</h1>
            <p className="mt-2 text-muted-foreground">Last Updated: September 15, 2026</p>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <P>
              These Terms of Service (&quot;Terms&quot;) govern access to and use of the SaferU website,
              Content Library, Press Center, artificial-intelligence-assisted tools, graphics,
              templates, software, and related services (collectively, the &quot;Services&quot;) provided by{" "}
              <strong className="font-semibold text-foreground">SaferU LLC</strong> (&quot;SaferU,&quot;
              &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </P>
            <P>
              By accessing the Services, creating an account, purchasing a subscription, clicking to
              accept these Terms, or otherwise using the Services, you agree to these Terms.
            </P>
            <P>
              If you access or use the Services for a police department, fire department, EMS
              organization, emergency management agency, municipality, government agency, nonprofit,
              company, or other organization (&quot;Organization&quot;), you represent that you are
              authorized to use the Services on behalf of that Organization and, where applicable,
              to bind the Organization to these Terms.
            </P>
            <P>If you do not agree to these Terms, do not use the Services.</P>

            <H2>1. SaferU Services</H2>
            <P>
              SaferU is a public-safety communications platform intended to assist authorized
              organizations with preparing community-facing communications.
            </P>
            <P>
              The Services may include a free Content Library and paid Press Center tools for
              creating materials such as press releases, social-media drafts, public video or
              witness requests, community-event communications, safety graphics, captions, talking
              points, translations, and related communications.
            </P>
            <P>
              SaferU provides{" "}
              <strong className="font-semibold text-foreground">
                drafting and communications assistance only
              </strong>
              .
            </P>
            <P>
              SaferU does not act as a public information officer, attorney, law-enforcement
              officer, emergency dispatcher, records custodian, investigative system,
              evidence-management system, computer-aided dispatch system, emergency notification
              service, or system of record.
            </P>
            <P>
              <strong className="font-semibold text-foreground">
                SaferU does not automatically publish or post content to Facebook, Instagram, X, or
                other public platforms.
              </strong>{" "}
              The user or Organization decides whether, when, and how any content is published.
            </P>

            <H2>2. Human Review and Agency Responsibility</H2>
            <P>All SaferU-generated or SaferU-assisted content is a draft.</P>
            <P>
              The Organization is solely responsible for reviewing, verifying, approving, editing,
              and authorizing content before publication or distribution.
            </P>
            <P>
              The Organization remains responsible for verifying factual accuracy, names, dates,
              charges, legal terminology, public-release eligibility, required redactions, victim
              and juvenile privacy, investigative sensitivity, accessibility requirements,
              translation accuracy, applicable departmental policies, and all legal requirements
              governing public disclosure.
            </P>
            <P>
              SaferU does not determine whether particular information may lawfully or appropriately
              be released to the public.
            </P>
            <P>
              Users should never rely on SaferU as the sole source for urgent life-safety
              information, emergency instructions, evacuation instructions, investigative decisions,
              probable-cause determinations, charging decisions, medical decisions, or operational
              law-enforcement decisions.
            </P>

            <H2>3. Accounts and Authorized Users</H2>
            <P>You must be at least 18 years old to create a SaferU account.</P>
            <P>
              You agree to provide accurate account information and to maintain the security of your
              credentials.
            </P>
            <P>
              Unless the applicable subscription, Order Form, or pricing plan expressly permits
              multiple Authorized Users, a Press Center subscription is limited to{" "}
              <strong className="font-semibold text-foreground">one Authorized User</strong>.
            </P>
            <P>Account credentials may not be shared between individuals.</P>
            <P>
              If SaferU offers multi-user plans, each Authorized User must use an individual
              account. The Organization&apos;s account owner or administrator may manage users,
              permissions, and account access as permitted by the applicable plan.
            </P>
            <P>
              The Organization is responsible for activities conducted through its accounts and by
              its Authorized Users.
            </P>
            <P>
              You must promptly notify SaferU if you suspect unauthorized access to your account.
            </P>

            <H2>4. Information That Must Not Be Submitted</H2>
            <P>
              SaferU is designed for preparing public-facing communications and is not intended to
              receive or store restricted operational information.
            </P>
            <P>
              Users must not submit information to SaferU unless they are authorized to disclose and
              process that information for the intended communication purpose.
            </P>
            <P>
              Without limiting the foregoing, users must not submit Criminal Justice Information
              (&quot;CJI&quot;), NCIC information, criminal-history record information, CJIS-regulated
              information, classified information, intelligence information, protected investigative
              databases, evidentiary files, tactical plans, passwords, authentication credentials,
              Social Security numbers, full financial-account information, protected health
              information governed by HIPAA, information under court seal, or other confidential or
              legally restricted information.
            </P>
            <P>
              Incident information submitted to SaferU should be limited to facts the Organization
              is authorized to use in preparing public communications.
            </P>
            <P>
              SaferU does not represent that the Services are CJIS-compliant, HIPAA-compliant, or
              approved for processing CJI, protected health information, classified material, or
              similar restricted information unless SaferU expressly agrees otherwise in a separate
              written agreement.
            </P>

            <H2>5. Artificial Intelligence</H2>
            <P>
              Certain Services use artificial-intelligence technology provided by third parties,
              including OpenAI.
            </P>
            <P>
              Depending on the feature used, information sent for AI processing may include prompts,
              incident or event information entered by the user, revision instructions, agency
              profile information, an agency logo, and other information needed to generate the
              requested output.
            </P>
            <P>
              AI-generated content may be inaccurate, incomplete, misleading, inappropriate,
              outdated, or similar to content generated for other users.
            </P>
            <P>
              SaferU does not warrant that AI-generated content is unique, factually accurate,
              legally sufficient, non-infringing, appropriate for publication, or suitable for any
              particular purpose.
            </P>
            <P>
              The Organization is solely responsible for reviewing AI-generated content before use.
            </P>
            <P>
              Translations generated through SaferU are also drafts and should be reviewed by a
              qualified speaker when accuracy is important.
            </P>
            <P>
              SaferU does not use Customer Content to independently train a proprietary SaferU AI
              model.
            </P>

            <H2>6. Customer Content and Agency Logos</H2>
            <P>
              &quot;Customer Content&quot; means information, text, instructions, logos, graphics, agency
              information, feedback incorporated into a requested output, or other material
              submitted through the Services by a user or Organization.
            </P>
            <P>You retain whatever ownership rights you have in your Customer Content.</P>
            <P>
              You represent and warrant that you have all rights, permissions, approvals, and
              authority necessary to provide Customer Content to SaferU and permit its use to
              provide the Services.
            </P>
            <P>
              This specifically includes authorization to use any agency name, badge, insignia,
              seal, logo, trademark, photograph, or other protected material uploaded to the
              Services.
            </P>
            <P>
              You grant SaferU and its service providers a limited, non-exclusive license to host,
              reproduce, transmit, process, modify, and otherwise use Customer Content solely as
              reasonably necessary to provide, secure, maintain, and support the Services and comply
              with applicable law.
            </P>
            <P>
              Uploading an agency logo does not give SaferU permission to use that logo for
              advertising, endorsements, or unrelated marketing.
            </P>

            <H2>7. Customer-Specific Outputs</H2>
            <P>
              &quot;Output&quot; means content specifically generated through Press Center or another SaferU
              creation tool in response to Customer Content.
            </P>
            <P>
              As between SaferU and the Organization, and to the extent permitted by applicable law,
              SaferU assigns to the Organization any rights SaferU may have in Customer-specific
              Output generated for that Organization.
            </P>
            <P>
              This includes agency-specific press releases, social-media drafts, event
              communications, video requests, captions, and agency-branded Graphic Studio materials.
            </P>
            <P>
              This does not transfer ownership of the SaferU platform, underlying software,
              templates, prompts, workflows, design systems, Content Library, trademarks, or other
              SaferU intellectual property.
            </P>
            <P>
              Because of the nature of artificial intelligence, Outputs may not be unique. Other
              users may receive identical or similar wording, concepts, images, layouts, or other
              content.
            </P>
            <P>
              SaferU does not guarantee that an Output qualifies for copyright protection or does
              not implicate third-party intellectual-property rights.
            </P>

            <H2>8. SaferU Content Library</H2>
            <P>
              SaferU may make graphics, captions, templates, and related materials available through
              its free Content Library (&quot;Library Materials&quot;).
            </P>
            <P>
              For Library Materials owned by SaferU, SaferU grants users a limited, revocable,
              non-exclusive, non-transferable license to copy, download, and use those materials for
              lawful public-safety, community-outreach, and public-information purposes.
            </P>
            <P>
              Users may publish SaferU Library Materials on official Organization websites,
              social-media accounts, newsletters, community communications, and similar channels.
            </P>
            <P>
              Users may not resell, sublicense, commercially redistribute, scrape, mass-download,
              mirror, or create a competing content library from SaferU Library Materials.
            </P>
            <P>
              Users may not falsely claim ownership of SaferU-created materials or remove SaferU
              branding where SaferU expressly requires branding to remain.
            </P>

            <H2>9. Third-Party Materials</H2>
            <P>
              Certain Library Materials may contain or reference content owned by governmental
              entities or other third parties.
            </P>
            <P>
              Third-party materials remain subject to the rights and restrictions imposed by their
              respective owners.
            </P>
            <P>
              A source citation or attribution does{" "}
              <strong className="font-semibold text-foreground">not</strong>, by itself, create a
              license or permission to use copyrighted or trademarked material.
            </P>
            <P>
              Where SaferU displays a separate license, attribution requirement, or usage
              restriction for an item, that requirement is incorporated into the permitted use of
              that item.
            </P>
            <P>Nothing in these Terms expands rights granted by a third-party owner.</P>

            <H2>10. Intellectual Property</H2>
            <P>
              Except for Customer Content and rights expressly granted in Customer-specific Output,
              SaferU owns or licenses all rights in the Services, including software, user
              interfaces, branding, databases, workflows, templates, platform functionality,
              SaferU-created Library Materials, and the SaferU name and marks.
            </P>
            <P>No rights are granted except those expressly stated in these Terms.</P>
            <P>
              Users may not copy the Services to develop or operate a competing content library,
              SaaS platform, AI communications platform, or similar service.
            </P>

            <H2>11. Intellectual-Property Complaints</H2>
            <P>
              If you believe material available through SaferU infringes your copyright, trademark,
              or other intellectual-property rights, contact{" "}
              <a href="mailto:support@saferu.com" className="font-medium text-foreground underline">
                support@saferu.com
              </a>{" "}
              and identify the material, the right allegedly infringed, your contact information,
              and the basis for your claim.
            </P>
            <P>
              SaferU may remove or restrict access to disputed material while reviewing a claim.
            </P>

            <H2>12. Press Center Subscriptions</H2>
            <P>Press Center is a paid subscription service.</P>
            <P>
              Subscription prices, included usage, available plans, and billing intervals are
              displayed at checkout, on SaferU&apos;s pricing page, or in an applicable Order Form.
            </P>
            <P>Subscriptions may be offered on monthly or annual terms.</P>
            <P>
              Unless an Order Form expressly provides otherwise, paid subscriptions automatically
              renew for successive periods of the same duration until canceled.
            </P>
            <P>
              Users may cancel through available account billing controls or by contacting SaferU.
              Cancellation stops future renewals but does not ordinarily produce a refund for the
              current subscription period.
            </P>
            <P>
              Except where required by law or expressly stated otherwise, subscription payments are
              non-refundable.
            </P>
            <P>
              If SaferU terminates a prepaid subscription without cause, SaferU may provide a
              prorated refund for the unused subscription period.
            </P>
            <P>
              SaferU may change pricing for future renewal periods after reasonable advance notice.
            </P>
            <P>
              Applicable taxes are the responsibility of the customer unless a valid tax exemption
              applies.
            </P>

            <H2>13. AI Usage and Token Credits</H2>
            <P>
              Press Center plans may include a specified quantity of AI usage or tokens during each
              monthly usage cycle.
            </P>
            <P>
              Unless otherwise stated for a particular plan, included monthly AI tokens reset each
              monthly usage cycle and do not roll over.
            </P>
            <P>Users may be able to purchase additional token credits.</P>
            <P>
              Purchased token credits are usage credits for SaferU Services only. They are not
              currency, stored value, cryptocurrency, or a financial product, have no cash value,
              cannot be transferred between unrelated accounts, and cannot be redeemed for cash.
            </P>
            <P>
              Purchased token credits do not expire solely because a monthly usage cycle ends. They
              remain associated with the account while the account is maintained and SaferU
              continues offering the applicable Services.
            </P>
            <P>
              An active Press Center subscription may be required to use purchased token credits.
            </P>
            <P>
              If an account is permanently deleted at the customer&apos;s request, unused purchased
              token credits associated with that account may be forfeited except where applicable
              law requires otherwise.
            </P>
            <P>
              SaferU may correct token balances resulting from fraud, chargebacks, technical errors,
              duplicate credits, or misuse.
            </P>

            <H2>14. Volunteer Fire and EMS Discounts</H2>
            <P>
              SaferU may offer discounted Press Center subscriptions to qualifying volunteer fire or
              EMS organizations.
            </P>
            <P>Eligibility is subject to verification and approval by SaferU.</P>
            <P>
              SaferU may request documentation reasonably necessary to verify eligibility and may
              periodically reverify eligibility.
            </P>
            <P>
              Discounts have no cash value, may not be transferred, and may not be combined with
              other offers unless SaferU expressly permits it.
            </P>

            <H2>15. Prohibited Uses</H2>
            <P>
              Users may not use the Services unlawfully, fraudulently, or in a manner that violates
              another person&apos;s rights.
            </P>
            <P>
              Users may not attempt to reverse engineer the Services, gain unauthorized access to
              systems or accounts, bypass security or usage limitations, scrape the Services, use
              automated systems to mass-extract content, distribute malware, interfere with platform
              operation, impersonate another agency or individual, upload material they lack
              permission to use, or use SaferU to intentionally generate deceptive or unlawful
              communications.
            </P>
            <P>
              Users may not falsely represent AI-generated content as having been verified,
              approved, or authored by SaferU.
            </P>

            <H2>16. Public Records and Records Retention</H2>
            <P>
              Organizations using SaferU may be subject to public-records, open-records,
              freedom-of-information, discovery, preservation, or governmental records-retention
              requirements.
            </P>
            <P>
              The Organization is solely responsible for determining and complying with those
              obligations.
            </P>
            <P>
              SaferU is{" "}
              <strong className="font-semibold text-foreground">
                not a governmental records-management, evidence-management, or archival system
              </strong>
              .
            </P>
            <P>
              Organizations should maintain official records in systems approved by the Organization
              for records retention.
            </P>
            <P>
              SaferU does not guarantee permanent availability of drafts, Outputs, logs, history, or
              locally stored information.
            </P>
            <P>
              Some SaferU functionality may store information only in the user&apos;s browser or
              device.
            </P>

            <H2>17. Third-Party Services</H2>
            <P>
              SaferU relies on third-party services to provide portions of the Services, including
              AI providers, hosting and infrastructure providers, email providers, authentication
              providers, and payment processors such as Stripe.
            </P>
            <P>
              Use of certain functionality may therefore depend upon third-party systems.
            </P>
            <P>
              SaferU is not responsible for third-party outages, modifications, or services outside
              SaferU&apos;s reasonable control.
            </P>

            <H2>18. Service Availability and Changes</H2>
            <P>SaferU may add, modify, improve, restrict, or discontinue features.</P>
            <P>
              Features identified as experimental, beta, preview, or otherwise under development may
              change or be removed without notice.
            </P>
            <P>
              Unless SaferU enters into a separate written service-level agreement, SaferU does not
              guarantee uninterrupted availability, uptime, response time, or error-free operation.
            </P>

            <H2>19. Suspension and Termination</H2>
            <P>
              SaferU may suspend or terminate access where reasonably necessary to address
              nonpayment, suspected fraud, security risks, violations of these Terms, unlawful
              conduct, abuse of the Services, or risks to SaferU, its customers, or third parties.
            </P>
            <P>Users may stop using the Services at any time.</P>
            <P>
              Sections that by their nature should survive termination—including
              intellectual-property provisions, disclaimers, limitations of liability,
              indemnification, payment obligations, dispute provisions, and restrictions on
              misuse—will survive.
            </P>

            <H2>20. Disclaimer of Warranties</H2>
            <P>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES AND ALL CONTENT ARE PROVIDED
              &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot;
            </P>
            <P>
              SAFERU DISCLAIMS ALL EXPRESS, IMPLIED, AND STATUTORY WARRANTIES, INCLUDING WARRANTIES
              OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AVAILABILITY,
              AND NON-INFRINGEMENT.
            </P>
            <P>
              SAFERU DOES NOT WARRANT THAT CONTENT IS FACTUALLY ACCURATE, COMPLETE, LEGALLY
              SUFFICIENT, APPROPRIATE FOR PUBLICATION, ERROR-FREE, OR SUITABLE FOR A PARTICULAR
              INCIDENT OR JURISDICTION.
            </P>

            <H2>21. Limitation of Liability</H2>
            <P>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAFERU AND ITS MEMBERS, MANAGERS, OFFICERS,
              EMPLOYEES, CONTRACTORS, AFFILIATES, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE
              LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, CONSEQUENTIAL, OR
              REPUTATIONAL DAMAGES, OR FOR LOST PROFITS, LOST REVENUE, LOST DATA, BUSINESS
              INTERRUPTION, LOSS OF GOODWILL, OR COSTS OF SUBSTITUTE SERVICES.
            </P>
            <P>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAFERU&apos;S TOTAL AGGREGATE LIABILITY ARISING
              OUT OF OR RELATING TO THE SERVICES OR THESE TERMS, REGARDLESS OF THE THEORY OF
              LIABILITY, WILL NOT EXCEED THE AMOUNT PAID TO SAFERU BY THE CUSTOMER DURING THE
              TWELVE MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </P>
            <P>
              IF THE CUSTOMER HAS PAID NOTHING TO SAFERU DURING THAT PERIOD, SAFERU&apos;S AGGREGATE
              LIABILITY WILL NOT EXCEED $100.
            </P>
            <P>
              THESE LIMITATIONS APPLY EVEN IF SAFERU HAS BEEN ADVISED THAT DAMAGES ARE POSSIBLE.
            </P>
            <P>
              Nothing in these Terms excludes liability that applicable law does not permit to be
              excluded or limited.
            </P>

            <H2>22. Indemnification</H2>
            <P>
              To the fullest extent permitted by applicable law, you and the Organization you
              represent agree to defend, indemnify, and hold harmless SaferU LLC and its members,
              managers, officers, employees, contractors, affiliates, licensors, and service
              providers from third-party claims, liabilities, damages, judgments, losses, costs, and
              reasonable attorneys&apos; fees arising from or related to Customer Content; materials,
              logos, or information supplied by you; your publication or distribution of Outputs;
              your violation of law or third-party rights; your violation of these Terms;
              unauthorized or improper use of the Services; or actions taken by your Authorized
              Users.
            </P>
            <P>
              For governmental entities legally prohibited from providing contractual
              indemnification, this Section applies only to the maximum extent permitted by
              applicable law and does not require an unlawful waiver of governmental immunity.
            </P>

            <H2>23. Government Organizations and Procurement Terms</H2>
            <P>
              Use of a purchase order, procurement document, vendor-registration form, or similar
              document does not modify these Terms merely because the document contains different or
              additional terms.
            </P>
            <P>
              Different terms bind SaferU only where they are expressly agreed to in a written
              agreement executed by an authorized representative of SaferU.
            </P>
            <P>
              If SaferU and an Organization enter into a separately signed agreement or Order Form
              that expressly conflicts with these Terms, the signed agreement or Order Form will
              control to the extent of the conflict.
            </P>
            <P>
              Nothing in these Terms requires a governmental entity to waive sovereign,
              governmental, or statutory immunity where such a waiver is prohibited by law.
            </P>

            <H2>24. Limited Time to Bring Claims</H2>
            <P>
              To the maximum extent permitted by law, any claim arising out of or relating to the
              Services or these Terms must be commenced within one year after the claim accrued.
              Otherwise, the claim is permanently barred.
            </P>

            <H2>25. Governing Law and Venue</H2>
            <P>
              These Terms are governed by the laws of the Commonwealth of Pennsylvania, without
              regard to conflict-of-law principles.
            </P>
            <P>
              To the maximum extent permitted by applicable law, disputes arising from or relating
              to these Terms or the Services must be brought exclusively in a state or federal court
              located in Pennsylvania, unless a separately executed agreement provides otherwise.
            </P>

            <H2>26. Changes to These Terms</H2>
            <P>SaferU may update these Terms from time to time.</P>
            <P>
              If a change materially affects users&apos; rights or obligations, SaferU may provide
              additional notice through the Services, by email, or by another reasonable method.
            </P>
            <P>The updated Terms will identify their effective date.</P>
            <P>
              Continued use of the Services after updated Terms become effective constitutes
              acceptance of the updated Terms to the extent permitted by law.
            </P>
            <P>
              Changes to subscription pricing ordinarily apply prospectively and will not change
              prepaid pricing during an existing paid subscription period unless required by law or
              expressly agreed.
            </P>

            <H2>27. General Terms</H2>
            <P>
              If any provision of these Terms is held unenforceable, the remaining provisions will
              remain in effect and the invalid provision will be enforced to the maximum extent
              permitted by law.
            </P>
            <P>
              Failure to enforce a provision does not waive the right to enforce it later.
            </P>
            <P>
              You may not assign your rights under these Terms without SaferU&apos;s consent. SaferU
              may assign these Terms in connection with a merger, acquisition, financing, corporate
              reorganization, or sale of all or substantially all of its relevant assets or
              business.
            </P>
            <P>
              SaferU is not responsible for delay or failure caused by circumstances beyond its
              reasonable control.
            </P>
            <P>
              These Terms, together with any applicable Order Form or separately executed agreement,
              constitute the agreement concerning use of the Services.
            </P>

            <H2>28. Contact</H2>
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
