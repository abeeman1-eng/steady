import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-3 text-text hover:bg-border-strong',
  ghost: 'text-accent hover:bg-surface-2',
  danger: 'bg-surface-3 text-danger hover:bg-border-strong',
}

export function Button({ variant = 'primary', className = '', block, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}

/** A Link styled as a button. */
export function ButtonLink({ to, variant = 'primary', className = '', children }: { to: string; variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link to={to} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-5 text-[15px] font-semibold transition ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  )
}

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <section className={`rounded-[20px] bg-surface p-5 ring-1 ring-border ring-inset ${className}`}>{children}</section>
}

export function Screen({ title, eyebrow, children, action }: { title: string; eyebrow?: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-[13px] font-medium text-muted">{eyebrow}</p>}
          <h1 className="text-[28px] leading-tight font-semibold">{title}</h1>
        </div>
        {action}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </main>
  )
}

/** Small section label above a group, with an optional trailing action. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-6 items-center justify-between gap-2 px-1">
      <h2 className="text-[13px] font-semibold tracking-[0.02em] text-muted">{children}</h2>
      {action}
    </div>
  )
}

/** Section title plus content, spaced consistently. */
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle action={action}>{title}</SectionTitle>
      {children}
    </section>
  )
}

/** iOS-style inset grouped list: rows separated by hairlines inside one rounded surface. */
export function ListGroup({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <ul className={`divide-y divide-border overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset ${className}`}>{children}</ul>
}

interface RowProps {
  title: ReactNode
  subtitle?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  /** Shows a chevron and makes the row a link or button. */
  to?: string
  onClick?: () => void
  ariaLabel?: string
}

export function ListRow({ title, subtitle, leading, trailing, to, onClick, ariaLabel }: RowProps) {
  const body = (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px]">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[13px] text-muted">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-right text-[15px] text-muted tabular-nums">{trailing}</span>}
      {(to || onClick) && <Chevron />}
    </>
  )
  const cls = 'flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left'
  if (to)
    return (
      <li>
        <Link to={to} aria-label={ariaLabel} className={`${cls} transition hover:bg-surface-2`}>
          {body}
        </Link>
      </li>
    )
  if (onClick)
    return (
      <li>
        <button type="button" onClick={onClick} aria-label={ariaLabel} className={`${cls} transition hover:bg-surface-2`}>
          {body}
        </button>
      </li>
    )
  return <li className={cls}>{body}</li>
}

export function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0 text-subtle" aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

/** Compact segmented control for 2–4 mutually exclusive options. */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-[14px] bg-surface-2 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-10 rounded-[10px] px-2 text-[14px] transition ${value === o.value ? 'bg-surface-3 font-semibold text-text shadow-sm' : 'text-muted hover:text-text'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
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
          className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left transition ${
            selected(o.value) ? 'bg-accent-soft ring-2 ring-accent ring-inset' : 'bg-surface ring-1 ring-border ring-inset hover:bg-surface-2'
          }`}
        >
          <span>
            <span className="block text-[15px] font-medium">{o.label}</span>
            {o.hint && <span className="mt-0.5 block text-[13px] text-muted">{o.hint}</span>}
          </span>
          <span
            aria-hidden
            className={`flex size-6 shrink-0 items-center justify-center ${multi ? 'rounded-lg' : 'rounded-full'} ${
              selected(o.value) ? 'bg-accent text-accent-ink' : 'ring-2 ring-neutral ring-inset'
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
        <span className="block text-[15px]">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-muted">{description}</span>}
      </span>
      <span aria-hidden className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition ${checked ? 'bg-accent' : 'bg-surface-3 ring-1 ring-border-strong ring-inset'}`}>
        <span className={`absolute top-[3px] size-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[23px]' : 'left-[3px]'}`} />
      </span>
    </button>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'min-h-12 w-full rounded-[14px] bg-surface-2 px-4 text-base text-text ring-1 ring-border ring-inset placeholder:text-subtle transition focus:ring-2 focus:ring-accent focus:outline-none'

export function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

export function PRBadge({ className = '' }: { className?: string }) {
  return <span className={`inline-flex items-center rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-gold-ink ${className}`}>PR</span>
}

/** − value + control with typed entry, e.g. servings in steps of 0.5. */
export function Stepper({ label, value, onChange, step = 1, min = 0, format = String }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; format?: (v: number) => string }) {
  const clamp = (v: number) => Math.max(min, Math.round(v * 100) / 100)
  return (
    <div className="flex items-center gap-1 rounded-[14px] bg-surface-2 p-1 ring-1 ring-border ring-inset" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - step))} disabled={value - step < min} className="min-h-10 min-w-10 rounded-[10px] text-xl text-muted hover:bg-surface-3 hover:text-text disabled:opacity-30" aria-label={`Decrease ${label}`}>
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
        className="min-h-10 w-14 bg-transparent text-center text-lg font-semibold tabular-nums focus:outline-none"
      />
      <button type="button" onClick={() => onChange(clamp(value + step))} className="min-h-10 min-w-10 rounded-[10px] text-xl text-muted hover:bg-surface-3 hover:text-text" aria-label={`Increase ${label}`}>
        +
      </button>
    </div>
  )
}

/**
 * Circular progress meter (single value, so no legend). The center shows the value in text, so
 * the ring's color never carries meaning on its own.
 */
export function Ring({ value, target, size = 132, stroke = 10, color = 'var(--accent)', label, children }: { value: number; target?: number; size?: number; stroke?: number; color?: string; label: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = target ? Math.min(1, Math.max(0, value / target)) : 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        {pct > 0 && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} className="transition-[stroke-dasharray] duration-500" />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/** Thin horizontal meter toward a target or limit. */
export function Meter({ value, target, color = 'var(--accent)', label }: { value: number; target: number; color?: string; label: string }) {
  const pct = Math.min(100, Math.max(0, (value / target) * 100))
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.round(target)} aria-valuenow={Math.round(value)}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
