export interface PostPack {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  updatedAt: string
  captions: {
    facebook: string
    instagram: string
    twitter: string
  }
  images: string[]
}

export const postPacks: PostPack[] = [
  // Crime Prevention
  {
    id: "cp-1",
    title: "Home Security Checklist",
    description: "A comprehensive checklist for residents to secure their homes against break-ins.",
    category: "crime-prevention",
    tags: ["Prevention", "Residential"],
    updatedAt: "2025-01-15",
    captions: {
      facebook: "Protect your home with these simple security tips! Download our free checklist and make sure your home is secure before you leave. Remember: a well-lit home is a safer home. #HomeSecurity #CrimePrevention #SafetyFirst",
      instagram: "Is your home as secure as it could be? Swipe through for our top home security tips that could prevent a break-in. Save this post for later! #HomeSecurity #SafetyTips #ProtectYourHome",
      twitter: "Quick home security tips: Lock all doors/windows, use timers on lights, don't advertise vacations online. Stay safe! #HomeSecurity",
    },
    images: ["/placeholder-security.jpg"],
  },
  {
    id: "cp-2",
    title: "Package Theft Prevention",
    description: "Tips to prevent porch piracy during the holiday season and year-round.",
    category: "crime-prevention",
    tags: ["Seasonal", "Prevention"],
    updatedAt: "2025-01-10",
    captions: {
      facebook: "Don't let porch pirates steal your packages! Here are our top tips for keeping your deliveries safe. Consider a package locker, camera, or having items delivered to a secure location. #PorchPirates #PackageSafety",
      instagram: "Package theft is on the rise. Protect your deliveries with these simple tips! What's your strategy for keeping packages safe? #DeliverySafe #AntiTheft",
      twitter: "Expecting a delivery? Protect it! Use delivery alerts, require signature, or ship to secure location. #PackageSafety",
    },
    images: ["/placeholder-package.jpg"],
  },
  {
    id: "cp-3",
    title: "Vehicle Safety Reminder",
    description: "Remind residents to lock their vehicles and remove valuables.",
    category: "crime-prevention",
    tags: ["Prevention", "Alerts"],
    updatedAt: "2025-01-08",
    captions: {
      facebook: "Auto break-ins are crimes of opportunity. Don't give thieves a reason to target your vehicle. Lock it, take your keys, hide valuables. It only takes seconds to prevent theft! #CarSafety #LockItOrLoseIt",
      instagram: "Before you walk away, check: Doors locked? Windows up? Valuables hidden? A few seconds can save you hours of hassle. #VehicleSafety #CrimePrevention",
      twitter: "Reminder: Lock your car, take your keys, hide valuables. Prevent auto break-ins! #LockItUp",
    },
    images: ["/placeholder-vehicle.jpg"],
  },
  // Fire Prevention
  {
    id: "fp-1",
    title: "Smoke Detector Check",
    description: "Monthly reminder for residents to test smoke detectors.",
    category: "fire-prevention",
    tags: ["Prevention", "Monthly"],
    updatedAt: "2025-01-01",
    captions: {
      facebook: "Test your smoke detectors today! Push the test button and listen for the alarm. Replace batteries at least once a year. Working smoke detectors save lives. #FireSafety #SmokeDetectors",
      instagram: "When did you last test your smoke detectors? Do it now - it takes 30 seconds and could save your life! #FirePrevention #SafetyFirst",
      twitter: "Monthly reminder: Test your smoke detectors! Press the button, hear the beep, stay safe. #FireSafety",
    },
    images: ["/placeholder-smoke.jpg"],
  },
  {
    id: "fp-2",
    title: "Kitchen Fire Safety",
    description: "Tips for preventing kitchen fires - the leading cause of home fires.",
    category: "fire-prevention",
    tags: ["Prevention", "Education"],
    updatedAt: "2024-12-28",
    captions: {
      facebook: "Cooking is the leading cause of home fires. Stay safe: Never leave cooking unattended, keep flammables away from the stove, and keep a lid nearby to smother flames. #KitchenSafety #FirePrevention",
      instagram: "The kitchen is where most home fires start. Swipe for essential cooking safety tips that could prevent a fire! #CookingSafety #FireSafe",
      twitter: "Kitchen fire tip: Keep a lid nearby when cooking. It can smother a grease fire. Never use water! #FireSafety",
    },
    images: ["/placeholder-kitchen.jpg"],
  },
  // What's New
  {
    id: "wn-1",
    title: "New Year Safety Resolution",
    description: "Encourage residents to make safety a priority in the new year.",
    category: "whats-new",
    tags: ["Seasonal", "Awareness"],
    updatedAt: "2025-01-01",
    captions: {
      facebook: "Happy New Year! This year, resolve to make safety a priority. Check your smoke detectors, review your emergency plan, and stay connected with your local public safety agencies. #NewYear #SafetyFirst",
      instagram: "New Year, safer you! What safety goals are you setting for 2025? Drop them in the comments! #NewYearResolution #SafetyGoals",
      twitter: "Safety resolution for 2025: Check detectors, update emergency contacts, know your evacuation routes. What's yours? #NewYear",
    },
    images: ["/placeholder-newyear.jpg"],
  },
  // Weather Preparedness
  {
    id: "wp-1",
    title: "Winter Storm Preparation",
    description: "Help residents prepare for winter storms and severe cold weather.",
    category: "weather-preparedness",
    tags: ["Seasonal", "Emergency"],
    updatedAt: "2025-01-05",
    captions: {
      facebook: "Winter storm approaching? Prepare now! Stock up on essentials, check heating systems, and know where warming centers are located. Stay safe and warm! #WinterStorm #EmergencyPrep",
      instagram: "Winter storm checklist: water, food, batteries, blankets, medications. What else is in your emergency kit? #WinterPrep #StaySafe",
      twitter: "Storm prep: Charge devices, stock water, check heating. Stay off roads if possible. Updates at city website. #WinterStorm",
    },
    images: ["/placeholder-winter.jpg"],
  },
  // Natural Disasters
  {
    id: "nd-1",
    title: "Earthquake Drop Cover Hold",
    description: "Remind residents of proper earthquake response procedures.",
    category: "natural-disasters",
    tags: ["Emergency", "Education"],
    updatedAt: "2024-12-20",
    captions: {
      facebook: "Do you know what to do in an earthquake? DROP, COVER, and HOLD ON! Practice this with your family so everyone knows how to stay safe. #EarthquakeSafety #DropCoverHold",
      instagram: "Earthquake response: DROP to the ground, take COVER under sturdy furniture, HOLD ON until shaking stops. Save this post! #EarthquakeReady",
      twitter: "Earthquake reminder: DROP, COVER, HOLD ON. Practice makes prepared! #EarthquakeSafety",
    },
    images: ["/placeholder-earthquake.jpg"],
  },
  // Community Awareness
  {
    id: "ca-1",
    title: "See Something Say Something",
    description: "Encourage community vigilance and reporting suspicious activity.",
    category: "community-awareness",
    tags: ["Awareness", "Community"],
    updatedAt: "2025-01-12",
    captions: {
      facebook: "Your awareness matters! If you see something suspicious, say something. Report unusual activity to local police. Together, we keep our community safe. #SeeSomething #CommunityWatch",
      instagram: "You are our eyes and ears in the community. See something suspicious? Report it! Non-emergency line in bio. #CommunitySafety #WorkingTogether",
      twitter: "See something suspicious? Say something! Report to non-emergency line. Your call could prevent a crime. #SeeSomething",
    },
    images: ["/placeholder-community.jpg"],
  },
]

export function getPostPacksByCategory(category: string): PostPack[] {
  return postPacks.filter((pack) => pack.category === category)
}

export function getPostPackById(id: string): PostPack | undefined {
  return postPacks.find((pack) => pack.id === id)
}

export function getAllCategories(): string[] {
  return [...new Set(postPacks.map((pack) => pack.category))]
}
