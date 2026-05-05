import Link from "next/link"
import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1a365d]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <Link
              href="/about"
              className="text-[#a0c4e8] transition-colors hover:text-white px-3 py-1"
            >
              About Us
            </Link>
            <span className="text-[#4a5568]">|</span>
            <Link
              href="/privacy"
              className="text-[#a0c4e8] transition-colors hover:text-white px-3 py-1"
            >
              Privacy Policy
            </Link>
            <span className="text-[#4a5568]">|</span>
            <Link
              href="/terms"
              className="text-[#a0c4e8] transition-colors hover:text-white px-3 py-1"
            >
              Terms of Service
            </Link>
            <span className="text-[#4a5568]">|</span>
            <Link
              href="/contact"
              className="text-[#a0c4e8] transition-colors hover:text-white px-3 py-1"
            >
              Contact Us
            </Link>
            <span className="text-[#4a5568]">|</span>
            <Link
              href="/pricing"
              className="text-[#a0c4e8] transition-colors hover:text-white px-3 py-1"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="mailto:support@saferu.com"
              className="flex items-center gap-2 text-[#a0c4e8] transition-colors hover:text-white"
              aria-label="Email SaferU"
            >
              <Mail className="h-5 w-5" />
              <span className="text-sm">support@saferu.com</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-[#2d4a6f] pt-6 text-center">
          <p className="text-sm text-[#a0c4e8]">
            Clear communication. Trusted by public safety.
          </p>
          <p className="text-xs text-[#4a5568] mt-1">
            &copy; {new Date().getFullYear()} SaferU | All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
