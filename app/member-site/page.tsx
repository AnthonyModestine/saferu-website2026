"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormErrorBanner, FieldError } from "@/components/form-messages"
import {
  validateSignupFields,
  hasSignupErrors,
  mapSignupApiError,
  invalidFieldClass,
  type SignupFieldErrors,
} from "@/lib/signup-validation"
import { cn } from "@/lib/utils"
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react"
import { DepartmentTypeFields } from "@/components/department-type-fields"
import { FREE_MEMBER_BENEFITS, SIGNUP_PLACEHOLDER_CLASS } from "@/lib/signup-form-copy"
import { useSignupPlaceholders } from "@/hooks/use-signup-placeholders"

export default function MemberSitePage() {
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [signUpFieldErrors, setSignUpFieldErrors] = useState<SignupFieldErrors>({})
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [departmentType, setDepartmentType] = useState("")
  const [departmentOther, setDepartmentOther] = useState("")
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)
  const { inputProps, hide } = useSignupPlaceholders()

  const clearSignUpFieldError = (field: keyof SignupFieldErrors) => {
    setSignUpFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSignInError(null)
    const form = e.currentTarget
    const email = (form.querySelector("#signinEmail") as HTMLInputElement)?.value?.trim()
    const password = (form.querySelector("#signinPassword") as HTMLInputElement)?.value ?? ""
    if (!email && !password) {
      setSignInError("Email and password are required")
      return
    }
    if (!email) {
      setSignInError("Email is required")
      return
    }
    if (!password) {
      setSignInError("Password is required")
      return
    }
    setSignInLoading(true)
    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSignInError(data.error ?? "Invalid email or password")
        return
      }
      window.location.href = "/"
    } catch {
      setSignInError("Something went wrong. Please try again.")
    } finally {
      setSignInLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSignUpFieldErrors({})
    const form = e.currentTarget
    const email = (form.querySelector("#signupEmail") as HTMLInputElement)?.value?.trim() ?? ""
    const firstName = (form.querySelector("#firstName") as HTMLInputElement)?.value?.trim() ?? ""
    const lastName = (form.querySelector("#lastName") as HTMLInputElement)?.value?.trim() ?? ""
    const agency = (form.querySelector("#agency") as HTMLInputElement)?.value?.trim() ?? ""
    const password = (form.querySelector("#signupPassword") as HTMLInputElement)?.value ?? ""

    const validationErrors = validateSignupFields({
      email,
      password,
      firstName,
      lastName,
      agency,
      departmentType,
      departmentOther,
      requireNames: true,
      requireAgency: true,
    })
    if (hasSignupErrors(validationErrors)) {
      setSignUpFieldErrors(validationErrors)
      return
    }

    setSignUpLoading(true)
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
        setSignUpFieldErrors(mapSignupApiError(data.error || "Sign up failed"))
        return
      }
      const loginRes = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (loginRes.ok) {
        window.location.href = "/"
        return
      }
      setSignUpSuccess(true)
    } catch {
      setSignUpFieldErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setSignUpLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left Column - Benefits */}
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f2b233]/20 px-3 py-1 text-xs font-semibold text-[#1a365d] mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  Free for public safety agencies
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
                  Join SaferU — free membership for your agency
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Sign up in under a minute and unlock weekly What&apos;s New content plus our full library of ready-to-share safety posts, graphics, and captions — built for PIOs and outreach teams.
                </p>

                <ul className="mt-8 space-y-4">
                  {FREE_MEMBER_BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column - Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Create your free account</CardTitle>
                    <CardDescription>
                      Members get What&apos;s New every week and instant access to our content library.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {signUpSuccess ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                          <CheckCircle className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-foreground">
                          Welcome to SaferU!
                        </h3>
                        <p className="mt-2 text-muted-foreground">
                          Your account has been created. Start browsing our
                          content library.
                        </p>
                        <Button asChild className="mt-6">
                          <Link href="/">
                            Go to SaferU
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <Tabs defaultValue="signup" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="signup">Sign Up</TabsTrigger>
                          <TabsTrigger value="signin">Sign In</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signup" className="mt-6">
                          <form onSubmit={handleSignUp} noValidate className="space-y-4">
                            <FormErrorBanner message={signUpFieldErrors.form} />
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                  id="firstName"
                                  aria-invalid={Boolean(signUpFieldErrors.firstName)}
                                  {...inputProps("firstName", "John", {
                                    onChange: () => clearSignUpFieldError("firstName"),
                                    className: signUpFieldErrors.firstName ? invalidFieldClass : undefined,
                                  })}
                                />
                                <FieldError message={signUpFieldErrors.firstName} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                  id="lastName"
                                  aria-invalid={Boolean(signUpFieldErrors.lastName)}
                                  {...inputProps("lastName", "Smith", {
                                    onChange: () => clearSignUpFieldError("lastName"),
                                    className: signUpFieldErrors.lastName ? invalidFieldClass : undefined,
                                  })}
                                />
                                <FieldError message={signUpFieldErrors.lastName} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signupEmail">Work Email</Label>
                              <Input
                                id="signupEmail"
                                type="email"
                                autoComplete="email"
                                aria-invalid={Boolean(signUpFieldErrors.email)}
                                {...inputProps("email", "you@agency.gov", {
                                  onChange: () => clearSignUpFieldError("email"),
                                  className: signUpFieldErrors.email ? invalidFieldClass : undefined,
                                })}
                              />
                              <FieldError message={signUpFieldErrors.email} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="agency">Agency Name</Label>
                              <Input
                                id="agency"
                                aria-invalid={Boolean(signUpFieldErrors.agency)}
                                {...inputProps("agency", "Metro Police Department", {
                                  onChange: () => clearSignUpFieldError("agency"),
                                  className: signUpFieldErrors.agency ? invalidFieldClass : undefined,
                                })}
                              />
                              <FieldError message={signUpFieldErrors.agency} />
                            </div>
                            <DepartmentTypeFields
                              departmentType={departmentType}
                              departmentOther={departmentOther}
                              onDepartmentTypeChange={setDepartmentType}
                              onDepartmentOtherChange={setDepartmentOther}
                              departmentTypeError={signUpFieldErrors.departmentType}
                              departmentOtherError={signUpFieldErrors.departmentOther}
                              onClearDepartmentTypeError={() => clearSignUpFieldError("departmentType")}
                              onClearDepartmentOtherError={() => clearSignUpFieldError("departmentOther")}
                              onDepartmentOtherFocus={() => hide("departmentOther")}
                            />
                            <div className="space-y-2">
                              <Label htmlFor="signupPassword">Password (min 8 characters)</Label>
                              <PasswordInput
                                id="signupPassword"
                                autoComplete="new-password"
                                aria-invalid={Boolean(signUpFieldErrors.password)}
                                placeholder={inputProps("password", "Create a password").placeholder}
                                onFocus={() => hide("password")}
                                onChange={() => {
                                  hide("password")
                                  clearSignUpFieldError("password")
                                }}
                                className={cn(
                                  SIGNUP_PLACEHOLDER_CLASS,
                                  signUpFieldErrors.password ? invalidFieldClass : undefined
                                )}
                              />
                              <FieldError message={signUpFieldErrors.password} />
                            </div>
                            <Button type="submit" className="w-full font-semibold" disabled={signUpLoading}>
                              {signUpLoading ? "Creating your account…" : "Create My Free Account"}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">
                              By signing up, you agree to our Terms of Service
                              and Privacy Policy.
                            </p>
                          </form>
                        </TabsContent>

                        <TabsContent value="signin" className="mt-6">
                          <form onSubmit={handleSignIn} noValidate className="space-y-4">
                            {signInError && (
                              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{signInError}</p>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="signinEmail">Email</Label>
                              <Input
                                id="signinEmail"
                                type="email"
                                placeholder="you@agency.gov"
                                className={SIGNUP_PLACEHOLDER_CLASS}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signinPassword">Password</Label>
                              <PasswordInput
                                id="signinPassword"
                                placeholder="Your password"
                                className={SIGNUP_PLACEHOLDER_CLASS}
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={signInLoading}>
                              {signInLoading ? "Signing in…" : "Sign In"}
                            </Button>
                            <p className="text-center text-sm">
                              <Link
                                href="/forgot-password"
                                className="text-primary hover:underline"
                              >
                                Forgot your password?
                              </Link>
                            </p>
                          </form>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
