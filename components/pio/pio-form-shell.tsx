import type { ReactNode } from "react"

export type PioStep = { id: string; label: string }

/** Shared stepper used across Press Center create flows (events, press, video). */
export function PioStepper({
  steps,
  currentId,
  onSelect,
  isLocked,
  accent = "blue",
}: {
  steps: readonly PioStep[]
  currentId: string
  onSelect: (id: string) => void
  /** Return true to disable a step (e.g. preview before generate). */
  isLocked?: (id: string) => boolean
  accent?: "blue" | "green"
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentId)
  const activeBg = accent === "green" ? "bg-[#10B981] text-white" : "bg-[#2563EB] text-white"
  const doneBg = accent === "green" ? "bg-[#D1FAE5] text-[#047857]" : "bg-[#DBEAFE] text-[#1D4ED8]"
  const activeText = accent === "green" ? "text-[#10B981]" : "text-[#2563EB]"
  const doneText = accent === "green" ? "text-[#047857]" : "text-[#1D4ED8]"

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e2e8f5] bg-white px-4 py-3 shadow-sm">
      {steps.map((s, i) => {
        const active = currentId === s.id
        const done = currentIndex > i
        const locked = isLocked?.(s.id) === true
        return (
          <div key={s.id} className="flex items-center gap-2">
            {i > 0 && <div className="mx-1 hidden h-px w-6 bg-[#e2e8f5] sm:block" />}
            <button
              type="button"
              disabled={locked}
              onClick={() => !locked && onSelect(s.id)}
              className="flex items-center gap-2 rounded-full px-1 py-1 text-left disabled:opacity-40"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  active ? activeBg : done ? doneBg : "bg-[#F3F4F6] text-[#6b7280]"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-sm font-semibold ${
                  active ? activeText : done ? doneText : "text-[#6b7280]"
                }`}
              >
                {s.label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function PioPageHeader({
  icon,
  iconClassName = "bg-[#EFF6FF] text-[#2563EB]",
  title,
  description,
  actions,
}: {
  icon: ReactNode
  iconClassName?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f1c3f]">{title}</h1>
          <p className="mt-1 text-sm text-[#667795]">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function PioFormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#e2e8f5] bg-white p-6 shadow-sm">{children}</div>
  )
}

export function PioSectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-[#0f1c3f]">{title}</h2>
      {description ? <p className="mt-1 text-sm text-[#7a8ab0]">{description}</p> : null}
    </div>
  )
}

export function PioStepFooter({
  onBack,
  backDisabled,
  next,
}: {
  onBack: () => void
  backDisabled?: boolean
  next: ReactNode
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-[#eef2f7] pt-5">
      <ButtonOutline onClick={onBack} disabled={backDisabled}>
        Back
      </ButtonOutline>
      {next}
    </div>
  )
}

function ButtonOutline({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center rounded-md border border-[#d5def0] bg-white px-4 text-sm font-medium text-[#0f1c3f] transition hover:bg-[#F8FAFC] disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  )
}
