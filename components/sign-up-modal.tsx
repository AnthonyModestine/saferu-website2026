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
              <DialogTitle className="text-xl font-bold text-[#1a365d]">Create Your Free Account</DialogTitle>
              <DialogDescription>
                Become a member and get weekly access to What&apos;s New plus our full content library.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-2">
              <FormErrorBanner message={fieldErrors.form} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-firstName">First Name</Label>
                  <Input id="modal-firstName" placeholder="First Name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-lastName">Last Name</Label>
                  <Input id="modal-lastName" placeholder="Last Name" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-agency">Agency Name</Label>
                <Input id="modal-agency" placeholder="Agency Name" />
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
              />
              <div className="space-y-1.5">
                <Label htmlFor="modal-email">Email</Label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="you@agency.gov"
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={fieldErrors.email ? invalidFieldClass : undefined}
                  onChange={() => clearFieldError("email")}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="modal-password">Password (min 8 characters)</Label>
                <PasswordInput
                  id="modal-password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={fieldErrors.password ? invalidFieldClass : undefined}
                  onChange={() => clearFieldError("password")}
                />
                <FieldError message={fieldErrors.password} />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#f2b233] text-[#1a365d] hover:bg-[#f2b233]/90 font-semibold"
                disabled={loading}
              >
                {loading ? "Creating…" : "Create Free Account"}
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
