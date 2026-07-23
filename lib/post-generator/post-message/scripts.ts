export type MessageScript = {
  id: string
  label: string
  template: string
}

/** Shared tail for weather watches — preparatory tone. */
const WATCH_PREP_CLOSE =
  "Residents should remain weather-aware, secure loose outdoor items and make sure they have multiple ways to receive alerts."

const WATCH_SHORT_CLOSE =
  "Stay weather-aware and be prepared to take protective action if a warning is issued.\n\nMonitor official alerts for updates."

function watchFull(label: string, hazardLine: string): string {
  return `${label}

The National Weather Service has issued a ${label} for [Affected Area] until [Expiration Time].

${hazardLine}

${WATCH_PREP_CLOSE}`
}

function watchShort(label: string, hazardLine: string): string {
  return `A ${label} is in effect for [Affected Area] until [Expiration Time].

${hazardLine}

${WATCH_SHORT_CLOSE}`
}

function warningStandard(
  label: string,
  threatLine: string,
  actionLine: string,
  travelNote: string
): string {
  return `${label}

The National Weather Service has issued a ${label} for [Affected Area] until [Expiration Time].

${threatLine}

${actionLine}

${travelNote}

Continue monitoring official alerts from the National Weather Service.`
}

function warningAgencyAction(label: string): string {
  return `${label}

The National Weather Service has issued a ${label} for [Affected Area] until [Expiration Time].

Due to reports of [Primary Threats], [Agency Name] has [Agency Local Action].

[Public Actions]. Do not rely on outdoor warning sirens to alert you while inside.`
}

