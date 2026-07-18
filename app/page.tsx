import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import {
  TrustedBy,
  CoreOutcomes,
  PressCenterPreview,
  AgencyFeedback,
  AiPostGeneratorSection,
  ContentLibrarySection,
  Mission,
} from "@/components/home-sections"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustedBy />
        <CoreOutcomes />
        <PressCenterPreview />
        <AgencyFeedback />
        <AiPostGeneratorSection />
        <ContentLibrarySection />
        <Mission />
      </main>
      <Footer />
    </div>
  )
}
