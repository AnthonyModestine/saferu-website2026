export interface SignupFieldErrors {
  email?: string
  password?: string
  firstName?: string
  lastName?: string
  agency?: string
  form?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSignupFields(values: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  agency?: string
  requireNames?: boolean
  requireAgency?: boolean
}): SignupFieldErrors {
  const errors: SignupFieldErrors = {}
  const email = values.email.trim()
  const password = values.password

  if (!email) errors.email = "Email is required"
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address"

  if (!password) errors.password = "Password is required"
  else if (password.length < 8) errors.password = "Password must be at least 8 characters"
  else if (password.length > 128) errors.password = "Password must be 128 characters or fewer"

  if (values.requireNames) {
    if (!values.firstName?.trim()) errors.firstName = "First name is required"
    if (!values.lastName?.trim()) errors.lastName = "Last name is required"
  }

  if (values.requireAgency && !values.agency?.trim()) {
    errors.agency = "Agency name is required"
  }

  return errors
}

export function hasSignupErrors(errors: SignupFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}

/** Map API error text to the most relevant field (or a form-level message). */
export function mapSignupApiError(message: string): SignupFieldErrors {
  const lower = message.toLowerCase()

  if (lower.includes("already registered")) {
    return { email: "This email is already registered. Sign in or use a different email." }
  }
  if (lower.includes("password") && (lower.includes("min") || lower.includes("8 character"))) {
    return { password: "Password must be at least 8 characters" }
  }
  if (lower.includes("password") && lower.includes("long")) {
    return { password: "Password must be 128 characters or fewer" }
  }
  if (lower.includes("email") && lower.includes("required")) {
    return { email: "Email is required" }
  }
  if (lower.includes("too many")) {
    return { form: message }
  }

  return { form: message || "Sign up failed. Please try again." }
}

export const invalidFieldClass = "border-red-500 focus-visible:ring-red-500"
