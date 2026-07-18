# SaferU — Sitewide UI & UX Guide

**Status:** Living reference document
**Audience:** Product, design, engineering, content, and anyone building SaferU
**Purpose:** Define how SaferU should look, feel, communicate, and operate across the marketing website, public content library, Press Center, and admin experience.

This document translates the SaferU Product & UX Steering Document into practical interface and language guidance.

The steering document determines **what SaferU should be**.
This document determines **how users should experience it**.

If this document conflicts with the Product & UX Steering Document, the steering document takes priority.

Related documents:

* `SAFERU-STEERING.md` — product direction, priorities, and decision rules
* `AI-POST-GENERATOR-UI-UX.md` — AI Post Generator interface deep-dive

---

# 1. Experience Direction

SaferU should feel like a professional communications partner for public safety and local government agencies.

It should feel:

* Calm
* Modern
* Trustworthy
* Focused
* Helpful
* Professional
* Easy to understand
* Purpose-built for public agencies

It should not feel:

* Like a generic AI chatbot
* Like a local news feed
* Like a dispatch console
* Like a police-only product
* Like a complicated enterprise platform
* Like outdated government software
* Like a consumer social media app
* Overloaded with cards, statistics, or competing actions

## Experience standard

Every screen should help the user quickly answer:

1. Where am I?
2. What needs my attention?
3. What can I do here?
4. What should I do next?
5. Can I trust the information being shown?

If those answers are not immediately clear, simplify the screen.

---

# 2. Core Website Positioning

The website should consistently communicate that SaferU is useful both to professional Public Information Officers and to agencies where communication is handled by someone wearing multiple hats.

## Primary homepage statement

Use this exact language:

# Not every agency has a Public Information Officer. SaferU gives every department the tools to communicate like one.

Do not shorten, rewrite, or replace this statement unless the overall product positioning changes.

## Brand belief

# Better Communication Builds Safer Communities.

This should appear throughout the website as SaferU’s guiding belief.

It should support the primary message rather than replace it.

## Supporting explanation

Use language similar to:

> Create professional messages, find trusted safety content, and know what your community may need to hear—all in one focused workspace.

## Audience language

Use:

> Built for Public Information Officers, chiefs, and anyone responsible for keeping the community informed.

SaferU should never imply that it is only for people with “PIO” in their job title.

## Terminology rule

Use the full term **Public Information Officer** the first time it appears on a page.

The abbreviation **PIO** may be used after the full term has been introduced.

Do not assume every user understands the abbreviation.

---

# 3. Design Inspiration

SaferU should not copy another platform’s visual identity.

Its experience may draw inspiration from Govio and PulsePoint while preserving SaferU’s own brand.

## Borrow from Govio

* Clean spacing
* Restrained layouts
* Professional government tone
* One primary action per section
* Clear typography
* Focused workflows
* Integrated AI assistance
* Modern cards
* Minimal visual noise

## Borrow from PulsePoint

* Immediate understanding
* Clear information hierarchy
* Strong timing and location context
* Obvious status
* Resident impact
* Fast action
* Concise cards

## Preserve from SaferU

* Navy and gold brand identity
* Blue Press Center actions
* Purple AI accents
* Soft blue-gray backgrounds
* Public-safety credibility
* Friendly but professional language
* Broad applicability across agency types

## Combined design direction

> Govio’s restraint and professionalism, PulsePoint’s clarity and immediacy, and SaferU’s trusted public-safety identity.

---

# 4. Brand and Visual System

## Primary colors

| Role                |                  Color | Use                                                           |
| ------------------- | ---------------------: | ------------------------------------------------------------- |
| SaferU navy         |              `#1A365D` | Marketing headlines, footer, brand elements, admin navigation |
| Deep navy           |              `#0B1B3A` | Press Center sidebar and high-contrast text                   |
| Alternate deep navy |              `#0F1C3F` | Supporting dark surfaces                                      |
| Gold                |              `#F2B233` | Primary marketing calls to action and important brand accents |
| Marketing blue      |              `#1470AF` | Secondary marketing actions and supporting accents            |
| Press Center blue   |              `#2563EB` | Primary workspace actions                                     |
| AI purple           |              `#7C5CFC` | AI features, labels, recommendation indicators                |
| Soft canvas         | `#F0F4F8` to `#DAE6F0` | Marketing sections and authentication backgrounds             |
| Press canvas        |              `#EEF2F8` | Press Center workspace                                        |
| Card border         |              `#E2E8F5` | Cards, dividers, input borders                                |

