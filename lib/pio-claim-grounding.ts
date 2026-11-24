/**
 * Detect unauthorized semantic claims in PIO writing relative to supplied facts.
 * Complements usedFactIds checks — catches meaning additions the model "grounds" loosely.
 */

export type GroundingViolation = {
  claimType: string
  matched: string
  reason: string
}

const CLAIM_PATTERNS: Array<{
  claimType: string
  re: RegExp
  requires?: (facts: GroundingFacts) => boolean
  reason: string
}> = [
  {
    claimType: "anonymous_reporting",
    re: /\banonymous(?:ly)?\b/i,
    requires: (f) => f.allowsAnonymousReporting === true,
    reason: "Anonymity promised without an authorized anonymous tip path",
  },
  {
    claimType: "confidential_reporting",
    re: /\bconfidential(?:ly)?\b/i,
    requires: (f) => f.allowsConfidentialReporting === true,
    reason: "Confidentiality promised without authorization",
  },
  {
    claimType: "guarantee_of_safety",
    re: /\b(you are safe|guarantee(?:s|d)? (?:your )?safety|no (?:danger|risk) to (?:the )?public)\b/i,
    requires: (f) => f.allowsSafetyGuarantee === true,
    reason: "Unauthorized safety guarantee",
  },
  {
    claimType: "no_ongoing_threat",
    re: /\b(no (?:ongoing|continuing) threat|threat has (?:ended|passed)|there is no threat)\b/i,
    requires: (f) => f.allowsNoOngoingThreat === true,
    reason: "Unauthorized 'no ongoing threat' claim",
  },
  {
    claimType: "confirmed_suspect",
    re: /\b(suspect (?:is|was) identified|confirmed suspect|the suspect (?:is|was))\b/i,
    requires: (f) => f.hasConfirmedSuspect === true,
    reason: "Confirmed suspect language without confirmed suspect facts",
  },
  {
    claimType: "agency_commitment",
    re: /\b(we (?:will|promise to)|committed to|guarantee that we)\b/i,
    requires: (f) => f.allowsAgencyCommitment === true,
    reason: "Unauthorized agency commitment",
  },
  {
    claimType: "investigation_outcome",
    re: /\b(case (?:is |was )?closed|arrested the suspect|solved the)\b/i,
    requires: (f) => f.allowsInvestigationOutcome === true,
    reason: "Unauthorized investigation outcome",
  },
  {
    claimType: "reason_for_withholding",
    re: /\b(to protect (?:their|his|her) identity|because of privacy|due to privacy laws)\b/i,
    requires: (f) => f.allowsWithholdingReason === true,
    reason: "Invented reason for withholding information",
  },
  {
    claimType: "unauthorized_public_action",
    re: /\b(report (?:any )?suspicious activity|remain vigilant|lock your doors|shelter in place)\b/i,
    requires: (f) => f.allowsPublicActionAsk === true,
    reason: "Public action request not authorized by supplied facts",
  },
]

export type GroundingFacts = {
  allowsAnonymousReporting?: boolean
  allowsConfidentialReporting?: boolean
  allowsSafetyGuarantee?: boolean
  allowsNoOngoingThreat?: boolean
  hasConfirmedSuspect?: boolean
  allowsAgencyCommitment?: boolean
  allowsInvestigationOutcome?: boolean
  allowsWithholdingReason?: boolean
  allowsPublicActionAsk?: boolean
}

export function findUnauthorizedClaims(
  text: string,
  facts: GroundingFacts
): GroundingViolation[] {
  const violations: GroundingViolation[] = []
  for (const rule of CLAIM_PATTERNS) {
    const m = text.match(rule.re)
    if (!m) continue
    const allowed = rule.requires ? rule.requires(facts) : false
    if (!allowed) {
      violations.push({
        claimType: rule.claimType,
        matched: m[0],
        reason: rule.reason,
      })
    }
  }
  return violations
}

/** Phase 4 sensitive fixture defaults: tip line exists, anonymity does not. */
export function groundingFactsFromTipLine(opts: {
  tipLine?: string | null
  tipLineIsAnonymous?: boolean
}): GroundingFacts {
  const tip = opts.tipLine?.trim() || ""
  const anonymous =
    opts.tipLineIsAnonymous === true || /\banonymous\b/i.test(tip)
  return {
    allowsAnonymousReporting: anonymous,
    allowsConfidentialReporting: false,
    allowsSafetyGuarantee: false,
    allowsNoOngoingThreat: false,
    hasConfirmedSuspect: false,
    allowsAgencyCommitment: false,
    allowsInvestigationOutcome: false,
    // "sensitive nature" phrasing is softer; still require explicit fact for protect-identity reason
    allowsWithholdingReason: false,
    allowsPublicActionAsk: false,
  }
}