export const MESSAGE_SCRIPTS: Record<string, MessageScript> = {
  // ----- Severe thunderstorm -----
  severe_thunderstorm_watch_full: {
    id: "severe_thunderstorm_watch_full",
    label: "Severe Thunderstorm Watch (full)",
    template: `SEVERE THUNDERSTORM WATCH

The National Weather Service has issued a Severe Thunderstorm Watch for [Affected Area] until [Expiration Time].

Conditions are favorable for severe storms capable of producing [Primary Threats].

Residents should remain weather-aware, secure loose outdoor items and make sure they have multiple ways to receive alerts. Be prepared to move indoors if a warning is issued.

[Agency Name] will share additional information if conditions change.`,
  },
  severe_thunderstorm_watch_short: {
    id: "severe_thunderstorm_watch_short",
    label: "Severe Thunderstorm Watch (short)",
    template: watchShort(
      "Severe Thunderstorm Watch",
      "Strong storms may produce [Primary Threats]."
    ),
  },
  severe_thunderstorm_warning: {
    id: "severe_thunderstorm_warning",
    label: "Severe Thunderstorm Warning",
    template: warningStandard(
      "SEVERE THUNDERSTORM WARNING",
      "This storm may produce [Primary Threats].",
      "Residents should move indoors immediately and stay away from windows.",
      "Use caution if traveling. [Local Impacts] may occur throughout the area."
    ),
  },
  severe_thunderstorm_warning_agency_action: {
    id: "severe_thunderstorm_warning_agency_action",
    label: "Severe Thunderstorm Warning with local agency action",
    template: warningAgencyAction("SEVERE THUNDERSTORM WARNING"),
  },

  // ----- Tornado -----
  tornado_watch_full: {
    id: "tornado_watch_full",
    label: "Tornado Watch (full)",
    template: `${watchFull(
      "TORNADO WATCH",
      "Conditions are favorable for tornadoes and [Primary Threats]. Know where you would shelter and be prepared to move to a safe shelter immediately if a Tornado Warning is issued."
    )}`,
  },
  tornado_watch_short: {
    id: "tornado_watch_short",
    label: "Tornado Watch (short)",
    template: watchShort(
      "Tornado Watch",
      "Tornadoes are possible. [Primary Threats] may also occur."
    ),
  },
  tornado_warning: {
    id: "tornado_warning",
    label: "Tornado Warning",
    template: warningStandard(
      "TORNADO WARNING",
      "A tornado is possible or occurring. [Primary Threats].",
      "Move to an interior room on the lowest floor, away from windows. Bring your phone and shoes.",
      "Do not try to outrun a tornado in a vehicle. [Local Impacts] may affect the area."
    ),
  },
  tornado_warning_agency_action: {
    id: "tornado_warning_agency_action",
    label: "Tornado Warning with local agency action",
    template: warningAgencyAction("TORNADO WARNING"),
  },

  // ----- Flood -----
  flood_watch_full: {
    id: "flood_watch_full",
    label: "Flood Watch (full)",
    template: `${watchFull(
      "FLOOD WATCH",
      "Flooding is possible in [Affected Area]. [Primary Threats]. Be ready to move to higher ground if a Flood Warning or Flash Flood Warning is issued."
    )}`,
  },
  flood_watch_short: {
    id: "flood_watch_short",
    label: "Flood Watch (short)",
    template: watchShort("Flood Watch", "Flooding is possible. [Primary Threats]."),
  },
  flood_warning: {
    id: "flood_warning",
    label: "Flood / Flash Flood Warning",
    template: warningStandard(
      "FLOOD WARNING",
      "Flooding is occurring or imminent. [Primary Threats].",
      "Move to higher ground immediately. Never drive through floodwater — turn around, don't drown.",
      "[Local Impacts] may affect roads and low-lying areas."
    ),
  },
  flood_warning_agency_action: {
    id: "flood_warning_agency_action",
    label: "Flood Warning with local agency action",
    template: warningAgencyAction("FLOOD WARNING"),
  },

  // ----- Hurricane / tropical -----
  hurricane_watch_full: {
    id: "hurricane_watch_full",
    label: "Hurricane Watch (full)",
    template: `${watchFull(
      "HURRICANE WATCH",
      "Hurricane conditions are possible in [Affected Area]. [Primary Threats]. Review your emergency supplies and know your evacuation zone if officials issue orders."
    )}`,
  },
  hurricane_watch_short: {
    id: "hurricane_watch_short",
    label: "Hurricane Watch (short)",
    template: watchShort(
      "Hurricane Watch",
      "Hurricane conditions are possible. [Primary Threats]."
    ),
  },
  hurricane_warning: {
    id: "hurricane_warning",
    label: "Hurricane Warning",
    template: warningStandard(
      "HURRICANE WARNING",
      "Hurricane conditions are expected. [Primary Threats].",
      "[Public Actions]. Follow official evacuation orders if issued for your area.",
      "Expect [Local Impacts] as conditions worsen."
    ),
  },
  hurricane_warning_agency_action: {
    id: "hurricane_warning_agency_action",
    label: "Hurricane Warning with local agency action",
    template: warningAgencyAction("HURRICANE WARNING"),
  },

  // ----- Winter storm -----
  winter_storm_watch_full: {
    id: "winter_storm_watch_full",
    label: "Winter Storm Watch (full)",
    template: `${watchFull(
      "WINTER STORM WATCH",
      "Heavy snow, ice or mixed winter precipitation is possible in [Affected Area]. [Primary Threats]. Plan for difficult travel."
    )}`,
  },
  winter_storm_watch_short: {
    id: "winter_storm_watch_short",
    label: "Winter Storm Watch (short)",
    template: watchShort(
      "Winter Storm Watch",
      "Significant winter weather is possible. [Primary Threats]."
    ),
  },
  winter_storm_warning: {
    id: "winter_storm_warning",
    label: "Winter Storm Warning",
    template: warningStandard(
      "WINTER STORM WARNING",
      "Heavy snow, ice or dangerous winter conditions are expected. [Primary Threats].",
      "Avoid unnecessary travel. If you must drive, slow down and allow extra stopping distance.",
      "[Local Impacts] may make roads hazardous."
    ),
  },
  winter_storm_warning_agency_action: {
    id: "winter_storm_warning_agency_action",
    label: "Winter Storm Warning with local agency action",
    template: warningAgencyAction("WINTER STORM WARNING"),
  },
  winter_weather_advisory: {
    id: "winter_weather_advisory",
    label: "Winter Weather Advisory",
    template: `WINTER WEATHER ADVISORY

The National Weather Service has issued a Winter Weather Advisory for [Affected Area] until [Expiration Time].

[Primary Threats]. [Public Actions].

Use caution on bridges, overpasses and untreated roads.`,
  },

  // ----- Heat -----
  heat_watch_full: {
    id: "heat_watch_full",
    label: "Heat Watch (full)",
    template: `${watchFull(
      "EXCESSIVE HEAT WATCH",
      "Dangerously hot conditions are possible in [Affected Area]. [Primary Threats]. Plan for cooling options if a warning is issued."
    )}`,
  },
  heat_watch_short: {
    id: "heat_watch_short",
    label: "Heat Watch (short)",
    template: watchShort(
      "Excessive Heat Watch",
      "Dangerously hot conditions are possible. [Primary Threats]."
    ),
  },
  heat_warning: {
    id: "heat_warning",
    label: "Heat Warning / Advisory",
    template: warningStandard(
      "EXCESSIVE HEAT WARNING",
      "Dangerously hot conditions are expected. [Primary Threats].",
      "Limit time outdoors, drink water and watch for signs of heat illness. Never leave children or pets in vehicles.",
      "Cooling centers or relief options may be available — [Public Actions]."
    ),
  },

  // ----- Wind -----
  wind_watch_full: {
    id: "wind_watch_full",
    label: "Wind Watch (full)",
    template: `${watchFull(
      "HIGH WIND WATCH",
      "Strong winds are possible in [Affected Area]. [Primary Threats]. Be prepared for downed limbs or power outages if a warning is issued."
    )}`,
  },
  wind_watch_short: {
    id: "wind_watch_short",
    label: "Wind Watch (short)",
    template: watchShort("High Wind Watch", "Strong winds are possible. [Primary Threats]."),
  },
  wind_warning: {
    id: "wind_warning",
    label: "High Wind Warning",
    template: warningStandard(
      "HIGH WIND WARNING",
      "Damaging winds are expected. [Primary Threats].",
      "Secure outdoor items and use extra caution while driving, especially high-profile vehicles.",
      "[Local Impacts] may include downed trees or power lines."
    ),
  },

  // ----- Shared weather update / expired -----
  severe_weather_update: {
    id: "severe_weather_update",
    label: "Severe weather warning update",
    template: `SEVERE WEATHER UPDATE

The [Alert Type] for [Affected Area] remains in effect until [Expiration Time].

The primary threats continue to be [Primary Threats]. [Updated Storm Detail].

Remain in a safe place and follow official instructions until the warning expires or officials announce that the immediate threat has passed.`,
  },
  warning_expired: {
    id: "warning_expired",
    label: "Warning expired / lifted",
    template: `UPDATE: WARNING EXPIRED

The [Alert Type] for [Affected Area] expired at [Expiration Time].

Residents should remain weather-aware because [Post-Expiration Impacts] may still affect the area.

Report emergencies to 911 and report [Post-Expiration Impacts] through [Reporting Method].`,
  },
  weather_watch_generic: {
    id: "weather_watch_generic",
    label: "Generic weather watch",
    template: `[Alert Type]

The [Issuing Authority] has issued a [Alert Type] for [Affected Area] until [Expiration Time].

Conditions are favorable for [Primary Threats]. Residents should remain weather-aware and be prepared to take protective action if a warning is issued.

Secure loose outdoor items and make sure you have multiple ways to receive alerts.`,
  },
  weather_warning_generic: {
    id: "weather_warning_generic",
    label: "Generic weather warning",
    template: warningStandard(
      "[Alert Type]",
      "[Primary Threats].",
      "[Public Actions].",
      "Use caution if traveling. [Local Impacts] may affect the area."
    ),
  },
  weather_advisory_generic: {
    id: "weather_advisory_generic",
    label: "Generic weather advisory",
    template: `[Alert Type]

The [Issuing Authority] has issued a [Alert Type] for [Affected Area] until [Expiration Time].

[Primary Threats]. [Public Actions].`,
  },

  // ----- Boil water -----
  boil_water_advisory: {
    id: "boil_water_advisory",
    label: "Boil-water advisory",
    template: `BOIL-WATER ADVISORY

[Issuing Authority] has issued a boil-water advisory for customers in [Affected Area] due to [Reason].

Residents in the affected area should bring tap water to a rolling boil for at least [Boil Duration] before using it for drinking, cooking, making ice or brushing teeth. Bottled water may also be used.

[Unaffected Area Note]

The advisory will remain in effect until water-quality testing confirms the water is safe. An update will be provided when the advisory is lifted.`,
  },

  // ----- Road closure -----
  road_closure: {
    id: "road_closure",
    label: "Road closure / traffic alert",
    template: `TRAFFIC ALERT: ROAD CLOSURE

[Road Name] is closed [Closure Boundaries] due to [Closure Cause].

Drivers should avoid the area and use [Alternate Route], if available. Expect delays while [Agency Name] and [Partner Agencies] work at the scene.

The road will remain closed until [Reopen Condition]. We will provide an update when it reopens.`,
  },
  road_closure_resolved: {
    id: "road_closure_resolved",
    label: "Road reopened",
    template: `UPDATE: ROAD REOPENED

[Road Name] has reopened [Closure Boundaries].

Drivers may resume normal travel through the area. Continue to use caution near the scene.

Thank you for your patience while [Agency Name] and [Partner Agencies] worked to clear the incident.`,
  },

  // ----- Missing person -----
  missing_person: {
    id: "missing_person",
    label: "Missing person request",
    template: `MISSING PERSON

[Agency Name] is asking for the public's help locating a missing person.

[Subject Description]

Last known location: [Last Known Location]

If you see this person or have information, [Public Actions]. [Reporting Method]`,
  },
  missing_person_update: {
    id: "missing_person_update",
    label: "Missing person update",
    template: `MISSING PERSON UPDATE

[Agency Name] continues to search for a missing person last seen in [Last Known Location].

[Subject Description]

[Updated Storm Detail]

If you have information, [Public Actions]. [Reporting Method]`,
  },
  missing_person_located: {
    id: "missing_person_located",
    label: "Missing person located",
    template: `UPDATE: MISSING PERSON LOCATED

The missing person [Subject Description] has been located safely.

[Agency Name] thanks everyone who shared information and helped spread the word.`,
  },

  // ----- Power outage -----
  power_outage_active: {
    id: "power_outage_active",
    label: "Power outage active",
    template: `POWER OUTAGE

[Issuing Authority] reports a power outage affecting [Affected Area].

[Primary Threats]. [Public Actions].

[Restoration Estimate]

Stay away from downed power lines and report them to [Reporting Method]. Report emergencies to 911.`,
  },
  power_outage_update: {
    id: "power_outage_update",
    label: "Power outage update",
    template: `POWER OUTAGE UPDATE

Power remains out for customers in [Affected Area].

[Primary Threats]. [Restoration Estimate]

[Public Actions]. Report downed lines to [Reporting Method].`,
  },
  power_outage_restored: {
    id: "power_outage_restored",
    label: "Power restored",
    template: `UPDATE: POWER RESTORED

Power has been restored to [Affected Area] as of [Expiration Time].

[Post-Expiration Impacts]

If you are still without power, report it to [Reporting Method].`,
  },

  // ----- Fire -----
  fire_warning: {
    id: "fire_warning",
    label: "Structure / brush fire alert",
    template: `FIRE ALERT

[Agency Name] is responding to a fire in [Affected Area].

[Primary Threats]. [Public Actions].

Avoid the area and allow emergency crews room to work. We will provide an update when more verified information is available.`,
  },
  fire_update: {
    id: "fire_update",
    label: "Fire incident update",
    template: `FIRE UPDATE

[Agency Name] continues to work a fire in [Affected Area].

[Updated Storm Detail]. [Public Actions].

Avoid the area until officials announce it is safe to return.`,
  },

  // ----- Evacuation -----
  evacuation_order: {
    id: "evacuation_order",
    label: "Evacuation order",
    template: `EVACUATION ORDER

[Agency Name] has issued an evacuation order for [Affected Area] due to [Reason].

[Public Actions].

Do not return until officials announce it is safe.`,
  },
  shelter_in_place: {
    id: "shelter_in_place",
    label: "Shelter in place",
    template: `SHELTER IN PLACE

[Agency Name] has issued a shelter-in-place order for [Affected Area] due to [Reason].

[Public Actions].

Stay indoors, away from windows and doors, until officials announce the order has been lifted.`,
  },

  // ----- Police activity -----
  police_activity: {
    id: "police_activity",
    label: "Police activity / public safety alert",
    template: `PUBLIC SAFETY ALERT

[Agency Name] is responding to police activity in [Affected Area].

[Primary Threats]. [Public Actions].

Avoid the area and do not approach responders. We will share verified updates as they become available.`,
  },

  general_informational: {
    id: "general_informational",
    label: "General informational post",
    template: `[Alert Type]

[Case Details]

[Public Actions]

[Agency Name] will share updates when more verified information is available.`,
  },
}

