import { Header } from "@/components/header"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Pricing - SaferU",
  description: "SaferU pricing: ready-to-share safety content and Press Center for confident public safety communication.",
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
