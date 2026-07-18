# SaferU — Product & UX Steering Document

**Status:** Living steering document
**Audience:** Product, design, engineering, content, and anyone contributing to SaferU
**Last updated:** July 2026

## Purpose

This document defines what SaferU is, why it exists, whom it serves, and how product and UX decisions should be made.

It is not a screen inventory, technical specification, or list of current features. It is the source of truth for the product’s purpose, priorities, principles, and direction.

When deciding what to build, how a feature should operate, or whether something belongs in SaferU, start here.

## Reference documents

These documents contain more detailed implementation guidance:

* `SAFERU-UI-UX.md` — sitewide surfaces, navigation, shells, components, and interface patterns
* `AI-POST-GENERATOR-UI-UX.md` — AI Post Generator interface and recommendation experience
* Future feature-specific documents — detailed requirements for Press Releases, Video Requests, Events, Content Library, and other product areas

When this steering document conflicts with a reference document, this steering document takes priority until the reference document is updated.

---

# 1. Why SaferU Exists

Thousands of public safety and local government agencies understand the importance of communicating with their communities, but many do not have a dedicated Public Information Officer or communications team.

Communication responsibilities often fall to someone who is already managing several other jobs, including:

* Police chiefs
* Fire chiefs
* Sheriffs
* Deputy chiefs
* Captains and lieutenants
* Emergency management coordinators
* Borough, township, and municipal managers
* Administrative employees
* Dispatchers
* Officers, firefighters, and other agency staff

These professionals may be responsible for operations, staffing, emergencies, investigations, budgets, personnel, and community communication at the same time.

Communication becomes inconsistent not because agencies do not care about it, but because time, staffing, expertise, and resources are limited.

Even agencies with dedicated PIOs face the same pressure. They must quickly determine what deserves communication, verify information, choose the right message, write for multiple channels, and maintain a professional agency voice.

Every community deserves timely, clear, preventative, and trustworthy communication regardless of the size or resources of the agency serving it.

SaferU exists to give every agency the ability to communicate like it has a professional communications team—whether it has one or not.

## Better Communication Builds Safer Communities.

This belief should guide every product decision.

Better communication helps residents:

* Understand risks
* Prepare for emergencies
* Avoid preventable incidents
* Make informed decisions
* Know what their agency is doing
* Build trust in local institutions
* Feel connected to the people serving their community

SaferU is not simply a writing tool. It is designed to improve the connection between agencies and the communities they serve.

---

# 2. North Star

SaferU helps public safety agencies and local governments communicate clearly, consistently, and confidently—with trusted content and an AI communications assistant that thinks like a Public Information Officer.

Whether an agency has a dedicated PIO or a chief handling communications between everything else, SaferU should reduce the time, effort, and uncertainty required to keep the community informed.

Every feature should support this question:

> How can we help this agency communicate better today?

Not:

> How can we add another AI feature?

## North-star product test

Before developing or approving a feature, ask:

> Would a busy chief, PIO, or agency employee say this saves time, improves their communication, and helps them serve residents more effectively?

If the answer is unclear, the feature should be reconsidered.

---

# 3. Product Mission

SaferU’s mission is to make professional public safety communication accessible to every agency.

SaferU helps agencies:

* Know what deserves communication
* Understand why it matters to residents
* Draft clear and professional messages
* Communicate consistently
* Share preventative information
* Prepare residents for upcoming risks and disruptions
* Build public trust
* Reduce blank-page time
* Make better use of limited staff and resources

Communication quality should not depend on whether an agency can afford a full-time communications team.

---

# 4. What SaferU Is

SaferU is a public safety and local government communications platform that combines:

* A trusted safety content library
* AI-assisted drafting tools
* Communication opportunity recommendations
* Event communication campaigns
* Preventative messaging
* Agency-specific communication guidance
* A structured Press Center workspace

SaferU helps agencies move from:

> We should probably post something.

to:

> Here is what your community needs to know, why it matters, and a professional message your agency can review and use.

## SaferU is not

SaferU is not:

* A news aggregator
* A police scanner
* A dispatch console
* A generic AI chatbot
* A consumer safety blog
* A general social media scheduler
* A replacement for agency judgment
* A system that publishes without human review
* A feed of every event occurring nearby
* A full records management or emergency notification platform

