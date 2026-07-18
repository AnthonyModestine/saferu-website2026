# AI Post Generator — UI & UX

> Deep-dive for Press Center’s daily recommendations.  
> Steering: [SAFERU-STEERING.md](./SAFERU-STEERING.md) · Sitewide reference: [SAFERU-UI-UX.md](./SAFERU-UI-UX.md)

Product surface for Press Center’s daily post recommendations. Goal: feel like a curated PIO briefing, not a news feed.

Primary routes:

- `/pio-tool/ideas` — daily recommendations
- `/pio-tool/ideas/use` — refine / use a selected post
- `/pio-tool/settings` — agency profile + service area

---

## Product principles

1. **Quality over quantity** — few strong recommendations beat many weak ones.
2. **Always something to share** — if live discovery finds nothing strong enough, surface SaferU curated safety content with a custom caption. Never leave the page empty with “no recommendations.”
3. **Internal scoring stays internal** — never show star ratings, 4–5 star language, or scoring jargon in the UI.
4. **Official agency voice** — captions read like a local public safety agency post: who issued the alert, calm, professional, actionable.
5. **Service area lives in Settings** — Ideas does not ask for ZIP/state forms; it reads the agency profile.

---

## Service area (Agency Settings)

**Where:** `/pio-tool/settings` → Agency Information → Service area

Agencies choose how they cover the community. ZIP codes are not collected.

### Area type dropdown

| Area type | Required fields | Ideas page label example |
|-----------|-----------------|--------------------------|
| City / township / borough | State + City + County | Lansdale, Montgomery County, PA |
| County-wide | State + County | Montgomery County, PA |
| Statewide | State | PA |

**Why county is required with city:** place names repeat inside a state (e.g. multiple Springfields). County disambiguates without needing an HQ street address.

**Coverage vs HQ:** area type defines *what to search*, not where the building sits. A sheriff HQ in one town still serves the whole county.

State police may configure city, county, or statewide coverage based on the account’s actual
communication responsibility. Agency type alone must not force statewide discovery.

### UX rules

- Show only fields that match the selected area type.
- Ideas Generate stays disabled until the required fields for that type are filled.
- Ideas header links the configured area label to Settings for quick edits.

---

## Ideas page layout

**Where:** `/pio-tool/ideas`

### Header

- Title: **AI Post Generator**
- Subtitle: **What to share with your community today** · `{service area}` (link to Settings)
- Primary action: **Generate** / **Searching…**

No coverage-area form on this page.

### Recommendation grid

- Desktop: **2 columns** (`md:grid-cols-2`)
- Mobile: single column
- One flat list of recommendations (no “Top recommended / Recommended / Uncertain” section stacks)
- Do not surface internal tiers or star language to the user

### Empty / loading states

| State | Message |
|-------|---------|
| Service area incomplete | Prompt to complete Agency Settings (city agencies: city + county) |
| Searching | “Finding something useful to share…” / “This can take about a minute.” |
| No live hits | Engine falls back to SaferU curated content — user still sees cards |
| Guest / demo | Short note that sample briefing is shown; sign in for live analysis |

Never show copy like “nothing met the 4–5 star quality bar.”

---

## Recommendation card

**Component:** `components/pio/opportunity-card.tsx`

Vertical card (not left/right text+thumb). Content order:

1. **Recommend Today — {Alert Type}**  
   Alert type from category / source (e.g. Weather, Safety Reminder).
2. **Title** — short recommendation headline.
3. **When to post** — `recommendedPostTiming` with clock icon.
4. **Short overview** — prefer `surfacedReason`, else summary / why it matters. Max ~3 lines.
5. **Graphic** — full-width **16:9** (`aspect-video`), larger than the old thumbnail strip. No caption preview under the image on the browse card.
6. **Actions**

### Actions

| Control | Intent |
|---------|--------|
| **Use This Post** | Open refine/use flow with caption + graphic |
| **Generate Post** | Create caption when one isn’t ready yet |
| **Source** | Open originating alert / article URL (keep this) |
| **Useful** | Learning signal that this recommendation helped (backend learning over time) |
| **Not useful** | Hide this item and don’t recommend it again |

Do **not** show a standalone **Copy** button on the browse card (caption lives in Use This Post).

### Caption / message UX

- Browse card focuses on type, timing, overview, and graphic.
- Full PIO caption is reviewed/edited in **Use This Post**.
- Captions must attribute who issued the alert and sound like an official agency page.

---

## Content behavior that shapes UX

These are product rules users experience even when they never see the engine:

- Only high-quality communication opportunities are shown; weak nearby news is filtered out.
- Agency type changes framing (police vs fire vs sheriff vs public works, etc.).
- Sheriff / county-wide searches the full county, not a couple of ZIPs.
- Marking posted / not useful keeps recommendations fresh.
- SaferU curated graphics attach when relevant; if nothing live passes the bar, curated safety content still appears with a custom caption.

---

## Voice & copy guidelines (UI-facing)

- Prefer short, plain language.
- Avoid: star ratings, “quality bar,” “scoring engine,” internal tier names.
- Prefer: Recommend Today, When to post, Source, Useful / Not useful.
- Loading: “Searching…” not “Generating…” for discovery.
- Errors: tell the user what to fix in Settings or to try Generate again.

---

## Related files

| Concern | Path |
|---------|------|
| Ideas page | `app/pio-tool/ideas/page.tsx` |
| Recommendation card | `components/pio/opportunity-card.tsx` |
| Agency settings / service area | `app/pio-tool/settings/page.tsx` |
| Agency settings storage | `lib/agency-context.tsx` |
| Opportunities API | `app/api/pio/post-opportunities/route.ts` |
| Final PIO caption gate | `lib/post-generator/final-pio-validation.ts` |
| Caption voice rules | `lib/post-generator-ai.ts` |

---

## Open / follow-up UX

- Persist **Useful** signals server-side for cross-device learning (currently local).
- Consider renaming **Useful / Not useful** if agencies prefer clearer language after testing.
- Optional later: HQ street address as a map pin only — not a replacement for area type.