## Category accents

| Category             |     Color |
| -------------------- | --------: |
| Fire prevention      | `#E07C3E` |
| Weather preparedness | `#5B7A9D` |
| Natural disaster     | `#C44D4D` |
| Community awareness  | `#4A9D6B` |

Category colors should support identification. Do not use color alone to communicate status or meaning.

## Color rules

### Gold

Use gold primarily for:

* Main marketing calls to action
* Important brand moments
* Small highlights
* Selected marketing navigation states

Do not use gold for every button.

Gold should feel intentional and valuable.

### Press Center blue

Use blue for:

* Generate
* Create
* Save
* Continue
* Review
* Primary workspace actions

### AI purple

Use purple for:

* AI Post Generator labels
* AI-assisted recommendations
* Small AI icons
* AI banners
* AI-specific navigation indicators
* Generated-content markers

Do not make every AI screen entirely purple.

Purple indicates AI assistance. It does not replace the standard Press Center action color.

### Red

Reserve red for:

* Errors
* Destructive actions
* Expired alerts
* Critical warnings

Do not use red decoratively simply because SaferU serves public safety agencies.

---

# 5. Typography

## Font system

Use:

* Geist Sans for interface and body copy
* Geist Mono only for technical values, IDs, or code-related admin information

## Typography direction

Headings should feel strong and confident without appearing aggressive.

Body text should remain easy to scan.

## Recommended hierarchy

### Marketing hero headline

* Desktop: 52–64px
* Tablet: 42–48px
* Mobile: 36–42px
* Bold
* Tight but readable line height
* Navy

### Page title

* 32–40px
* Bold
* Deep navy

### Section heading

* 28–36px
* Bold or semibold
* Navy

### Card title

* 18–22px
* Semibold
* Deep navy

### Body copy

* 16–18px
* Regular
* Comfortable line height

### Supporting text

* 14–16px
* Muted gray
* Do not reduce contrast excessively

## Copy width

Long-form copy should generally remain within 60–75 characters per line.

Avoid placing wide paragraphs across the entire page.

---

# 6. Spacing and Layout

## General layout

Use generous whitespace to create hierarchy.

Do not solve every spacing problem by placing content inside another card.

## Page widths

* Marketing pages: maximum width approximately `1280px`
* Press Center workspace: fluid within the main layout
* Forms: approximately `720–880px`
* Long-form content: approximately `720px`
* Admin tables: may use the full available workspace

## Spacing rhythm

Prefer a consistent spacing system based on:

* 4px
* 8px
* 12px
* 16px
* 24px
* 32px
* 48px
* 64px
* 96px

## Section spacing

Marketing sections should generally use 72–112px vertical padding on desktop and 48–72px on mobile.

Workspace sections should use tighter spacing because users are completing tasks.

## Cards

Cards should be used when they:

* Group one clear task
* Present a recommendation
* Represent saved content
* Summarize an event
* Contain settings
* Separate dashboard modules

Do not place every sentence or statistic inside its own card.

---

# 7. Shape, Borders, and Shadows

## Border radius

Use a consistent radius of approximately:

* 10–12px for buttons and inputs
* 12–16px for cards
* 16–20px for large marketing previews

Avoid excessive pill-shaped containers.

Pills should be reserved for:

* Categories
* Status
* Small filters
* Tags

## Borders

Use light borders to define structure.

Recommended:

* `1px solid #E2E8F5`

Avoid dark or heavy card outlines.

## Shadows

Use soft shadows only when needed to create separation.

Cards should not appear to float dramatically.

Hover elevation should be subtle.

---

# 8. Iconography and Imagery

## Icons

Use a consistent line-icon library such as Lucide.

Icons should:

* Support labels
* Remain simple
* Use consistent stroke width
* Generally appear at 18–22px in the workspace
* Never replace unclear text

Do not use several unrelated icon styles.

## Marketing imagery

Avoid generic stock photography of:

* Police officers standing with crossed arms
* Emergency lights
* Tactical equipment
* Handcuffs
* Dramatic fire scenes
* Fear-based imagery

The homepage should not depend on photos of people.

Prefer:

* Real SaferU product screens
* Communication examples
* Public safety graphics
* Subtle geographic patterns
* Abstract community illustrations
* Message previews
* Professional interface mockups

## Content graphics

SaferU safety graphics should generally remain:

* 16:9
* Clean
* Modern
* High-resolution
* Minimal in copy
* Easy to understand
* Suitable for agency branding

Maintain reasonable clear space for an agency logo where appropriate.

---

# 9. Product Shells

SaferU has three primary interface environments.

They should feel connected but distinct.

## 9.1 Marketing and free library

### Purpose

* Introduce SaferU
* Explain the problem it solves
* Establish trust
* Allow visitors to browse free safety content
* Convert visitors into members or Press Center subscribers

### Visual character

* White and soft blue backgrounds
* Navy headings
* Gold primary calls to action
* Strong visual previews
* More generous whitespace
* More explanatory content

## 9.2 Press Center

### Purpose

* Help agencies know what to communicate
* Create professional drafts
* Manage event campaigns
* Save and review content
* Configure agency information

### Visual character

* Deep navy sidebar
* Light blue-gray workspace
* Blue primary actions
* Purple AI accents
* More compact information density
* Operational and focused

## 9.3 Admin

### Purpose

* Manage members
* Maintain content
* Review support requests
* Operate the platform
* View product performance

### Visual character

* Navy sidebar
* Neutral workspace
* Efficient tables
* Clear controls
* Gold SaferU identity accents
* Limited decorative content

---

# 10. Marketing Navigation

## Desktop navigation

Recommended order:

1. SaferU logo
2. Content Library
3. What’s New
4. Press Center
5. Pricing
6. About
7. Sign In
8. Get Started

The primary navigation should not become a complete site directory.

Less important links belong in the footer.

## Primary navigation CTA

Use:

> Get Started

or:

> Explore SaferU

Avoid overly sales-focused language such as:

* Buy Now
* Unlock AI
* Supercharge Your Agency
* Transform Today

## Mobile navigation

Below the medium breakpoint:

* Use a hamburger button
* Open a clean Sheet or drawer
* Group primary navigation first
* Separate account actions visually
* Keep the main CTA visible

Do not force the desktop navigation into multiple mobile rows.

---

# 11. Homepage UX

The homepage should draw attention to the product promise and then quickly show how SaferU delivers it.

It should not feel overloaded.

## Homepage structure

### Section 1: Hero

Use a two-column desktop layout.

#### Left side

**Eyebrow**

> Public Safety Communication Made Easier

**Headline**

# Not every agency has a Public Information Officer. SaferU gives every department the tools to communicate like one.

**Supporting copy**

> Create professional messages, find trusted safety content, and know what your community may need to hear—all in one focused workspace.

**Primary CTA**

> Explore Press Center

**Secondary CTA**

> Browse Free Safety Content

**Audience line**

> Built for police, sheriffs, state police, fire, EMS, emergency management, and city and county government.

#### Right side

Show a clean product composition featuring:

* A Press Center dashboard preview
* One AI recommendation card
* One professional message preview
* One SaferU graphic thumbnail

Do not use a wall of floating cards.

The main product screen should remain visually dominant.

### Section 2: Trusted by the people handling communications

Use a short statement:

> Built for Public Information Officers, chiefs, and anyone responsible for keeping the community informed.

This section may include agency-type labels or icons.

Do not use fake customer logos or unsupported metrics.

### Section 3: Three core outcomes

Use three clear columns or cards.

#### Know what to communicate

> Surface timely communication opportunities that matter to your agency and community.

#### Create professional messages

> Turn rough information into clear, agency-ready communication.

#### Share trusted safety content

> Find ready-to-use graphics and captions without starting from scratch.

These should explain outcomes rather than list features.

### Section 4: Press Center product preview

Use a large interface preview with supporting copy.

Suggested heading:

> Your agency’s communications workspace

Suggested supporting copy:

> Draft press releases, request community videos, build event campaigns, and receive timely post recommendations in one focused workspace.

Show the actual product interface rather than an abstract illustration.

### Section 5: Built for agencies with or without a PIO

Suggested heading:

> Built for whoever handles communication

Suggested copy:

> Some agencies have a dedicated Public Information Officer. Others rely on a chief, officer, firefighter, emergency manager, or administrative employee who is already balancing several responsibilities. SaferU makes professional communication easier for both.