---

# 5. Who We Serve

SaferU should be designed first for the person responsible for agency communication—not only for someone whose job title is Public Information Officer.

## P0: Agencies without a dedicated PIO

These agencies receive some of SaferU’s greatest value.

Communication may be handled by a chief, officer, firefighter, emergency management coordinator, administrative employee, or municipal manager who is already responsible for many other duties.

### Core job

Help me communicate professionally without requiring communications expertise, extensive time, or a dedicated staff.

### Their needs

* Tell me what deserves communication
* Help me start quickly
* Give me something professional to review
* Make the process simple
* Do not overwhelm me with communications jargon
* Help me remain consistent
* Make my agency look capable and prepared

## P0: Dedicated PIOs and social media leads

These users understand communication but often lack time, staffing, or resources.

### Core job

Help me identify communication opportunities, create stronger drafts faster, and manage everyday public communication with confidence.

### Their needs

* Reduce research and drafting time
* Maintain agency voice
* Verify information
* Find preventative angles
* Plan communication around events
* Avoid repetitive content
* Adapt information for residents
* Stay in control of final approval

## P0: Public safety and municipal agencies

SaferU may serve:

* Police departments
* Sheriff’s offices
* State police agencies
* Fire departments
* EMS agencies
* Emergency management agencies
* City and county governments

The same event may create different communication opportunities for different agency types.

SaferU must not treat every agency like a police department.

Municipal functions such as animal control, public works, parks, utilities, and public health may
inform recommendations for city or county governments. They are not separate SaferU agency types
in the current product scope.

## P1: Free members and content-library users

These users want trusted, ready-to-share safety graphics and captions.

### Core job

Help me quickly find useful public safety content that I can share with my community.

## P2: SaferU administrators

These users maintain the platform, content library, members, support workflows, and product quality.

### Core job

Help me operate SaferU efficiently and keep the content and member experience healthy.

---

# 6. Jobs SaferU Must Help Users Complete

SaferU should help agency users:

1. Determine what their community should hear today
2. Draft a professional message from limited or rough information
3. Turn an incident into useful preventative communication
4. Explain an alert or announcement from another authority
5. Prepare residents for a local event, closure, hazard, or disruption
6. Request videos or information from the public
7. Draft formal public information materials
8. Build a communication campaign around an agency event
9. Find trusted safety content without creating it from scratch
10. Maintain a professional and consistent agency voice

Each major workflow should clearly support one or more of these jobs.

---

# 7. Product Pillars

## 7.1 Communication intelligence

SaferU helps agencies understand what deserves communication—not simply what happened nearby.

The product should identify legitimate communication opportunities and explain why they matter to residents.

Communication intelligence should consider:

* Resident impact
* Jurisdiction
* Timing
* Agency type
* Issuing authority
* Preventative value
* Required action
* Community relevance

Finding information is only the first step. SaferU must determine whether that information creates a reason for the agency to communicate.

## 7.2 Professional drafting

SaferU transforms agency information, rough notes, verified sources, and user inputs into clear, professional communication.

Drafting should:

* Reduce blank-page time
* Preserve agency control
* Remain editable
* Use an appropriate public-sector voice
* Avoid unnecessary jargon
* Reflect the facts provided
* Produce messaging that could realistically be published

AI assists. The agency reviews and approves.

## 7.3 Preventative communication

SaferU should not only help agencies announce what happened.

When appropriate, it should help agencies use verified incidents, conditions, and trends to prevent future harm.

Examples:

* Vehicle break-ins → Lock vehicles, remove valuables, and report suspicious activity
* Residential burglaries → Lighting, locks, cameras, and reporting guidance
* Scam reports → Explain the specific scam and how residents can verify requests
* Severe weather → Preparation, travel, shelter, or recovery guidance
* Fire incidents → Prevention education connected to the known risk
* Community events → Traffic, parking, weather, safety, and logistics information

Preventative communication must remain connected to verified information. SaferU must not imply that a broader trend exists unless reliable sources support that conclusion.

## 7.4 Trusted content

SaferU provides a curated library of professional public safety graphics and captions that agencies can use as-is or customize.

