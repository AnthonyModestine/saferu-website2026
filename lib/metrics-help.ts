/** Hover help text for admin Metrics dashboard — plain-language definitions for new team members. */

export const METRIC_HELP = {
  totalAgencies:
    "All registered SaferU member accounts (agencies), including free and paid plans.",
  activeAgencies:
    "Agencies that generated at least one press release or video request in the last 30 days.",
  newSignups:
    "New member accounts created during the selected date range (from the sign-up form).",
  paidAgencies: "Registered agencies on a paid Press Center subscription.",
  freeAgencies: "Registered agencies on a free account (no paid subscription).",

  pressReleaseSessions:
    "Each time a SaferU user runs Generate for a new press release (one session per generation).",
  videoRequestSessions:
    "Each time a SaferU user runs Generate for a community video request.",
  totalSessions: "Press release sessions plus video request sessions in this period.",
  downloads:
    "PDF and talking-points downloads from generated press release or video request output.",
  copies:
    "Copy-to-clipboard actions on generated text (press release, social posts, Spanish, video request, etc.).",
  spanishTranslations:
    "Times a user generated a Spanish translation from a press release session.",

  positiveFeedback:
    "Share of thumbs-up feedback on generated content. Users rate helpful or not helpful after a generation.",
  positiveCount:
    "Times SaferU users clicked Helpful on the feedback prompt after generating content.",
  negativeCount:
    "Times SaferU users clicked Not helpful and optionally chose a reason.",
  positiveRate: "Positive feedback divided by all feedback responses in this period.",
  topComplaint:
    "Most common reason selected when users mark generated content as not helpful.",

  curatedViews:
    "Page views on curated safety articles (crime prevention, fire, weather, etc.) in this period.",
  curatedCopies: "Times a user copied text from a curated article page.",
  curatedDownloads: "Image or asset downloads from curated article pages.",
  unusedArticles:
    "Articles with no views in this period (only shown once article views exist in the range).",

  generationSessionsChart:
    "Press release and video request generations over time, grouped by day, week, or month.",
  signupsChart:
    "New member registrations over time, grouped by day, week, or month.",
  signupsByDepartment:
    "Department type chosen at sign-up (Police, Fire, EMS, Sheriff, etc.).",
  incidentTypes:
    "Incident types agencies selected when generating press releases or video requests.",
  outputUtilization:
    "Percent of generation sessions where users copied or downloaded a specific output (e.g. PDF, Facebook post).",
  departmentBreakdown:
    "Per department type: sign-ups, registered agencies, active users, sessions, downloads, copies, and feedback.",
  signupsVsSessions:
    "Compares new sign-ups to Press Center generation activity by department type.",
  topAgencies:
    "Agencies with the most press release and video request generations in this period.",
  activeByType:
    "Agencies that generated at least one session in this period, grouped by department type.",
  agencyTable:
    "Per-agency detail. PR = press release sessions. Video = video request sessions. Feedback = % helpful when feedback was given.",
  feedbackSummary:
    "Helpful vs not helpful ratings submitted by SaferU users after generating content.",
  feedbackReasons:
    "Reasons users selected when marking content as not helpful (too long, wrong tone, etc.).",
  feedbackByType:
    "Positive and negative feedback grouped by the agency's department type.",
  recentFeedback:
    "Latest feedback submissions with agency name, rating, reason, and optional comment.",
  topArticles:
    "Most-viewed curated articles, with copies and downloads in this period.",
  viewsByCategory:
    "Article views and copies grouped by content category (crime prevention, fire, etc.).",
  userJourneys:
    "Page paths visitors took in the same browser session before copying article text or downloading a graphic. Requires session tracking from page views.",
  paymentSegments:
    "Compare content library and Press Center activity for currently paying members, past payers, never-paid signups, and anonymous visitors in the selected date range.",
  dateRange:
    "Filters all metrics on this page to the selected time window.",
} as const
