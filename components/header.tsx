"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu, X, LogOut, User } from "lucide-react"
import Image from "next/image"
import { useMemberSession } from "@/lib/use-member-session"

const templateLinks = [
  { label: "What's New", href: "/whats-new" },
  { label: "Crime Prevention", href: "/crime-prevention" },
  { label: "Fire Prevention", href: "/fire-prevention" },
  { label: "Weather Preparedness", href: "/weather-preparedness" },
  { label: "Natural Disasters", href: "/natural-disaster" },
  { label: "Community Awareness", href: "/community-awareness" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { member, isLoading } = useMemberSession()

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/saferu-logo.png"
            alt="SaferU"
            width={180}
            height={52}
            className="h-13 w-auto"
            style={{ filter: "brightness(0.4) contrast(1.2)" }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger suppressHydrationWarning className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Templates
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {templateLinks.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  onSelect={(e) => {
                    e.preventDefault()
                    router.push(link.href)
                  }}
                  className="cursor-pointer"
                >
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </Link>

          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>

          <Link
            href="/pio-tool"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Press Center
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {!isLoading && member ? (
            <>
              <Link
                href="/account"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1.5"
              >
                <User className="h-4 w-4" />
                Account
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
              <Button
                asChild
                className="bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
              >
                <Link href="/member-site">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-4">
            <Link
              href="/about"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>

            <div className="px-3 py-2">
              <span className="text-sm font-semibold text-muted-foreground">
                Templates
              </span>
              <div className="mt-2 space-y-1 pl-2">
                {templateLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/contact"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            <Link
              href="/pricing"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>

            <Link
              href="/pio-tool"
              className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              Press Center
            </Link>

            <div className="pt-4 space-y-2">
              {!isLoading && member ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Account
                  </Link>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted"
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-muted text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Button
                    asChild
                    className="w-full bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
                  >
                    <Link href="/member-site">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