Content should be:

* Accurate
* Timely
* Practical
* Visually professional
* Easy to find
* Easy to copy or download
* Broad enough to support different agency types
* Written for residents rather than industry insiders

## 7.5 Agency-specific framing

The same situation may require different communication depending on the agency.

For example, a heat advisory may create:

* Police messaging about children and pets in vehicles
* Fire messaging about outdoor burning and equipment safety
* EMS messaging about heat illness
* Emergency management messaging about cooling centers
* City or county government messaging about public works, parks, animal control, or other municipal impacts

SaferU should not merely insert the agency name into a generic message. It should understand the agency’s role in communicating the issue.

## 7.6 Community trust

Clear and consistent communication strengthens the relationship between agencies and residents.

SaferU should help agencies sound:

* Competent
* Calm
* Honest
* Helpful
* Prepared
* Human
* Professional

The product should not encourage fear, sensationalism, unnecessary urgency, or self-congratulatory agency language.

## 7.7 Simplicity

If a busy chief can use it without training, the experience is moving in the right direction.

SaferU should make professional communication easier—not create another complicated system the agency must manage.

---

# 8. What Makes SaferU Different

Many communication products begin after the user already knows what they want to say.

They begin with:

> Write a post.

SaferU should begin earlier:

> Here is what your community may need to hear, why it matters, and how your agency can communicate it.

SaferU combines three capabilities that are often separated:

## Communication intelligence

What deserves communication?

## Professional assistance

How should the agency communicate it?

## Trusted content

What can the agency use when it does not need to start from scratch?

SaferU’s unique position is:

> Everyday public safety communication for agencies with or without a dedicated PIO.

SaferU should help agencies communicate between major emergencies—not only during them.

---

# 9. Steering Principles

## A. Agency voice over consumer voice

Outputs and in-product language should feel like they come from a local public safety or government agency—not a startup, lifestyle brand, or consumer news feed.

Communication should be:

* Calm
* Clear
* Professional
* Direct
* Helpful
* Actionable
* Appropriate to the agency

Attribute the authority responsible for alerts, closures, forecasts, or announcements.

Do not make an agency appear to own information or operations that belong to another organization.

## B. Clarity over cleverness

Busy users skim.

Prefer:

* Short labels
* Clear headings
* One primary action
* Obvious next steps
* Plain language
* Visible status
* Predictable navigation

Avoid:

* Clever feature names that hide the purpose
* Long instructional copy
* Technical AI language
* Internal product terminology
* Dense dashboards
* Multiple competing calls to action

## C. Quality over quantity

A few strong recommendations are more valuable than a wall of mediocre content.

Do not fill the interface merely to make it appear active.

SaferU curated content may be used as a fallback so agencies always have useful communication available, but evergreen content must not be presented as though it is an urgent local recommendation.

## D. Specificity over generic filler

Every timely recommendation must have a clear reason for being surfaced now.

Avoid unsupported phrases such as:

* “With the holidays approaching”
* “As temperatures rise”
* “During this busy season”
* “Following recent incidents”
* “With severe weather expected”

unless a specific holiday, forecast, incident, verified trend, or local condition supports the language.

For every recommendation, SaferU should be able to answer internally:

* What happened or is expected to happen?
* Why does it matter to this jurisdiction?
* Why is this agency an appropriate communicator?
* Why should the agency communicate now?
* What should residents know or do?

If these questions cannot be answered, the item should not be presented as a timely local recommendation.

## E. Facts come from sources; AI provides framing

Dates, locations, alert levels, closures, issuing authorities, event details, statistics, and incident facts must come from identifiable sources or user-provided information.

AI may:

* Identify the communication opportunity
* Select an agency-appropriate angle
* Explain resident impact
* Draft the message
* Adapt the tone and format
* Connect verified information to appropriate prevention guidance

AI must not:

* Invent incidents or trends
* Add unsupported statistics
* Assume a holiday or event is approaching
* Turn an unverified possibility into a fact
* Change dates or locations
* Present expired information as current
* Imply that one incident proves a wider crime trend
* Invent agency involvement
* Attribute another authority’s work to the user’s agency

## F. Coverage is jurisdiction, not headquarters

