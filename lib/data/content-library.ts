export interface SocialPost {
  id: string
  title: string
  image?: string
  message?: string
  captions: {
    facebook: string
    instagram: string
    twitter: string
  }
}

export interface Article {
  id: string
  title: string
  description: string
  posts: SocialPost[]
}

export interface Subcategory {
  id: string
  title: string
  description: string
  icon: string
  articles: Article[]
}

export interface Category {
  id: string
  title: string
  description: string
  subcategories: Subcategory[]
}

/**
 * Base content library — category structure only.
 * Articles are added via admin CMS. What's New keeps live articles (e.g. Phantom Hacker Scams,
 * Swimming Safety) stored in Postgres via cms_additions, not seeded here.
 */
export const contentLibrary: Category[] = [
  {
    id: "crime-prevention",
    title: "Crime Prevention",
    description: "Offer advice on crime prevention, suspicious activity, and security tips.",
    subcategories: [
      {
        id: "home",
        title: "Home",
        description: "Home security and residential safety tips",
        icon: "Home",
        articles: [
          {
            id: "everyday-home-security",
            title: "Everyday Home Security",
            description:
              "Five practical, evergreen reminders that help residents make their homes less inviting to opportunistic theft.",
            posts: [
              {
                id: "lock-doors-and-windows",
                title: "Start With the Locks",
                image: "/images/start-with-the-locks.png",
                message:
                  "A simple home-security habit starts at the door. Lock exterior doors and accessible windows whenever you leave, even for a short trip. Before bed, make a quick check part of your nightly routine. Small, consistent steps can reduce opportunities for theft.",
                captions: {
                  facebook:
                    "A simple home-security habit starts at the door. Lock exterior doors and accessible windows whenever you leave, even for a short trip. Before bed, make a quick check part of your nightly routine. Small, consistent steps can reduce opportunities for theft.",
                  instagram:
                    "A simple home-security habit starts at the door. Lock exterior doors and accessible windows whenever you leave, even for a short trip. Before bed, make a quick check part of your nightly routine. Small, consistent steps can reduce opportunities for theft.",
                  twitter:
                    "Make locking exterior doors and accessible windows part of your routine whenever you leave and before bed. Small, consistent steps can reduce opportunities for theft.",
                },
              },
              {
                id: "use-exterior-lighting",
                title: "Light the Way",
                message:
                  "Keep entrances, walkways, and the area around your garage well lit. Motion-activated or dusk-to-dawn lighting can improve visibility without requiring you to remember a switch. Trim landscaping that blocks a clear view of doors and windows.",
                captions: {
                  facebook:
                    "Keep entrances, walkways, and the area around your garage well lit. Motion-activated or dusk-to-dawn lighting can improve visibility without requiring you to remember a switch. Trim landscaping that blocks a clear view of doors and windows.",
                  instagram:
                    "Keep entrances, walkways, and the area around your garage well lit. Motion-activated or dusk-to-dawn lighting can improve visibility without requiring you to remember a switch. Trim landscaping that blocks a clear view of doors and windows.",
                  twitter:
                    "Keep entrances, walkways, and garage areas well lit. Motion-activated or dusk-to-dawn lights improve visibility, while trimmed landscaping keeps doors and windows in view.",
                },
              },
              {
                id: "secure-the-garage",
                title: "Remember the Garage",
                message:
                  "Close and lock the garage door, and secure the door that connects the garage to your home. Avoid leaving garage remotes in vehicles parked outside. If you will be away, consider disabling the opener and checking that any garage windows are locked.",
                captions: {
                  facebook:
                    "Close and lock the garage door, and secure the door that connects the garage to your home. Avoid leaving garage remotes in vehicles parked outside. If you will be away, consider disabling the opener and checking that any garage windows are locked.",
                  instagram:
                    "Close and lock the garage door, and secure the door that connects the garage to your home. Avoid leaving garage remotes in vehicles parked outside. If you will be away, consider disabling the opener and checking that any garage windows are locked.",
                  twitter:
                    "Close and lock the garage, secure the door into your home, and avoid leaving garage remotes in vehicles parked outside. Check garage windows before traveling.",
                },
              },
              {
                id: "plan-for-deliveries",
                title: "Plan for Package Deliveries",
                message:
                  "When possible, schedule deliveries for a time someone will be home or use a secure delivery location. Turn on delivery notifications so packages are not left outside longer than necessary. Ask a trusted neighbor to collect a package if your plans change.",
                captions: {
                  facebook:
                    "When possible, schedule deliveries for a time someone will be home or use a secure delivery location. Turn on delivery notifications so packages are not left outside longer than necessary. Ask a trusted neighbor to collect a package if your plans change.",
                  instagram:
                    "When possible, schedule deliveries for a time someone will be home or use a secure delivery location. Turn on delivery notifications so packages are not left outside longer than necessary. Ask a trusted neighbor to collect a package if your plans change.",
                  twitter:
                    "Use delivery notifications, schedule packages for when someone is home, or choose a secure pickup location. If plans change, ask a trusted neighbor to collect the delivery.",
                },
              },
              {
                id: "prepare-before-vacation",
                title: "Prepare Before You Travel",
                message:
                  "Before a trip, pause mail and deliveries or ask someone you trust to collect them. Use timers for a few interior lights, avoid posting travel plans publicly, and arrange for a neighbor or friend to check the property. A lived-in appearance helps protect an empty home.",
                captions: {
                  facebook:
                    "Before a trip, pause mail and deliveries or ask someone you trust to collect them. Use timers for a few interior lights, avoid posting travel plans publicly, and arrange for a neighbor or friend to check the property. A lived-in appearance helps protect an empty home.",
                  instagram:
                    "Before a trip, pause mail and deliveries or ask someone you trust to collect them. Use timers for a few interior lights, avoid posting travel plans publicly, and arrange for a neighbor or friend to check the property. A lived-in appearance helps protect an empty home.",
                  twitter:
                    "Before traveling, pause deliveries, use light timers, avoid posting plans publicly, and ask someone you trust to check the property. Help your home maintain a lived-in appearance.",
                },
              },
            ],
          },
        ],
      },
      {
        id: "vehicle",
        title: "Vehicle",
        description: "Auto theft and vehicle break-in prevention",
        icon: "Car",
        articles: [],
      },
      {
        id: "cyber",
        title: "Cyber",
        description: "Online safety and digital security",
        icon: "Shield",
        articles: [],
      },
      {
        id: "scams",
        title: "Scams",
        description: "Recognize and avoid common scams",
        icon: "AlertTriangle",
        articles: [],
      },
      {
        id: "traffic",
        title: "Traffic",
        description: "Road safety and traffic awareness",
        icon: "TrafficCone",
        articles: [],
      },
      {
        id: "other",
        title: "Other",
        description: "Additional crime prevention resources",
        icon: "MoreHorizontal",
        articles: [],
      },
    ],
  },
  {
    id: "fire-prevention",
    title: "Fire Prevention",
    description: "Share safety tips on fire prevention, smoke alarms, and more.",
    subcategories: [
      {
        id: "home-fire",
        title: "Home Fire Safety",
        description: "Prevent fires in your home",
        icon: "Flame",
        articles: [],
      },
      {
        id: "escape-planning",
        title: "Escape Planning",
        description: "Be prepared to get out safely",
        icon: "DoorOpen",
        articles: [],
      },
    ],
  },
  {
    id: "whats-new",
    title: "What's New",
    description: "Stay current with seasonal alerts, news, and timely updates.",
    subcategories: [
      {
        id: "latest",
        title: "What's New",
        description: "Latest articles, seasonal tips, and timely updates",
        icon: "FileText",
        articles: [],
      },
    ],
  },
  {
    id: "weather-preparedness",
    title: "Weather Preparedness",
    description: "Stay safe during severe weather events and seasonal conditions.",
    subcategories: [
      {
        id: "articles",
        title: "Weather Preparedness",
        description: "Heat, storms, winter weather, and seasonal safety topics",
        icon: "CloudLightning",
        articles: [],
      },
    ],
  },
  {
    id: "natural-disaster",
    title: "Natural Disaster",
    description: "Prepare for and respond to natural disasters in your area.",
    subcategories: [
      {
        id: "earthquake",
        title: "Earthquake",
        description: "Earthquake preparedness and response",
        icon: "Activity",
        articles: [],
      },
      {
        id: "flooding",
        title: "Flooding",
        description: "Flood safety before, during, and after",
        icon: "Waves",
        articles: [],
      },
      {
        id: "wildfire",
        title: "Wildfire",
        description: "Wildfire preparedness and evacuation",
        icon: "Flame",
        articles: [],
      },
    ],
  },
  {
    id: "community-awareness",
    title: "Community Awareness",
    description: "Build stronger, safer neighborhoods through awareness and engagement.",
    subcategories: [
      {
        id: "neighborhood-watch",
        title: "Neighborhood Watch",
        description: "Organize and participate in community safety",
        icon: "Users",
        articles: [],
      },
      {
        id: "child-safety",
        title: "Child Safety",
        description: "Protecting our youngest community members",
        icon: "Baby",
        articles: [],
      },
      {
        id: "senior-safety",
        title: "Senior Safety",
        description: "Protecting and supporting older adults",
        icon: "Heart",
        articles: [],
      },
    ],
  },
]

export function getCategoryById(categoryId: string): Category | undefined {
  return contentLibrary.find((cat) => cat.id === categoryId)
}

export function getSubcategoryById(
  categoryId: string,
  subcategoryId: string
): Subcategory | undefined {
  const category = getCategoryById(categoryId)
  return category?.subcategories.find((sub) => sub.id === subcategoryId)
}

export function getArticleById(
  categoryId: string,
  subcategoryId: string,
  articleId: string
): Article | undefined {
  const subcategory = getSubcategoryById(categoryId, subcategoryId)
  return subcategory?.articles.find((art) => art.id === articleId)
}

export function getAllCategories(): Category[] {
  return contentLibrary
}

export const getSubcategory = getSubcategoryById
export const getArticle = getArticleById
