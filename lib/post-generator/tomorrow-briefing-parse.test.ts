import { describe, expect, it } from "vitest"
import {
  parseTomorrowBriefingPosts,
  parsedPostsToOpportunities,
} from "./tomorrow-briefing-parse"

const SAMPLE = `### Tomorrow's Recommended Content

* July 24, 2026
* Demo Police Department
* Police Department
* Philadelphia, PA

### 1. Post Topic

Road closure on Market Street

**Priority:** High Priority

**Why it matters:**
Drivers need to plan alternate routes before the morning commute.

**Verified details:**
- Closure begins July 24, 2026 at 6:00 a.m.
- Market Street between 10th and 12th Streets
- PennDOT announced the closure for utility work

**Recommended posting time:**
Post at 7:00 a.m. before peak traffic.

**Suggested Facebook post:**

Heads up, Philadelphia — Market Street will be closed between 10th and 12th Streets starting tomorrow at 6 a.m. for utility work. Use Chestnut or Arch Street as alternates.

**Suggested short version:**

Market St closed 10th–12th tomorrow 6 a.m. Use Chestnut or Arch.

**Suggested visual:**

PennDOT road-closure map or a simple branded traffic alert graphic.

**Source:**

* PennDOT District 6
* Market Street utility closure advisory
* Updated July 23, 2026
* https://www.penndot.pa.gov/example-closure

### Items Reviewed but Not Recommended

Normal forecast with no hazard.

### Recommended Daily Schedule

* 7:00 a.m. — Market Street closure update
`

