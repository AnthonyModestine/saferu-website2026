import { hasRealAgencyName, resolveIssuingAuthority } from "./caption-voice"

export function isFederalRelayOpportunity(opp: {
  title?: string
  category?: string
  sourceLabel?: string
  sourceName?: string
  issuingAuthority?: string
  signals?: string[]
}): boolean {
  const haystack = [
    opp.sourceLabel,
    opp.category,
    opp.sourceName,
    opp.issuingAuthority,
    ...(opp.signals ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return /scam|fraud|ic3|fbi|ftc|cisa|impersonat|cyber|federal advisory|national safety/i.test(
    haystack
  )
}

function topicPhrase(title: string): string {
  const trimmed = title.trim().replace(/\.$/, "")
  if (!trimmed) return "a new public safety warning"
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
}

function pickPracticalAction(actions: string[], issuer: string): string {
  const useful = actions
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 20 &&
        !/^fbi ic3 published/i.test(line) &&
        !/^the fbi internet crime complaint center/i.test(line)
    )

  if (useful.length) {
    let line = useful[0].replace(/\.$/, "")
    if (/ic3|fbi/i.test(issuer) && !/ic3\.gov/i.test(line)) {
      line += ". Report suspected internet crime at ic3.gov"
    }
    return line.endsWith(".") ? line : `${line}.`
  }

  if (/ic3|fbi/i.test(issuer)) {
    return "Verify unexpected calls, texts, and emails before sharing money or personal information. Report suspected internet crime at ic3.gov."
  }

  return "Verify unexpected requests through an official phone number or website before sharing money or personal information."
}

/** PIO-style relay post for FBI/FTC/CISA and similar federal advisories. */
export function buildFederalRelayPost(
  opportunity: {
    title: string
    publicCallToAction?: string[]
    sourceName?: string
    issuingAuthority?: string
    sourceLabel?: string
  },
  agencyName?: string | null,
  serviceArea?: { city?: string; state?: string }
): string {
  const issuer = resolveIssuingAuthority(opportunity) || "federal authorities"
  const topic = topicPhrase(opportunity.title)
  const topicSentence = topic.charAt(0).toUpperCase() + topic.slice(1)
  const city = serviceArea?.city?.trim()
  const state = serviceArea?.state?.trim()
  const place = city && state ? `${city}, ${state}` : city || state || ""
  const action = pickPracticalAction(opportunity.publicCallToAction ?? [], issuer)

  const paragraphs: string[] = []

  if (hasRealAgencyName(agencyName)) {
    const agency = agencyName!.trim()
    paragraphs.push(
      `${agency} is sharing a public safety notice from the ${issuer}: ${topicSentence}.`
    )
    if (place) {
      paragraphs.push(
        `This is a national alert, but fraud and scams reach residents in ${place} too. We're passing it along so neighbors can recognize these tactics before anyone loses money or personal information.`
      )
    } else {
      paragraphs.push(
        `This is a national alert, but fraud and scams reach communities everywhere. We're passing it along so residents can recognize these tactics before anyone loses money or personal information.`
      )
    }
  } else {
    paragraphs.push(`The ${issuer} issued a public alert: ${topicSentence}.`)
    paragraphs.push(
      `Residents should review the warning and stay alert for similar attempts in our area.`
    )
  }

  paragraphs.push(action)

  return paragraphs.join("\n\n")
}
