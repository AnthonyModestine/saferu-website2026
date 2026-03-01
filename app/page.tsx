import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Categories } from "@/components/categories"
import { Benefits } from "@/components/benefits"
import { PIOToolSection } from "@/components/pio-tool-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Categories />
        <Benefits />
        <PIOToolSection />
      </main>
      <Footer />
    </div>
  )
}
