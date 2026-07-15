/**
 * Index SaferU Content Library posts for Post Generator matching.
 * Derives retrieval metadata from category hierarchy and text when explicit tags are absent.
 */

import { getAllCategories } from "@/lib/content-merged"
import { isArticlePublished } from "@/lib/content-visibility"
import { getPostMessage } from "@/lib/post-message"
import { postRowKey } from "@/lib/admin-content-list"
import { getSeason } from "./calendar"

export interface IndexedCuratedPost {
  contentId: string
  postId: string
  categoryId: string
  subcategoryId: string
  articleId: string
  title: string
  category: string
  subcategory: string
  articleTitle: string
  articleDescription: string
  message: string
  graphicUrl?: string
  keywords: string[]
  signals: string[]
  relevantMonths: number[]
  relevantSeasons: string[]
  evergreen: boolean
  priority: number
  hasGraphic: boolean
  hasMessage: boolean
}

const CATEGORY_SIGNALS: Record<string, string[]> = {
  "crime-prevention": ["crime_prevention", "vehicle_theft", "scams", "burglary", "package_theft"],
  "fire-prevention": ["fire_safety", "smoke_alarm", "escape_plan", "cooking_safety"],
  "weather-preparedness": ["extreme_heat", "heat_illness", "severe_storms", "winter_weather", "flooding"],
  "natural-disaster": ["emergency_preparedness", "flooding", "wildfire", "earthquake"],
  "community-awareness": ["community_engagement", "neighborhood_watch", "child_safety", "senior_safety"],
  "whats-new": ["timely", "awareness"],
}

const SUBCATEGORY_SIGNALS: Record<string, string[]> = {
  vehicle: ["vehicle_theft", "vehicle_security", "9pm_routine"],
  scams: ["scams", "fraud", "impersonation"],
  cyber: ["online_scams", "identity_theft"],
  home: ["burglary", "home_security"],
  "home-fire": ["fire_safety", "cooking_safety"],
  "escape-planning": ["escape_plan", "smoke_alarm"],
  flooding: ["flooding", "flood_safety"],
  wildfire: ["wildfire", "fire_weather"],
  "child-safety": ["child_safety", "school_safety"],
  "senior-safety": ["senior_safety", "heat_illness"],
}

const MONTH_KEYWORDS: Record<number, string[]> = {
  1: ["winter", "cold", "ice", "carbon monoxide"],
  2: ["winter", "valentine", "scam"],
  3: ["spring", "flood", "flooding"],
  4: ["severe weather", "storm", "distracted"],
  5: ["motorcycle", "memorial", "travel", "ems", "police"],
  6: ["summer", "pool", "water", "fireworks", "hurricane"],
  7: ["heat", "hot", "vehicle theft", "independence", "fireworks"],
  8: ["back to school", "school", "heat"],
  9: ["preparedness", "hurricane", "labor day"],
  10: ["fire prevention", "halloween", "smoke alarm"],
  11: ["thanksgiving", "cooking", "travel"],
  12: ["holiday", "package", "scam", "carbon monoxide", "winter"],
}

function tokenize(...parts: string[]): string[] {
  const text = parts.join(" ").toLowerCase()
  const tokens = text.match(/[a-z0-9]+/g) ?? []
  return [...new Set(tokens)]
}

function deriveSignals(
  categoryId: string,
  subcategoryId: string,
  title: string,
  description: string,
  message: string
): string[] {
  const signals = new Set<string>()
  for (const s of CATEGORY_SIGNALS[categoryId] ?? []) signals.add(s)
  for (const s of SUBCATEGORY_SIGNALS[subcategoryId] ?? []) signals.add(s)

  const text = `${title} ${description} ${message}`.toLowerCase()
  const textSignals: [string, string][] = [
    ["heat", "extreme_heat"],
    ["hot car", "hot_vehicle"],
    ["hot vehicle", "hot_vehicle"],
    ["hydrat", "heat_illness"],
    ["smoke alarm", "smoke_alarm"],
    ["9 pm", "9pm_routine"],
    ["9pm", "9pm_routine"],
    ["vehicle theft", "vehicle_theft"],
    ["package", "package_theft"],
    ["scam", "scams"],
    ["flood", "flooding"],
    ["tornado", "tornado_preparedness"],
    ["school", "school_safety"],
    ["pool", "water_safety"],
    ["drown", "water_safety"],
    ["firework", "fireworks_safety"],
    ["carbon monoxide", "carbon_monoxide"],
    ["impaired", "impaired_driving"],
    ["pedestrian", "pedestrian_safety"],
    ["prepared", "emergency_preparedness"],
  ]
  for (const [needle, signal] of textSignals) {
    if (text.includes(needle)) signals.add(signal)
  }
  return [...signals]
}

