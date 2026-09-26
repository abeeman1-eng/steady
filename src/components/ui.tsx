import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold hover:brightness-110',
  secondary: 'bg-surface-2 text-text border border-border hover:bg-border',
  ghost: 'text-accent hover:bg-surface-2',
  danger: 'bg-surface-2 text-danger border border-border hover:bg-border',
}

export function Button({ variant = 'primary', className = '', block, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>{children}</section>
}

export function Screen({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="mb-4 flex min-h-11 items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        {action}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </main>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{children}</h2>
}

/** Single- or multi-select list of large tappable options. */
export function ChoiceList<T extends string | number>({
  label,
  options,
  value,
  onChange,
  multi = false,
}: {
  label: string
  options: { value: T; label: string; hint?: string }[]
  value: T | T[] | undefined
  onChange: (value: T) => void
  multi?: boolean
}) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div role={multi ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-col gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role={multi ? 'checkbox' : 'radio'}
          aria-checked={selected(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${
            selected(o.value) ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-2'
          }`}
        >
          <span>
            <span className="block font-medium">{o.label}</span>
            {o.hint && <span className="block text-sm text-muted">{o.hint}</span>}
          </span>
          <span
            aria-hidden
            className={`flex size-6 shrink-0 items-center justify-center ${multi ? 'rounded-md' : 'rounded-full'} border-2 ${
              selected(o.value) ? 'border-accent bg-accent text-accent-ink' : 'border-neutral'
            }`}
          >
            {selected(o.value) && <CheckIcon className="size-4" />}
          </span>
        </button>
      ))}
    </div>
  )
}

export function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-11 w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-accent' : 'bg-neutral'}`}>
        <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  )
}

export const inputClass = 'min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text placeholder:text-muted focus:border-accent focus:outline-none'

export function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function PRBadge({ className = '' }: { className?: string }) {
  return <span className={`inline-flex items-center rounded-md bg-gold px-1.5 py-0.5 text-xs font-bold text-gold-ink ${className}`}>PR</span>
}

/** − value + control with typed entry, e.g. servings in steps of 0.5. */
export function Stepper({ label, value, onChange, step = 1, min = 0, format = String }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; format?: (v: number) => string }) {
  const clamp = (v: number) => Math.max(min, Math.round(v * 100) / 100)
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - step))} disabled={value - step < min} className="min-h-11 min-w-11 rounded-xl bg-surface-2 text-xl disabled:opacity-40" aria-label={`Decrease ${label}`}>
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={format(value)}
        step={step}
        min={min}
        onChange={(e) => {
          const n = parseFloat(e.target.value)
          if (Number.isFinite(n)) onChange(clamp(n))
        }}
        onFocus={(e) => e.target.select()}
        className="min-h-11 w-20 rounded-xl border border-border bg-surface-2 text-center text-lg tabular-nums focus:border-accent focus:outline-none"
      />
      <button type="button" onClick={() => onChange(clamp(value + step))} className="min-h-11 min-w-11 rounded-xl bg-surface-2 text-xl" aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  )
}