This section should feel human and grounded.

### Section 6: AI Post Generator

Suggested heading:

> Know what may be worth sharing today

Suggested copy:

> SaferU reviews relevant public information and turns the strongest opportunities into clear recommendations for your agency—not a feed of every nearby news story.

Show:

* Recommended today
* Plan ahead
* Optional safety post

### Section 7: Free content library

Suggested heading:

> Trusted safety content, ready when you need it

Show several real content cards.

Include:

* Category
* Graphic preview
* Caption preview
* Copy action
* Download action

### Section 8: How SaferU works

Use three steps:

1. Set up your agency
2. Choose what you need
3. Review and communicate

Do not use a complex process diagram.

### Section 9: Mission

Use:

# Better Communication Builds Safer Communities.

Supporting copy:

> Clear, consistent communication helps residents prepare, prevent incidents, understand local risks, and build trust in the agencies that serve them.

### Section 10: Final call to action

Suggested heading:

> Give your agency a better way to communicate.

Buttons:

* Explore Press Center
* Browse Free Content

---

# 12. Homepage Language Rules

## Lead with the user’s problem

Prefer:

> Not every agency has a Public Information Officer.

Avoid:

> Introducing the future of AI-powered public safety communications.

## Explain outcomes before features

Prefer:

> Know what may be worth communicating today.

Avoid:

> AI-powered content intelligence engine.

## Use professional, plain language

Prefer:

* Create a press release
* Generate a message
* Find safety content
* Plan event communication
* Review recommendation

Avoid:

* Unleash
* Revolutionize
* Turbocharge
* Magic
* Game-changing
* Next-generation
* Cutting-edge
* Content machine

## Avoid repeating “AI”

AI should be explained where relevant, but the website should sell the outcome.

Do not begin every headline with “AI-powered.”

---

# 13. Public Content Library

## Main goal

Help users find the right public safety message quickly.

## Library landing page

The page should include:

1. Clear page title
2. Short explanation
3. Search
4. Category filters
5. Timely or featured content
6. Content grid
7. Helpful empty state

## Recommended title

> Public Safety Content Library

## Supporting copy

> Browse ready-to-share safety graphics and captions for your agency or community.

## Search

Search should support recognizable terms such as:

* Vehicle theft
* Heat safety
* Scams
* Fire prevention
* Severe weather
* Missing persons
* Community events
* School safety

Do not require users to understand internal category names.

## Content cards

Each content card should show:

* 16:9 graphic
* Title
* Category
* Short summary
* Timely or evergreen status where relevant
* Copy caption
* View details

Avoid displaying the entire caption in the grid.

## Article or content detail page

Show:

1. Graphic
2. Title
3. Short explanation
4. Ready-to-share caption
5. Copy button
6. Download button
7. Relevant category
8. Related content
9. SaferU attribution where required

## Copy feedback

When a user copies a caption, show a clear confirmation:

> Caption copied

Do not rely only on changing the icon.

---

# 14. Authentication and Account UX

## Authentication screens

Use:

* Centered card
* Soft blue gradient background
* SaferU logo
* Clear heading
* Minimal distractions
* One primary action

## Sign-in language

Heading:

> Welcome back

Supporting copy:

> Sign in to access your SaferU account.

## Sign-up language

Heading:

> Create your SaferU account

Supporting copy:

> Start using trusted public safety content and explore SaferU’s communication tools.

## Form behavior

* Labels remain visible above inputs
* Do not use placeholder text as the only label
* Show inline validation
* Preserve entered information after errors
* Use clear loading states such as “Signing in…”
* Never expose raw authentication errors

## Password recovery

Use soft confirmation language that does not reveal whether an account exists.

## Account page

Organize account settings into clear sections:

* Profile
* Agency
* Subscription
* Usage
* Password
* Account actions

Do not place every setting in one long form.

---

# 15. Press Center Navigation

## Desktop sidebar

Recommended structure:

### Main

* Dashboard
* AI Post Generator

### Create

* Press Release
* Video Request
* Community Event

### Workspace

* Saved Content
* Events
* Templates

### Account

* Agency Settings
* Help

Keep labels short and obvious.

## Sidebar behavior

* Use icons and text
* Clearly highlight the active route
* Do not rely only on icon color
* Allow logical groups
* Keep primary creation tools visible
* Place settings near the bottom