export function getMessageScript(scriptId: string): MessageScript {
  return MESSAGE_SCRIPTS[scriptId] ?? MESSAGE_SCRIPTS.general_informational
}

/** Categories that use watch_full / watch_short / warning / warning_agency script families. */
export const WEATHER_SCRIPT_FAMILIES: Record<
  string,
  { watchFull: string; watchShort: string; warning: string; warningAgency: string; advisory?: string }
> = {
  severe_thunderstorm: {
    watchFull: "severe_thunderstorm_watch_full",
    watchShort: "severe_thunderstorm_watch_short",
    warning: "severe_thunderstorm_warning",
    warningAgency: "severe_thunderstorm_warning_agency_action",
  },
  tornado: {
    watchFull: "tornado_watch_full",
    watchShort: "tornado_watch_short",
    warning: "tornado_warning",
    warningAgency: "tornado_warning_agency_action",
  },
  flood: {
    watchFull: "flood_watch_full",
    watchShort: "flood_watch_short",
    warning: "flood_warning",
    warningAgency: "flood_warning_agency_action",
  },
  hurricane: {
    watchFull: "hurricane_watch_full",
    watchShort: "hurricane_watch_short",
    warning: "hurricane_warning",
    warningAgency: "hurricane_warning_agency_action",
  },
  winter_storm: {
    watchFull: "winter_storm_watch_full",
    watchShort: "winter_storm_watch_short",
    warning: "winter_storm_warning",
    warningAgency: "winter_storm_warning_agency_action",
    advisory: "winter_weather_advisory",
  },
  heat: {
    watchFull: "heat_watch_full",
    watchShort: "heat_watch_short",
    warning: "heat_warning",
    warningAgency: "heat_warning",
  },
  wind: {
    watchFull: "wind_watch_full",
    watchShort: "wind_watch_short",
    warning: "wind_warning",
    warningAgency: "wind_warning",
  },
}
