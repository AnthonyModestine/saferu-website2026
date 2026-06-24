"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { FormErrorBanner, FieldError } from "@/components/form-messages"
import {
  validateSignupFields,
  hasSignupErrors,
  mapSignupApiError,
  invalidFieldClass,
  type SignupFieldErrors,
} from "@/lib/signup-validation"
import { cn } from "@/lib/utils"
import { DepartmentTypeFields } from "@/components/department-type-fields"
import { FREE_MEMBER_BENEFITS, SIGNUP_PLACEHOLDER_CLASS } from "@/lib/signup-form-copy"
import { useSignupPlaceholders } from "@/hooks/use-signup-placeholders"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check } from "lucide-react"

export function SignUpModal() {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [departmentType, setDepartmentType] = useState("")
  const [departmentOther, setDepartmentOther] = useState("")
  const { inputProps, hide } = useSignupPlaceholders()

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
    const email = (form.querySelector("#modal-email") as HTMLInputElement)?.value?.trim() ?? ""
    const firstName = (form.querySelector("#modal-firstName") as HTMLInputElement)?.value?.trim()
    const lastName = (form.querySelector("#modal-lastName") as HTMLInputElement)?.value?.trim()
    const agency = (form.querySelector("#modal-agency") as HTMLInputElement)?.value?.trim()
    const password = (form.querySelector("#modal-password") as HTMLInputElement)?.value ?? ""

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
      if (loginRes.ok) { window.location.href = "/"; return }
      setSuccess(true)
    } catch {
      setFieldErrors({ form: "Something went wrong. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="w-full mt-8 py-6 text-base font-semibold bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90"
        >
          Create Free Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-[#1a365d]">You&apos;re a member!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is ready. Start exploring What&apos;s New and our free content library.
            </p>
            <Button asChild className="mt-6 bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Link href="/">Go to SaferU</Link>
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#1a365d]">Join SaferU Free</DialogTitle>
              <DialogDescription>
                Weekly What&apos;s New content and our full safety library — free for public safety agencies.
              </DialogDescription>
            </DialogHeader>

            <ul className="space-y-1.5 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
              {FREE_MEMBER_BENEFITS.slice(0, 3).map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                  {benefit}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-2">
              <FormErrorBanner message={fieldErrors.form} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-firstName">First Name</Label>
                  <Input id="modal-firstName" {...inputProps("firstName", "John")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-lastName">Last Name</Label>
                  <Input id="modal-lastName" {...inputProps("lastName", "Smith")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-agency">Agency Name</Label>
                <Input id="modal-agency" {...inputProps("agency", "Metro Police Department")} />
              </div>
              <DepartmentTypeFields
                idPrefix="modal-"
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
              <div className="space-y-1.5">
                <Label htmlFor="modal-email">Work Email</Label>
                <Input
                  id="modal-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  {...inputProps("email", "you@agency.gov", {
                    onChange: () => clearFieldError("email"),
                    className: fieldErrors.email ? invalidFieldClass : undefined,
                  })}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-password">Password (min 8 characters)</Label>
                <PasswordInput
                  id="modal-password"
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
                    fieldErrors.password ? invalidFieldClass : undefined
                  )}
                />
                <FieldError message={fieldErrors.password} />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
                disabled={loading}
              >
                {loading ? "Creating your account…" : "Create My Free Account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