## Mobile navigation

Below the large breakpoint:

* Replace the sidebar with a top header
* Use a Sheet for navigation
* Keep the current page title visible
* Keep important primary actions accessible

---

# 16. Press Center Dashboard

## Purpose

The dashboard should help the user quickly understand:

* What may need attention
* What they can create
* What is coming up
* Where they left off

It should not become a collection of decorative statistics.

## Recommended layout

### Top header

Show:

* Agency name
* Page title
* Short contextual greeting if useful
* One primary create action

Avoid consumer-style greetings such as:

> Hey Anthony! Ready to create amazing content?

Prefer:

> Good morning. Here is what may need your agency’s attention.

### Main recommendation

Show the strongest AI Post Generator recommendation.

Include:

* Recommendation type
* Timing
* Local relevance
* Short overview
* Source
* Primary action

### Create shortcuts

Use three primary actions:

* Create Press Release
* Create Video Request
* Add Community Event

Do not use several visually equal shortcuts.

### Upcoming event communications

Show:

* Event
* Next message due
* Date and time
* Generate or review action

### Recent work

Show:

* Most recent drafts
* Status
* Last updated
* Continue action

### Optional content

Show one curated SaferU post only when it adds value.

Label it clearly:

> Optional safety post

Do not present it as urgent.

---

# 17. AI Post Generator UX

## Page goal

Help the user understand what may be worth communicating and act on the strongest opportunities.

The page should feel like a curated PIO briefing, not a search-results page.

## Page header

Suggested title:

> What to Share

or:

> Communication Recommendations

Suggested supporting copy:

> Timely ideas based on your agency type, service area, and trusted public information.

Avoid:

* Intelligence feed
* AI news engine
* Local content scanner

## Briefing states

Organize recommendations into clear types.

### Recommended today

Current information creates a meaningful reason to communicate.

### Plan ahead

A future event, deadline, condition, or observance warrants preparation.

### Optional safety post

Useful evergreen content is available without an urgent local trigger.

## Recommendation grid

Desktop:

* Maximum two columns
* Strongest recommendation first
* Avoid more than a few recommendations at once

Mobile:

* Single column
* Full-width cards

## Recommendation card

Each card should include:

### Type label

Examples:

* Weather
* Traffic
* Crime Prevention
* Community Event
* Fire Safety
* Scam Alert
* Service Update

### Timing

Examples:

* Post this morning
* Share before 3 PM
* Plan for Friday
* Optional this week

Use specific timing when supported.

### Headline

The headline should explain the opportunity, not repeat a source title.

### Why it matters

One or two short sentences explaining local resident impact.

### Recommended communication angle

Explain what the agency should communicate.

### Visual

Show a relevant SaferU graphic when one is available.

Use a consistent 16:9 area.

### Source

Show:

* Issuing authority
* Source title
* Updated or published date
* View source

Do not hide the source behind an unexplained icon.

### Primary action

Use:

> Generate Message

or:

> Use This Idea

Choose one main label and use it consistently.

### Secondary actions

Possible secondary actions:

* View Source
* Save
* Dismiss
* Useful
* Not Useful
* Mark as Posted

Do not display every secondary action as a full-sized button.

Use a compact feedback row or overflow menu where appropriate.

## Generated-message state

When the user chooses a recommendation, show:

1. Source summary
2. Recommended angle
3. Generated message
4. Editable text area
5. Copy
6. Save
7. Regenerate
8. Mark as posted

Keep the generated message visually dominant.

Do not make the user navigate to an entirely unrelated screen without clear context.

## Empty or low-activity state

Do not say:

> Nothing met our score.

Use:

> No strong local recommendations were identified right now.

Then provide:

* Optional SaferU safety content
* Browse Content Library
* Refresh recommendations when available

## Feedback

Useful and Not Useful feedback should feel lightweight.

Do not interrupt the user with a long survey.

When Not Useful is selected, optional quick reasons may include:

* Not relevant locally
* Wrong agency type
* Already posted
* Too generic
* Outdated
* Other

---

# 18. Press Release Flow

## Goal

Turn rough incident information into a professional communication package without overwhelming the user.

## Flow structure

Use a stepped form.

Recommended steps:

1. Incident details
2. Public information
3. Review details
4. Generate
5. Edit and save

