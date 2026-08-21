import { redirect } from "next/navigation"
import {
  GRAPHIC_STUDIO_PATH,
  PRESS_CENTER_FEATURES,
} from "@/lib/press-center-features"

export default function IdeasUseLayout({ children }: { children: React.ReactNode }) {
  if (!PRESS_CENTER_FEATURES.postGeneratorVisible) {
    redirect(GRAPHIC_STUDIO_PATH)
  }
  return children
}
