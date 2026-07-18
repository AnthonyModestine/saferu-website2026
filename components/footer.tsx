import Link from "next/link"
import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#E2E8F5] bg-[#F0F4F8]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <Link
              href="/about"
              className="px-3 py-1 font-medium text-[#1A365D] transition-colors hover:text-[#1470AF]"
            >
              About Us
            </Link>
            <span className="text-[#C3D0E0]">|</span>
            <Link
              href="/privacy"
              className="px-3 py-1 font-medium text-[#1A365D] transition-colors hover:text-[#1470AF]"
            >
              Privacy Policy
            </Link>
            <span className="text-[#C3D0E0]">|</span>
            <Link
              href="/terms"
              className="px-3 py-1 font-medium text-[#1A365D] transition-colors hover:text-[#1470AF]"
            >
              Terms of Service
            </Link>
            <span className="text-[#C3D0E0]">|</span>
            <Link
              href="/contact"
              className="px-3 py-1 font-medium text-[#1A365D] transition-colors hover:text-[#1470AF]"
            >
              Contact Us
            </Link>
            <span className="text-[#C3D0E0]">|</span>
            <Link
              href="/pricing"
              className="px-3 py-1 font-medium text-[#1A365D] transition-colors hover:text-[#1470AF]"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="mailto:support@saferu.com"
              className="flex items-center gap-2 text-[#42536e] transition-colors hover:text-[#1A365D]"
              aria-label="Email SaferU"
            >
              <Mail className="h-5 w-5" />
              <span className="text-sm">support@saferu.com</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-[#E2E8F5] pt-6 text-center">
          <p className="text-sm text-[#42536e]">
            Clear communication. Trusted by public safety.
          </p>
          <p className="mt-1 text-xs text-[#5c6b85]">
            &copy; {new Date().getFullYear()} SaferU | All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