The agency’s service area determines how SaferU searches, evaluates, and frames information.

### City, township, or borough agency

Required:

* State
* City, township, or borough
* County

County is required because place names may repeat within the same state.

### County-wide agency

Required:

* State
* County

### Statewide agency

Required:

* State

State police should use the city, county, or statewide service-area option that reflects the
coverage of the account using SaferU. Do not infer statewide coverage from the agency type alone.

Do not require ZIP codes as the primary service-area method.

Do not infer coverage solely from:

* Agency name
* Headquarters address
* Website domain
* A single ZIP code

An optional headquarters address may be considered later as a precision signal, but it should not replace the defined jurisdiction.

## G. Human oversight, not autopilot

SaferU drafts and recommends. The agency decides.

Users must be able to:

* Review
* Edit
* Approve
* Reject
* Dismiss
* Regenerate
* Copy
* Download
* Mark content as posted

SaferU should not automatically publish content without an intentional future product decision and clear agency approval.

## H. Preview honestly; paywall clearly

Guests may preview certain experiences.

Preview content must be clearly labeled as:

* Sample
* Demonstration
* Example
* Preview

Do not present sample intelligence as though it is based on live local analysis.

When a feature requires subscription or sign-in:

* Explain what is locked
* Show the value
* Provide a clear next action
* Avoid deceptive disabled interfaces

## I. Internals stay internal

Do not expose:

* Model names
* Prompt language
* Internal star ratings
* Confidence scores without a user-facing purpose
* Ranking tiers
* Raw source-quality scores
* “Quality bar” terminology
* Token-processing details inside the primary workflow
* Engineering evaluation language

Translate internal systems into clear member-facing states.

## J. Teach through use

Prefer:

* Short empty states
* Helpful labels
* Progressive setup
* Examples near the relevant action
* Contextual guidance
* Sensible defaults

Avoid large instructional pages users must read before beginning.

## K. Timely and optional content are different

SaferU should distinguish between:

### Recommended today

A current or upcoming issue creates a meaningful reason for the agency to communicate.

### Plan ahead

A verified future event, deadline, observance, condition, or disruption warrants advance communication.

### Optional safety post

Useful evergreen SaferU content is available, but there is no urgent local trigger.

Not every day requires a major local recommendation. SaferU should remain useful without pretending everything is urgent.

## L. Freshness includes memory

SaferU should not blindly repeat:

* Posted recommendations
* Dismissed recommendations
* Expired recommendations
* Previously rejected sources
* Recently used evergreen topics
* The same event with no meaningful update

The product should recognize when:

* New information changes the recommendation
* An event has progressed to a new communication stage
* A previously posted topic may reasonably be revisited
* A recommendation should remain suppressed

---

# 10. Design Philosophy

SaferU should feel calm, trustworthy, modern, and highly focused.

It should not feel:

* Overwhelming
* Tactical
* Militarized
* Consumer-oriented
* Like a social media feed
* Like an emergency dispatch console
* Like a generic AI chatbot
* Like outdated government software

## Design outcome

Every screen should help a busy user:

1. Understand what needs attention
2. Know why it matters
3. Identify the next action
4. Complete the task confidently

## Visual inspiration

SaferU may draw inspiration from products such as Govio and PulsePoint without copying their identity.

### Borrow from Govio

* Restraint
* Whitespace
* Clean information hierarchy
* Integrated AI assistance
* Focused workflows
* Modern typography
* Intentional cards
* Professional government positioning

### Borrow from PulsePoint

* Fast comprehension
* Strong event hierarchy
* Clear timing
* Location context
* Resident impact
* Obvious action
* Minimal card clutter

### Preserve from SaferU

SaferU should retain its established visual identity:

* Navy for trust and authority
* Gold for important calls to action
* Blue for Press Center actions
* Purple for AI-assisted experiences
* Soft blue-gray canvases
* Clear category accents
* Professional public safety imagery
* A welcoming tone without appearing casual

The goal is not to make SaferU look like Govio or PulsePoint.

The goal is:

> Govio’s professionalism and restraint, PulsePoint’s clarity, and SaferU’s own trusted public-safety identity.

---

# 11. Product Shells

