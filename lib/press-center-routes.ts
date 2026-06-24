export const PRESS_CENTER_CHECKOUT_PATH = "/pio-tool/subscribe?checkout=1"

export function pressCenterSignUpUrl(): string {
  return `/sign-up?returnUrl=${encodeURIComponent(PRESS_CENTER_CHECKOUT_PATH)}&pressCenter=1`
}

export function pressCenterSignInUrl(): string {
  return `/sign-in?returnUrl=${encodeURIComponent(PRESS_CENTER_CHECKOUT_PATH)}`
}
