export function FormErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
  )
}