SaferU has three related but distinct product environments.

## Marketing and free content library

Purpose:

* Explain SaferU
* Build trust
* Help users browse public content
* Convert visitors into members
* Introduce Press Center

Experience:

* Approachable
* Visual
* Clear
* Public-facing
* Content-oriented
* Navy and gold brand emphasis

## Press Center

Purpose:

* Help agency staff create and manage communications
* Provide AI-assisted drafting
* Surface communication opportunities
* Manage event campaigns and saved work

Experience:

* Focused
* Operational
* Professional
* Calm
* Workspace-oriented
* Blue primary actions
* Purple AI accents

Press Center should not look like another marketing page.

## Admin

Purpose:

* Operate the platform
* Manage content
* Support users
* Review performance
* Maintain the product

Experience:

* Efficient
* Data-oriented
* Practical
* Clearly separated from member-facing workflows

All three environments should feel like the same brand without appearing identical.

---

# 12. AI-Specific Steering

AI exists to reduce blank-page time, identify legitimate communication opportunities, and help agencies communicate with purpose.

AI does not exist to impress users with search volume or generated word count.

Finding information does not automatically make it a recommendation.

## What “thinking like a PIO” means

Thinking like a PIO means:

1. Identifying whether something creates a legitimate reason to communicate
2. Verifying the important facts
3. Determining how residents may be affected
4. Selecting the right agency-specific angle
5. Deciding whether the message should inform, prepare, prevent, reassure, clarify, or request assistance
6. Drafting something the agency could realistically review and publish
7. Attributing outside authorities appropriately
8. Avoiding speculation, unnecessary urgency, and filler

It does not mean summarizing every nearby article, event, alert, or announcement.

## AI recommendation workflow

The AI Post Generator should conceptually follow this sequence:

### 1. Discover

Find potentially relevant information from trustworthy sources.

### 2. Verify

Confirm:

* Source
* Date
* Location
* Issuing authority
* Current status
* Jurisdictional connection
* Important factual details

### 3. Evaluate

Determine:

* Whether residents would benefit
* Whether the item is current or upcoming
* Whether the agency has an appropriate communication role
* Whether communication would inform, prepare, or prevent
* Whether a post would provide meaningful value

### 4. Match

Connect the communication opportunity to the correct:

* Agency type
* Jurisdiction
* Resident audience
* Communication purpose
* Timing

### 5. Select

Choose the strongest communication angle.

Do not create several weak variations simply because several angles are possible.

### 6. Draft

Create a clear, specific, editable agency message.

### 7. Attribute

Name the issuing authority when SaferU is relying on another organization’s information.

### 8. Suppress

Remove:

* Irrelevant results
* Expired information
* Duplicate recommendations
* Posted items
* Dismissed items
* Unsupported claims
* Items outside the agency’s role
* Low-value local news

## Recommendation hierarchy

Prioritize communication opportunities in this order:

1. Immediate threats, emergency alerts, and urgent service disruptions
2. Current local conditions requiring resident action
3. Upcoming events or changes requiring preparation
4. Verified incidents or trends with meaningful preventative value
5. Significant regional issues with a clear local impact
6. Planned community communication opportunities
7. Optional SaferU curated safety content

## Recommendation threshold

A timely recommendation should generally require:

* A reliable source
* A clear jurisdictional connection
* Current or upcoming timing
* Meaningful resident impact
* An appropriate agency role
* A useful communication action

Finding something nearby is not enough.

## Source direction

Prefer primary and authoritative sources, including:

* The agency’s own releases and public accounts
* Local government websites
* County and state government websites
* Emergency management agencies
* Transportation departments
* The National Weather Service
* Official public alert systems
* School districts
* Utilities
* Police, fire, EMS, and sheriff’s agencies
* Public works departments
* Public health agencies
* Official event organizers

Secondary reporting may help discover an item, but critical facts should be confirmed through authoritative sources whenever possible.

## AI should

* Recommend legitimate communication opportunities
* Produce custom captions in the agency’s voice
* Explain resident impact
* Attribute issuing authorities
* Distinguish urgent, planned, preventative, and optional content
* Connect verified incidents with relevant prevention guidance
* Adapt messages to agency type
* Use specific dates, locations, and conditions
* Learn from user actions over time
* Provide SaferU curated content when no strong local recommendation exists