## Form design

* Group related fields
* Use clear labels
* Explain only unusual fields
* Save progress automatically when possible
* Display completion status
* Avoid long walls of inputs

## Generated results

Separate outputs with tabs or clearly defined sections:

* Press Release
* Facebook
* X
* Talking Points
* Spanish
* Downloadable Document

Do not place every output in one extremely long page without navigation.

## Generated text actions

Each output should support:

* Edit
* Copy
* Save
* Regenerate
* Download where relevant

---

# 19. Video Request Flow

## Goal

Help agencies clearly request video, photos, or information from residents while following professional and platform-appropriate standards.

## Flow structure

Recommended steps:

1. Incident
2. Area and timeframe
3. What the agency needs
4. Contact or submission details
5. Generate and review

## UX rules

* Make dates and timeframes easy to understand
* Allow map-assisted entry where available
* Explain what residents should review
* Keep the final request specific
* Do not produce vague “check your cameras” messaging without a clear area and timeframe

---

# 20. Community Events UX

## Events landing page

Show:

* Upcoming events
* Event status
* Next communication due
* Event date
* Main action
* Create event

## Event detail page

The event page should include:

1. Event overview
2. Date, time, and location
3. Highlights
4. Communication campaign
5. Generated messages
6. Event status
7. Edit or cancel action

## Campaign timeline

Show the event communication plan visually.

Default stages may include:

* 30-day announcement
* 14-day highlight
* 7-day reminder
* 3-day what-to-expect message
* 1-day logistics reminder
* Event-day reminder
* Optional 1–2 hour reminder
* Post-event thank-you

Each stage should show:

* Due date and time
* Status
* Message purpose
* Generate or review action

## Timing language

Do not say only:

> Adjusted around the event start time

Instead show:

> Scheduled approximately three hours before the event begins.

Use exact relative timing whenever possible.

---

# 21. Saved Content

## Goal

Help users quickly return to work they created or saved.

## Filters

Recommended:

* All
* Draft
* Ready
* Posted
* Press Release
* Video Request
* Event
* Recommended Post

## List item

Show:

* Title
* Content type
* Status
* Date created
* Date updated
* Event or recommendation source where relevant
* Continue or open action

## Empty state

Use:

> You have not saved any content yet.

Primary action:

> Create Your First Message

---

# 22. Templates

Templates should help users begin faster without becoming a complicated template-management product.

## Template card

Show:

* Template name
* Purpose
* Agency types
* Preview
* Use Template

## Categories

Possible categories:

* Crime and Incident
* Fire and EMS
* Weather
* Community Event
* Scam and Fraud
* Traffic and Road Safety
* General Agency Update

---

# 23. Agency Settings and Service Area

## Settings structure

Use separate cards or tabs for:

* Agency profile
* Agency type
* Service area
* Branding
* Communication preferences
* Team
* Subscription

## Supported agency types

The current product supports:

* Police Department
* Sheriff’s Office
* State Police
* Fire Department
* EMS
* Emergency Management
* City / County Government

Animal control, public works, parks, utilities, and public health are municipal functions within
City / County Government. They are not separate agency-type choices in the current product.

## Service-area setup

### City, township, or borough

Require:

* State
* City, township, or borough
* County

### County-wide

Require:

* State
* County

### Statewide

Require:

* State

State police should select the service-area type that reflects the coverage of the account using
SaferU. Do not automatically assume every state-police user communicates statewide.

## Form language

Use:

> Service Area

Supporting copy:

> SaferU uses your service area to find and frame communication opportunities for the community you serve.

Avoid:

> Geolocation intelligence configuration

## Headquarters

Do not require a street address to establish jurisdiction.

If headquarters is collected later, explain that it is optional and not the same as service area.

---

# 24. Admin UX

## Admin navigation

Recommended groups:

### Overview

* Dashboard
* Metrics

### Content

* Categories
* Articles
* Posts
* Unpublished
* Media

### Members

* Members
* Email
* Feedback
* Support Tickets

### System

* Settings
* Logs where appropriate

## Admin dashboard

Prioritize actionable information:

* Content awaiting review
* Recent member activity
* Failed operations
* Support requests
* Publishing issues
* Usage trends

Do not create meaningless statistics simply to fill the page.

## Tables

Tables should support:

