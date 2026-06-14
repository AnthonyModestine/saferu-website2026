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
import { CheckCircle, ArrowRight } from "lucide-react"
import { DepartmentTypeFields } from "@/components/department-type-fields"

export default function MemberSitePage() {
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [signUpFieldErrors, setSignUpFieldErrors] = useState<SignupFieldErrors>({})
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [departmentType, setDepartmentType] = useState("")
  const [departmentOther, setDepartmentOther] = useState("")
  const [signInError, setSignInError] = useState<string | null>(null)
  const [signInLoading, setSignInLoading] = useState(false)

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
                <h1 className="text-3xl font-bold tracking-tight text-[#1a365d] sm:text-4xl">
                  Join SaferU for Free
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Become a member and get weekly access to What&apos;s New — plus our full library of ready-to-share safety content for your agency.
                </p>

                <ul className="mt-8 space-y-4">
                  {[
                    "What's New — fresh content added every week",
                    "Access to all content categories",
                    "Copy captions with one click",
                    "Download high-quality graphics",
                    "Save favorites for quick access",
                    "100% free for public safety agencies",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column - Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Get Started</CardTitle>
                    <CardDescription>
                      Create your free account or sign in to access content.
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
                                  placeholder="John"
                                  aria-invalid={Boolean(signUpFieldErrors.firstName)}
                                  className={signUpFieldErrors.firstName ? invalidFieldClass : undefined}
                                  onChange={() => clearSignUpFieldError("firstName")}
                                />
                                <FieldError message={signUpFieldErrors.firstName} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                  id="lastName"
                                  placeholder="Smith"
                                  aria-invalid={Boolean(signUpFieldErrors.lastName)}
                                  className={signUpFieldErrors.lastName ? invalidFieldClass : undefined}
                                  onChange={() => clearSignUpFieldError("lastName")}
                                />
                                <FieldError message={signUpFieldErrors.lastName} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signupEmail">Work Email</Label>
                              <Input
                                id="signupEmail"
                                type="email"
                                placeholder="you@agency.gov"
                                autoComplete="email"
                                aria-invalid={Boolean(signUpFieldErrors.email)}
                                className={signUpFieldErrors.email ? invalidFieldClass : undefined}
                                onChange={() => clearSignUpFieldError("email")}
                              />
                              <FieldError message={signUpFieldErrors.email} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="agency">Agency Name</Label>
                              <Input
                                id="agency"
                                placeholder="Metro Police Department"
                                aria-invalid={Boolean(signUpFieldErrors.agency)}
                                className={signUpFieldErrors.agency ? invalidFieldClass : undefined}
                                onChange={() => clearSignUpFieldError("agency")}
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
                            />
                            <div className="space-y-2">
                              <Label htmlFor="signupPassword">Password (min 8 characters)</Label>
                              <PasswordInput
                                id="signupPassword"
                                placeholder="Create a password"
                                autoComplete="new-password"
                                aria-invalid={Boolean(signUpFieldErrors.password)}
                                className={signUpFieldErrors.password ? invalidFieldClass : undefined}
                                onChange={() => clearSignUpFieldError("password")}
                              />
                              <FieldError message={signUpFieldErrors.password} />
                            </div>
                            <Button type="submit" className="w-full" disabled={signUpLoading}>
                              {signUpLoading ? "Creating…" : "Create Free Account"}
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
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="signinPassword">Password</Label>
                              <PasswordInput
                                id="signinPassword"
                                placeholder="Your password"
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