## AI should not

* Dump raw search results
* Recommend every nearby event
* Surface unrelated town halls or community stories
* Create generic seasonal filler
* Invent local trends
* Invent agency ownership
* Repeat dismissed or posted recommendations blindly
* Present optional content as urgent
* Expose internal scoring systems
* Use unsupported statistics
* Infer a holiday without confirmation
* Recommend an item merely because it contains the jurisdiction’s name

---

# 13. Recommendation Card Philosophy

Every AI Post Generator recommendation should be understandable within several seconds.

A recommendation should clearly communicate:

* What is happening
* Why it matters locally
* Why the agency should communicate
* When the agency should post
* What type of communication is recommended
* Who issued the original information
* What action the user can take

The recommended message should be the center of the experience—not a buried result beneath technical details.

## Recommended card actions

Depending on the feature, actions may include:

* Use this idea
* Generate message
* Edit
* View source
* Save
* Mark as posted
* Useful
* Not useful
* Dismiss

Do not overload every card with every possible action.

---

# 14. Press Center Philosophy

Press Center should feel like a communications workspace for a real agency.

It should help users move quickly between:

* Deciding what to communicate
* Drafting content
* Reviewing generated messages
* Managing events
* Finding saved work
* Using trusted templates and content
* Updating agency settings

## Press Center should prioritize

1. What needs attention
2. What can be created
3. What is upcoming
4. What was recently saved or generated
5. What the agency needs to complete next

The dashboard should not become a collection of decorative cards.

Every module must support a clear job.

---

# 15. Public Content Library Philosophy

The public content library should help members find the right message quickly.

Content should be organized around recognizable public needs and communication topics—not SaferU’s internal content structure.

Users should be able to:

* Browse by category
* Search by topic
* Find seasonal and timely content
* Preview graphics
* Copy captions
* Download graphics
* Understand whom the post is for
* Identify whether the content is timely or evergreen

The experience should be more visual and approachable than a government document directory while remaining professional and trustworthy.

---

# 16. Non-Goals

SaferU is not currently trying to:

* Become a full social media management suite
* Replace major scheduling and analytics platforms
* Automatically publish without human review
* Surface every nearby news story
* Replace a PIO’s professional judgment
* Build a general-purpose chatbot
* Become a CAD, RMS, or records product
* Become an emergency mass-notification system
* Become a resident social network
* Require a street-level address to define service area
* Create complex design-editing software
* Generate content solely to increase volume
* Serve every possible local government workflow

These boundaries may change through deliberate product strategy. They should not change accidentally because implementation expands.

---

# 17. What We Optimize For

## Time to first useful draft

How quickly can a user move from opening SaferU to reviewing something they can realistically publish?

## Trust

Are facts accurate, sources identifiable, and messages professionally framed?

## Relevance

Does the recommendation fit the agency’s type, jurisdiction, residents, and role?

## Freshness

Does the product avoid repeating expired, posted, dismissed, or unchanged information?

## Confidence

Does the user feel safer publishing the SaferU-assisted message than starting from a blank page?

## Simplicity

Can a user with limited communications experience complete the task without training?

## Professionalism

Does the output make the agency appear prepared, capable, and helpful?

## Prevention

Does the communication help residents reduce risk or prepare appropriately?

---

# 18. Decision Tests

Before shipping a feature or major UX change, ask:

## Mission test

Does this strengthen communication between agencies and residents?

## Busy-chief test

Could a chief or staff member wearing multiple hats understand and use this quickly?

## PIO test

Would a professional PIO use or publish this without embarrassment?

## Resident test

Would a resident benefit from receiving this communication?

## Why-now test

Can we clearly explain why this communication is useful today or during a specific upcoming timeframe?

## Agency-type test

Does the experience make sense for this department type?

## Jurisdiction test

Are we searching and framing the correct city, township, county, region, or state?

## Source test

Can the important factual claims be traced to reliable information?

## Prevention test

Is there a legitimate opportunity to help residents reduce risk?

## Shell test

Does the feature belong in marketing, Press Center, or admin—and does it look like that environment?

