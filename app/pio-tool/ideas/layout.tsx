import { redirect } from "next/navigation"
import {
  GRAPHIC_STUDIO_PATH,
  PRESS_CENTER_FEATURES,
} from "@/lib/press-center-features"

/**
 * AI Post Generator stays in the codebase for later work.
 * When postGeneratorVisible is false, customers are sent to Graphic Studio.
 */
export default function IdeasLayout({ children }: { children: React.ReactNode }) {
  if (!PRESS_CENTER_FEATURES.postGeneratorVisible) {
    redirect(GRAPHIC_STUDIO_PATH)
  }
  return children
}
