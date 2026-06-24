"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormErrorBanner, FieldError } from "@/components/form-messages"
import {
  validateSignupFields,
  hasSignupErrors,
  mapSignupApiError,
  invalidFieldClass,
  type SignupFieldErrors,
} from "@/lib/signup-validation"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { DepartmentTypeFields } from "@/components/department-type-fields"
import { FREE_MEMBER_BENEFITS, SIGNUP_PLACEHOLDER_CLASS } from "@/lib/signup-form-copy"
import { useSignupPlaceholders } from "@/hooks/use-signup-placeholders"
import { sanitizeReturnUrl } from "@/lib/safe-redirect"

function SignUpForm() {
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get("email")?.trim() ?? ""
  const returnUrl = sanitizeReturnUrl(searchParams.get("returnUrl"), "/")
  const forPressCenter = searchParams.get("pressCenter") === "1"
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [departmentType, setDepartmentType] = useState("")
  const [departmentOther, setDepartmentOther] = useState("")
  const { inputProps, hide } = useSignupPlaceholders()

  useEffect(() => {
    if (prefillEmail) hide("email")
  }, [prefillEmail, hide])

  const signInHref = prefillEmail
    ? `/sign-in?email=${encodeURIComponent(prefillEmail)}&returnUrl=${encodeURIComponent(returnUrl)}`
    : `/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`

  const clearFieldError = (field: keyof SignupFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    const form = e.currentTarget
    const email = (form.querySelector("#email") as HTMLInputElement)?.value?.trim() ?? ""
    const firstName = (form.querySelector("#firstName") as HTMLInputElement)?.value?.trim()
    const lastName = (form.querySelector("#lastName") as HTMLInputElement)?.value?.trim()
    const agency = (form.querySelector("#agency") as HTMLInputElement)?.value?.trim()
    const password = (form.querySelector("#password") as HTMLInputElement)?.value ?? ""

    const validationErrors = validateSignupFields({
      email,
      password,
      departmentType,
      departmentOther,
    })
    if (hasSignupErrors(validationErrors)) {
      setFieldErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          agency,
          departmentType,
          departmentOther: departmentType === "other" ? departmentOther : undefined,
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFieldErrors(mapSignupApiError(data.error || "Sign up failed"))
        return
      }
      const loginRes = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (loginRes.ok) {
        window.location.href = returnUrl
        return
      }
      setSuccess(true)
    } catch {
      setFieldErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#1a365d]">You&apos;re a member</h2>
            <p className="mt-2 text-muted-foreground">
              {forPressCenter
                ? "Your Press Center subscription is linked to your account."
                : "Start exploring What's New and our free content library."}
            </p>
            <Button asChild className="mt-6 bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Link href={forPressCenter ? "/pio-tool" : "/"}>
                {forPressCenter ? "Open Press Center" : "Go to SaferU"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f4f8] to-[#dae6f0] px-4 py-12">
      <Card className="w-full max-w-lg shadow-lg border-[#1470AF]/10">
        <CardHeader className="text-center pb-4">
          <Link href="/" className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/images/saferu-logo.png"
              alt="SaferU"
              width={180}
              height={52}
              className="h-13 w-auto"
              style={{ filter: "brightness(0.4) contrast(1.2)" }}
            />
          </Link>
          <CardTitle className="mt-4 text-left text-xl font-bold leading-snug text-[#1a365d] sm:text-2xl">
            Join SaferU and get instant access to ready-to-share social media content designed
            specifically for public safety professionals.
          </CardTitle>
          <CardDescription className="text-left text-base leading-relaxed text-muted-foreground pt-3">
            Save time, stay consistent, and keep your community informed with professionally
            designed graphics, captions, and weekly content updates.
          </CardDescription>
          <ul className="mt-5 space-y-2.5 text-left">
            {FREE_MEMBER_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardHeader>
        <CardContent className="space-y-4 border-t pt-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#1a365d]">
              {forPressCenter ? "Create your account" : "Create Your Free Account"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {forPressCenter
                ? "One last step — use the same email you paid with in Stripe."
                : "Join today and start posting in minutes."}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormErrorBanner message={fieldErrors.form} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...inputProps("firstName", "John")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...inputProps("lastName", "Smith")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agency">Agency Name</Label>
              <Input id="agency" {...inputProps("agency", "Metro Police Department")} />
            </div>
            <DepartmentTypeFields
              departmentType={departmentType}
              departmentOther={departmentOther}
              onDepartmentTypeChange={setDepartmentType}
              onDepartmentOtherChange={setDepartmentOther}
              departmentTypeError={fieldErrors.departmentType}
              departmentOtherError={fieldErrors.departmentOther}
              onClearDepartmentTypeError={() => clearFieldError("departmentType")}
              onClearDepartmentOtherError={() => clearFieldError("departmentOther")}
              onDepartmentOtherFocus={() => hide("departmentOther")}
            />
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                defaultValue={prefillEmail}
                {...inputProps("email", "you@agency.gov", {
                  onChange: () => clearFieldError("email"),
                  className: fieldErrors.email ? invalidFieldClass : undefined,
                })}
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (min 8 characters)</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                placeholder={inputProps("password", "Create a password").placeholder}
                onFocus={() => hide("password")}
                onChange={() => {
                  hide("password")
                  clearFieldError("password")
                }}
                className={cn(
                  SIGNUP_PLACEHOLDER_CLASS,
                  fieldErrors.password && invalidFieldClass
                )}
              />
              <FieldError message={fieldErrors.password} />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#f2b233] text-[#1a365d] hover:bg-[#e5a52e] font-bold text-base py-6 shadow-md"
              disabled={loading}
            >
              {loading
                ? "Creating your account…"
                : forPressCenter
                  ? "Create account & open Press Center"
                  : "Create Your Free Account"}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={signInHref} className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Need press releases & video requests?{" "}
            <Link href="/pio-tool/subscribe" className="text-primary hover:underline">
              Explore Press Center
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  )
}