describe("parseTomorrowBriefingPosts", () => {
  it("parses a structured tomorrow briefing post", () => {
    const posts = parseTomorrowBriefingPosts(SAMPLE)
    expect(posts).toHaveLength(1)
    expect(posts[0]?.topic).toContain("Market Street")
    expect(posts[0]?.facebookPost).toContain("Heads up")
    expect(posts[0]?.sourceUrl).toContain("penndot.pa.gov")
  })

  it("maps parsed posts to external opportunities with ready captions", () => {
    const posts = parseTomorrowBriefingPosts(SAMPLE)
    const opportunities = parsedPostsToOpportunities(posts, "2026-07-23")
    expect(opportunities[0]?.suggestedMessage).toContain("Heads up")
    expect(opportunities[0]?.recommendationTier).toBe("top_recommended")
  })

  it("cleans markdown from source names", () => {
    const posts = parseTomorrowBriefingPosts(SAMPLE)
    const opportunities = parsedPostsToOpportunities(posts, "2026-07-23")
    expect(opportunities[0]?.sourceName).toBe("PennDOT District 6")
    expect(opportunities[0]?.recommendedPostTiming).toBe(
      "Post at 7:00 AM. Before peak traffic."
    )
    expect(opportunities[0]?.summary).toContain("Market Street")
  })

  it("extracts event names from markdown labels", () => {
    const markdown = `### 1. Post Topic

- **Event:** Unity in the Community "A Sheriff's Community Celebration"

**Priority:** Community Engagement

**Why it matters:**
Engaging with the community through local events fosters trust and collaboration between residents and law enforcement.

**Verified details:**
- Saturday, July 26, 2026 at 9:00 a.m.
- City Hall courtyard

**Recommended posting time:**
Post at 9:00 AM tomorrow morning.

**Suggested Facebook post:**
Join us for Unity in the Community this Saturday at City Hall.

**Source:**
- **Official source organization:** City of Philadelphia Office of Special Events
- https://www.phila.gov/example
`
    const posts = parseTomorrowBriefingPosts(markdown)
    expect(posts[0]?.topic).toBe('Unity in the Community "A Sheriff\'s Community Celebration"')
    expect(posts[0]?.whyItMatters).toBe("")

    const opportunities = parsedPostsToOpportunities(posts, "2026-07-23")
    expect(opportunities[0]?.title).toBe(
      'Unity in the Community "A Sheriff\'s Community Celebration"'
    )
    expect(opportunities[0]?.recommendedPostTiming).toBe("Post at 9:00 AM on Tomorrow")
    expect(opportunities[0]?.whyItMatters).toContain("Saturday, July 26")
    expect(opportunities[0]?.category).toBe("community_event")
  })

  it("parses markdown source links for the source button", () => {
    const markdown = `### 1. Post Topic

Coffee with a Cop at the 39th District

**Priority:** Community Engagement

**Why it matters:**
Builds trust between residents and officers in the district.

**Verified details:**
- Thursday, July 24, 2026 at 10:00 a.m.
- 39th District office, open to all residents

**Recommended posting time:**
Post at 10:00 a.m. tomorrow so residents see it before the event starts.

**Suggested Facebook post:**
Join us for Coffee with a Cop tomorrow at 10 a.m.

**Source:**
([phillypolice.com](https://www.phillypolice.com/districts/39th-district/?utm_source=openai))
`
    const opportunities = parsedPostsToOpportunities(
      parseTomorrowBriefingPosts(markdown),
      "2026-07-23"
    )
    expect(opportunities[0]?.sourceUrl).toBe(
      "https://www.phillypolice.com/districts/39th-district/?utm_source=openai"
    )
    expect(opportunities[0]?.sourceName).toBe("phillypolice.com")
    expect(opportunities[0]?.recommendedPostTiming).toContain("before the event starts")
  })

  it("parses v2 schema with explicit category and split source fields", () => {
    const markdown = `# Tomorrow's Recommended Content

Target date: July 24, 2026
Agency: Demo Police Department
Jurisdiction: Philadelphia, Montgomery County, PA
Recommendations found: 1

### 1. Traffic Advisory - Main Street Speed Limit Reduction

Priority: Useful Community Information
Category: Traffic Advisory
Issuing authority: Lansdale Borough
Why it matters:
Drivers on West Main Street will need to adjust to a lower posted speed limit within the borough.
Verified details:
The posted speed limit on West Main Street between Valley Forge Road and Cannon Avenue will decrease from 35 mph to 25 mph beginning July 24, 2026.
Recommended posting time:
12:00 PM
Midday publication gives residents time to prepare before the change.
Suggested Facebook post:
Lansdale Borough advises that the posted speed limit on West Main Street between Valley Forge Road and Cannon Avenue will decrease from 35 mph to 25 mph beginning July 24, 2026.
Suggested short version:
West Main Street speed limit drops to 25 mph on July 24.
Suggested visual:
Traffic Advisory graphic naming West Main Street.
Source organization: Lansdale Borough
Source title: Main Street Speed Limit Change
Source date: July 20, 2026
Source URL: https://www.lansdale.org/example

## Items Reviewed but Not Recommended

- Tomorrow's sunny forecast | National Weather Service | Rejected: Routine weather

## Recommended Daily Schedule

- 12:00 PM | Traffic Advisory - Main Street Speed Limit Reduction
`
    const posts = parseTomorrowBriefingPosts(markdown)
    expect(posts).toHaveLength(1)
    expect(posts[0]?.topic).toContain("Main Street Speed Limit Reduction")
    expect(posts[0]?.category).toBe("Traffic Advisory")
    expect(posts[0]?.issuingAuthority).toBe("Lansdale Borough")
    expect(posts[0]?.sourceUrl).toBe("https://www.lansdale.org/example")

    const opportunities = parsedPostsToOpportunities(posts, "2026-07-23")
    expect(opportunities[0]?.category).toBe("traffic_advisory")
    expect(opportunities[0]?.issuingAuthority).toBe("Lansdale Borough")
    expect(opportunities[0]?.recommendedPostTiming).toBe(
      "Post at 12:00 PM. Midday publication gives residents time to prepare before the change."
    )
  })

  it("parses four separate post blocks from one briefing", () => {
    const block = (n: number, title: string) => `### ${n}. Post Topic

${title}

**Priority:** Useful Community Information

**Why it matters:**
Residents should know about ${title.toLowerCase()}.

**Verified details:**
- Verified detail for post ${n}

**Recommended posting time:**
Post at ${8 + n}:00 a.m. tomorrow.

**Suggested Facebook post:**
Heads up about ${title}.

**Source:**
- Example Source ${n}
- https://example.com/post-${n}
`

    const markdown = `${block(1, "Market Street closure")}
${block(2, "Afternoon heat advisory")}
${block(3, "Community festival")}
${block(4, "Phone scam alert")}

### Items Reviewed but Not Recommended

Nothing else met the bar.
`
    const posts = parseTomorrowBriefingPosts(markdown)
    expect(posts).toHaveLength(4)
    expect(posts.map((post) => post.topic)).toEqual([
      "Market Street closure",
      "Afternoon heat advisory",
      "Community festival",
      "Phone scam alert",
    ])
  })
})