* Search
* Sort
* Filters
* Pagination
* Bulk actions
* Clear row actions
* Responsive fallback

## Errors

Display API, storage, publishing, and upload errors inline.

Do not silently fail.

---

# 25. Button System

## Primary buttons

Use for the one main action on a screen or section.

Examples:

* Generate Message
* Create Press Release
* Save Changes
* Continue
* Explore Press Center

## Secondary buttons

Use for supporting actions.

Examples:

* View Source
* Browse Content
* Preview
* Cancel

## Tertiary actions

Use text or ghost buttons for:

* Dismiss
* Regenerate
* View Details
* Back

## Destructive actions

Use clear red styling and require confirmation for:

* Delete account
* Delete content
* Cancel event
* Remove team member

## Button language

Use a verb that describes the result.

Prefer:

* Copy Caption
* Download Graphic
* Save Draft
* Generate Message

Avoid:

* Submit
* Proceed
* Click Here
* Go
* Yes

unless the context is completely obvious.

---

# 26. Forms

## Form rules

* Use visible labels
* Use helpful input descriptions only where necessary
* Mark optional fields clearly
* Use reasonable defaults
* Keep related fields together
* Show validation near the field
* Preserve user input after errors
* Support keyboard navigation
* Use appropriate input types

## Long forms

Break long forms into steps.

Show:

* Current step
* Completed steps
* Remaining steps
* Back and Continue
* Save and exit where appropriate

## Character limits

When limits matter:

* Show the limit
* Show a live remaining count
* Explain why the limit exists when useful
* Do not unexpectedly cut off text

---

# 27. Loading States

## Button loading

Change the label to describe what is happening:

* Generating…
* Saving…
* Signing in…
* Loading recommendations…
* Uploading…

Disable duplicate submissions while loading.

## Page loading

Use:

* Skeletons for cards and lists
* Short status labels
* Spinners only for brief actions

Avoid a blank page with a centered spinner for every route.

## AI generation

During generation, communicate progress without exposing internal processing.

Use:

> Creating your message…

Avoid:

* Calling OpenAI model
* Processing tokens
* Running prompt chain
* Evaluating quality score

---

# 28. Empty States

Every empty state should contain:

1. What is missing
2. Why the page is empty when useful
3. What the user should do next
4. One primary action

## Examples

### No saved content

> You have not saved any content yet.

Button:

> Create Your First Message

### No events

> No upcoming events have been added.

Button:

> Add Community Event

### No library results

> No safety content matched your search.

Button:

> Clear Filters

### No timely AI recommendations

> No strong local recommendations were identified right now.

Button:

> Browse Optional Safety Content

Avoid overly cheerful empty-state language when the context is serious.

---

# 29. Error States

Errors should explain:

* What happened
* Whether user work was preserved
* What the user can do next

## Good example

> We could not generate the message. Your information has been saved. Try again or return to the draft later.

## Poor example

> Error 500: Generation failed.

## Source error

If a source cannot be confirmed:

> SaferU could not verify the latest information from this source. Review the original source before using the recommendation.

Never hide uncertainty.

---

# 30. Confirmation and Success States

Use subtle confirmations for routine actions.

Examples:

* Caption copied
* Draft saved
* Graphic downloaded
* Recommendation dismissed
* Marked as posted

Use a full success page only for major milestones such as:

* Subscription completed
* Account created
* Event campaign completed

---

# 31. Modals and Drawers

Use modals for:

* Confirmations
* Short focused tasks
* Destructive actions
* Quick previews

Use side drawers for:

* Filters
* Mobile navigation
* Recommendation details
* Quick editing where context should remain visible

Do not place long forms inside small modals.

---

# 32. Responsive Design

## Mobile-first requirements

All primary workflows must remain usable on mobile.

### Marketing

* Stack hero content
* Keep headline readable
* Show the product preview below the copy
* Keep CTAs full-width when helpful
* Collapse navigation into a Sheet

### Press Center

* Replace sidebar with mobile navigation
* Use single-column recommendation cards
* Keep primary actions visible
* Avoid horizontal scrolling
* Allow tables to convert into stacked records

### Forms

* Use one column
* Use large tap targets
* Keep step controls visible
* Avoid side-by-side inputs unless they remain readable

## Breakpoints

Use established Tailwind breakpoints consistently.

Do not create custom breakpoints without a clear need.