## Empty-state test

When there is nothing available, is the next action clear?

For AI recommendations, does the user still have access to optional SaferU curated value without being misled?

## Jargon test

Would a chief, administrative employee, or non-technical PIO understand every sentence?

## Simplicity test

Are we solving the job with the fewest necessary steps?

If two or more tests fail, the work should be reconsidered before release.

---

# 19. Roadmap and Surface Priorities

When time and capacity are limited, prioritize in this order:

1. Press Center create-flow reliability
2. Accuracy and agency voice
3. AI Post Generator relevance and usefulness
4. Service-area correctness
5. Source verification and attribution
6. Preventative communication opportunities
7. Recommendation-card clarity
8. Event campaign usefulness
9. Content-library findability
10. Copy and download experience
11. Saved-content and history workflows
12. Authentication, billing, and account health
13. Admin efficiency
14. Marketing polish

Marketing supports growth, but it should not outrank product trust, drafting quality, or the core communication experience.

---

# 20. Success Measures

SaferU should eventually measure success through outcomes such as:

* Time from opening a workflow to generating a useful draft
* Percentage of generated drafts copied, saved, downloaded, or marked as posted
* Percentage of recommendations marked useful
* Percentage of recommendations dismissed
* Repeat usage
* Number of agencies using multiple communication tools
* Use of preventative recommendations
* Use of SaferU curated fallback content
* Reduced repetition
* Draft-editing behavior
* Event-campaign completion
* Member retention
* User confidence and satisfaction
* Whether users report communicating more frequently or consistently

Usage volume alone does not prove success.

Generating more content is not the goal. Helping agencies communicate better is the goal.

---

# 21. Open Strategic Questions

These questions should be answered intentionally rather than through implementation drift:

* How far should Useful, Not useful, Posted, and Dismissed actions influence future recommendations?
* Which learning should remain user-specific, agency-specific, or platform-wide?
* When should a previously posted topic become eligible again?
* Should headquarters address ever become an optional precision signal?
* How should regional agencies define more complex jurisdictions?
* How much should marketing and Press Center share visual tokens?
* Where is the long-term boundary between drafting and social publishing?
* Should SaferU eventually support direct scheduling while preserving human review?
* How should AI usage be packaged and priced?
* How should SaferU explain token or usage limits without introducing unnecessary complexity?
* How should source reliability be represented internally?
* When should a recommendation create a custom graphic versus use existing SaferU content?
* How should agency-specific learning work across different staff accounts?
* How should SaferU support approval workflows for larger agencies?
* Which municipal departments should be added after the core public safety experience is mature?

---

# 22. How to Use This Document

## When debating a new feature

Use:

* Why SaferU Exists
* Product Mission
* Product Pillars
* Non-Goals
* Decision Tests

## When designing a page

Use:

* Design Philosophy
* Product Shells
* Relevant feature-specific reference documents

## When building AI recommendations

Use:

* AI-Specific Steering
* Recommendation Card Philosophy
* Source and jurisdiction principles
* `AI-POST-GENERATOR-UI-UX.md`

## When writing product copy

Use:

* Agency Voice Over Consumer Voice
* Clarity Over Cleverness
* Better Communication Builds Safer Communities

## When prioritizing work

Use:

* Roadmap and Surface Priorities
* What We Optimize For
* Success Measures

## When asking “Should SaferU add this?”

Use:

* North Star
* What SaferU Is
* Non-Goals
* Decision Tests

Update this document when the product’s purpose, positioning, audience, or major strategic direction changes.

Update the reference documents when screens, interactions, components, or implementation patterns change.

---

# Final Product Standard

SaferU should feel like:

* A communications partner for agencies without a PIO
* A time-saving assistant for professional PIOs
* A morning briefing about what may deserve communication
* A trusted public safety content library
* A structured agency drafting workspace
* A preventative communication assistant
* A calm, reliable government technology product

SaferU should never feel like:

* A noisy news feed
* A generic AI writing tool
* A consumer social platform
* A dispatch system
* A tactical police product
* A complicated enterprise suite
* A system trying to replace human judgment

Every part of SaferU should support one belief:

# Better Communication Builds Safer Communities.