function deriveMonths(signals: string[], title: string, categoryId: string): number[] {
  const months = new Set<number>()
  const text = title.toLowerCase()

  if (signals.some((s) => ["extreme_heat", "heat_illness", "hot_vehicle", "water_safety"].includes(s))) {
    [5, 6, 7, 8, 9].forEach((m) => months.add(m))
  }
  if (signals.some((s) => ["winter_weather", "cold_exposure", "ice_safety", "carbon_monoxide"].includes(s))) {
    [11, 12, 1, 2, 3].forEach((m) => months.add(m))
  }
  if (signals.some((s) => ["school_safety", "school_bus", "school_zone"].includes(s))) {
    [8, 9].forEach((m) => months.add(m))
  }
  if (categoryId === "whats-new") {
    months.add(new Date().getMonth() + 1)
  }

  for (const [month, keywords] of Object.entries(MONTH_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) months.add(Number(month))
  }

  if (months.size === 0) [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((m) => months.add(m))
  return [...months]
}

function isPlaceholderImage(url?: string): boolean {
  if (!url?.trim()) return true
  return /placeholder-\d+\.jpg/i.test(url)
}

/** Demo posts when CMS library is empty (local dev / guest preview). */
export const DEMO_INDEXED_POSTS: IndexedCuratedPost[] = [
  {
    contentId: "demo::hot-car",
    postId: "demo-hot-car",
    categoryId: "weather-preparedness",
    subcategoryId: "articles",
    articleId: "hot-vehicle-safety",
    title: "Never Leave Children or Pets in a Hot Vehicle",
    category: "Weather Preparedness",
    subcategory: "Weather Preparedness",
    articleTitle: "Hot Vehicle Safety",
    articleDescription: "Prevent hot-car tragedies during warm weather.",
    message:
      "Even on a mild day, temperatures inside a parked vehicle can rise quickly. Never leave children, older adults, or pets in a car — not even for a quick errand. If you see someone in distress, call 911 immediately.",
    graphicUrl: "/images/posts/placeholder-1.jpg",
    keywords: ["heat", "hot car", "children", "pets", "summer", "vehicle safety"],
    signals: ["extreme_heat", "hot_vehicle", "heat_illness"],
    relevantMonths: [5, 6, 7, 8, 9],
    relevantSeasons: ["summer"],
    evergreen: true,
    priority: 90,
    hasGraphic: true,
    hasMessage: true,
  },
  {
    contentId: "demo::9pm",
    postId: "demo-9pm",
    categoryId: "crime-prevention",
    subcategoryId: "vehicle",
    articleId: "9pm-routine",
    title: "9 PM Routine — Lock Up Tonight",
    category: "Crime Prevention",
    subcategory: "Vehicle",
    articleTitle: "9 PM Routine",
    articleDescription: "A simple nightly habit to reduce theft.",
    message:
      "Before you turn in for the night: lock your vehicles, close the garage, turn on exterior lights, and bring valuables inside. The 9 PM Routine takes minutes and helps prevent crimes of opportunity.",
    graphicUrl: "/images/posts/neighbors-connect.jpg",
    keywords: ["9pm", "vehicle", "theft", "security", "routine"],
    signals: ["9pm_routine", "vehicle_security", "vehicle_theft"],
    relevantMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    relevantSeasons: ["winter", "spring", "summer", "fall"],
    evergreen: true,
    priority: 85,
    hasGraphic: true,
    hasMessage: true,
  },
  {
    contentId: "demo::smoke-alarm",
    postId: "demo-smoke",
    categoryId: "fire-prevention",
    subcategoryId: "home-fire",
    articleId: "smoke-alarms",
    title: "Test Your Smoke Alarms This Month",
    category: "Fire Prevention",
    subcategory: "Home Fire Safety",
    articleTitle: "Smoke Alarms",
    articleDescription: "Working smoke alarms save lives.",
    message:
      "When did you last test your smoke alarms? Press the test button, replace batteries if needed, and make sure there is an alarm on every level of your home. Working alarms give you the early warning you need to get out safely.",
    graphicUrl: "/images/posts/space-heater.jpg",
    keywords: ["smoke alarm", "fire", "home safety", "test"],
    signals: ["smoke_alarm", "fire_safety"],
    relevantMonths: [10, 11, 3],
    relevantSeasons: ["fall", "spring"],
    evergreen: true,
    priority: 80,
    hasGraphic: true,
    hasMessage: true,
  },
  {
    contentId: "demo::package-theft",
    postId: "demo-package",
    categoryId: "crime-prevention",
    subcategoryId: "home",
    articleId: "package-theft",
    title: "Protect Packages During Delivery Season",
    category: "Crime Prevention",
    subcategory: "Home",
    articleTitle: "Package Theft Prevention",
    articleDescription: "Reduce porch piracy during busy delivery weeks.",
    message:
      "Expecting deliveries? Use tracking alerts, schedule packages for when someone is home, or use a secure locker. Report suspicious vehicles following delivery trucks in your neighborhood.",
    graphicUrl: "/images/posts/porch-pirates.jpg",
    keywords: ["package", "theft", "porch", "holiday", "delivery"],
    signals: ["package_theft", "crime_prevention"],
    relevantMonths: [11, 12],
    relevantSeasons: ["fall", "winter"],
    evergreen: false,
    priority: 75,
    hasGraphic: true,
    hasMessage: true,
  },
  {
    contentId: "demo::school-zone",
    postId: "demo-school",
    categoryId: "community-awareness",
    subcategoryId: "child-safety",
    articleId: "school-zones",
    title: "Slow Down in School Zones",
    category: "Community Awareness",
    subcategory: "Child Safety",
    articleTitle: "School Zone Safety",
    articleDescription: "Protect students during arrival and dismissal.",
    message:
      "School is back in session — please slow down in school zones, put phones away, and watch for children crossing. Fines are steep, but the real cost is a child's safety. Thank you for driving carefully.",
    graphicUrl: "/images/posts/emergency-kit.jpg",
    keywords: ["school", "zone", "pedestrian", "children", "traffic"],
    signals: ["school_safety", "school_zone", "pedestrian_safety"],
    relevantMonths: [8, 9],
    relevantSeasons: ["fall"],
    evergreen: false,
    priority: 78,
    hasGraphic: true,
    hasMessage: true,
  },
]

export function indexCuratedPosts(): IndexedCuratedPost[] {
  const rows: IndexedCuratedPost[] = []

  for (const category of getAllCategories()) {
    for (const subcategory of category.subcategories) {
      for (const article of subcategory.articles) {
        const published = isArticlePublished(category.id, subcategory.id, article.id)
        if (!published) continue

        for (const post of article.posts) {
          const message = getPostMessage(post)
          const hasMessage = Boolean(message.trim())
          const hasGraphic = Boolean(post.image?.trim()) && !isPlaceholderImage(post.image)
          if (!hasMessage) continue

          const signals = deriveSignals(
            category.id,
            subcategory.id,
            post.title,
            article.description,
            message
          )
          const keywords = tokenize(
            post.title,
            article.title,
            article.description,
            message,
            category.title,
            subcategory.title
          )
          const relevantMonths = deriveMonths(signals, post.title, category.id)
          const relevantSeasons = [...new Set(relevantMonths.map((m) => getSeason(m)))]
          const evergreen =
            category.id === "crime-prevention" ||
            category.id === "fire-prevention" ||
            category.id === "community-awareness"

          rows.push({
            contentId: postRowKey(category.id, subcategory.id, article.id, post.id),
            postId: post.id,
            categoryId: category.id,
            subcategoryId: subcategory.id,
            articleId: article.id,
            title: post.title,
            category: category.title,
            subcategory: subcategory.title,
            articleTitle: article.title,
            articleDescription: article.description,
            message,
            graphicUrl: post.image,
            keywords,
            signals,
            relevantMonths,
            relevantSeasons,
            evergreen,
            priority: hasGraphic ? 70 : 50,
            hasGraphic,
            hasMessage,
          })
        }
      }
    }
  }

  const liveWithGraphics = rows.filter((r) => r.hasGraphic)
  if (liveWithGraphics.length > 0) return liveWithGraphics
  return DEMO_INDEXED_POSTS
}

export function findPostByContentId(
  posts: IndexedCuratedPost[],
  contentId: string
): IndexedCuratedPost | undefined {
  return posts.find((p) => p.contentId === contentId)
}