---

# 33. Accessibility

SaferU should meet WCAG 2.1 AA standards where practical.

Requirements include:

* Sufficient color contrast
* Visible keyboard focus
* Semantic HTML
* Proper form labels
* Meaningful button names
* Descriptive image alt text
* Captions or text equivalents for relevant media
* No status conveyed by color alone
* Touch targets of at least approximately 44px
* Clear error identification
* Logical heading order
* Reduced-motion support

Navy and gold combinations should be tested carefully for contrast.

Gold should not be used for small body text on white.

---

# 34. Motion

Motion should support understanding.

Use subtle motion for:

* Opening drawers
* Switching tabs
* Saving confirmation
* Card expansion
* Step progression

Avoid:

* Bouncing buttons
* Constant pulsing
* Decorative parallax
* Dramatic page transitions
* Excessive animated gradients

Respect reduced-motion settings.

---

# 35. Product Copy Rules

## Tone

SaferU’s interface should sound:

* Helpful
* Calm
* Direct
* Professional
* Human
* Respectful of the user’s time

## Use “agency” as the broad default

Use “agency” when referring to all possible SaferU customers.

Use “department” where the wording is intentionally department-focused, including the finalized homepage statement.

## Do not talk down to users

Avoid:

> Don’t worry—we make communications easy!

Prefer:

> Create clear, professional communication without starting from scratch.

## Do not overstate AI

Avoid:

> SaferU’s revolutionary AI instantly knows everything happening in your community.

Prefer:

> SaferU reviews trusted public information and recommends communication opportunities relevant to your agency.

## Use full dates when clarity matters

Prefer:

> July 21, 2026

over:

> Next Tuesday

when timing could be misunderstood.

## Source attribution

Prefer:

> The National Weather Service has issued a Heat Advisory for Montgomery County.

Avoid:

> We issued a Heat Advisory.

unless the user’s agency is the issuing authority.

---

# 36. Agency-Generated Communication Style

Generated content should sound like a public safety or local government agency.

## Generated messages should be

* Specific
* Actionable
* Calm
* Accurate
* Scannable
* Appropriate to the situation
* Written for residents
* Clear about the source
* Clear about what residents should do

## Generated messages should not be

* Sensational
* Fear-based
* Overly formal
* Filled with legal jargon
* Generic
* Repetitive
* Self-congratulatory
* Written like marketing copy

Avoid starting every post with:

> As your public safety team…

Avoid unnecessary phrases such as:

* We are committed to your safety
* Your safety is our top priority
* Please be advised
* In an abundance of caution

Use them only when they genuinely improve the communication.

---

# 37. UX Review Checklist

Before approving a new screen, ask:

## Purpose

* Is the screen’s primary job clear?
* Is the main action obvious?
* Does this belong in the correct SaferU shell?

## Hierarchy

* Can the user identify the most important information first?
* Are there too many equal-weight cards or buttons?
* Is anything visually competing with the main task?

## Language

* Would a chief or staff member understand every label?
* Is Public Information Officer written in full before PIO?
* Does the copy explain outcomes rather than technology?

## Trust

* Are facts and sources visible where necessary?
* Does the screen avoid unsupported claims?
* Does the user understand what AI generated?

## Simplicity

* Can anything be removed?
* Is the process using the fewest reasonable steps?
* Is help provided at the moment it is needed?

## Mobile

* Does the screen work as a single column?
* Are actions easy to tap?
* Does important information remain visible?

## Accessibility

* Is contrast sufficient?
* Are inputs labeled?
* Does keyboard navigation work?
* Is meaning communicated without relying only on color?

If two or more areas fail, revise before release.

---

# 38. Final UI Standard

SaferU should look and operate like a modern, purpose-built communications platform for public safety and local government.

Every screen should reinforce that SaferU:

* Understands the reality of agencies with limited staff
* Respects professional Public Information Officers
* Helps users make communication decisions
* Reduces the work required to create a professional message
* Keeps facts and sources visible
* Supports human judgment
* Makes complex communication tasks feel manageable
* Preserves SaferU’s distinct navy, gold, blue, and purple identity

The product should never prioritize visual novelty over clarity.

The user should leave every workflow feeling:

> I know what to communicate, I have a professional message, and I can confidently take the next step.

# Better Communication Builds Safer Communities.
