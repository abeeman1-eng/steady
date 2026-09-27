import { Link } from 'react-router-dom'
import { Card, Meter, Ring } from '../../components/ui'
import { type ExtraKey, EXTRA_KEYS, type Nutrition, NUTRIENTS, formatCalories, formatNutrient } from '../../domain/nutrition'

type MacroKey = 'proteinG' | 'carbsG' | 'fatG'
const MACROS: MacroKey[] = ['proteinG', 'carbsG', 'fatG']

/** Data-viz categorical slots 1–3; always shown next to a text label. */
const MACRO_COLOR: Record<MacroKey, string> = { proteinG: 'var(--protein)', carbsG: 'var(--carbs)', fatG: 'var(--fat)' }

function Dot({ macro }: { macro: MacroKey }) {
  return <span aria-hidden className="inline-block size-2 shrink-0 rounded-full" style={{ background: MACRO_COLOR[macro] }} />
}

/** Compact "P 12 g · C 30 g · F 5 g" line for a food or meal. */
export function MacroLine({ n, className = '' }: { n: Nutrition; className?: string }) {
  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted tabular-nums ${className}`}>
      {MACROS.map((m) => (
        <span key={m} className="inline-flex items-center gap-1.5">
          <Dot macro={m} />
          <span>
            <span className="sr-only">{NUTRIENTS[m].label} </span>
            <span aria-hidden>{NUTRIENTS[m].short} </span>
            {Math.round(n[m])} g
          </span>
        </span>
      ))}
    </span>
  )
}

/** Full nutrition for a food or entry: calories, macros, then the extras (or "–" when not listed). */
export function NutrientPanel({ nutrition }: { nutrition: Nutrition }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-4 ring-1 ring-border ring-inset">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-muted">Calories</span>
        <span className="text-2xl font-semibold tabular-nums">{formatCalories(nutrition.calories)}</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {MACROS.map((m) => (
          <div key={m} className="rounded-xl bg-surface px-3 py-2">
            <dt className="flex items-center gap-1.5 text-[12px] text-muted">
              <Dot macro={m} />
              {NUTRIENTS[m].label}
            </dt>
            <dd className="mt-0.5 text-[17px] font-semibold tabular-nums">{formatNutrient(m, nutrition[m])}</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[14px]">
        {EXTRA_KEYS.map((k) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted">{NUTRIENTS[k].label}</dt>
            <dd className="tabular-nums">{formatNutrient(k, nutrition[k])}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * The day at a glance: a calorie ring, macro meters, and the extras. Meters only appear for
 * targets the user has set; wording stays neutral (no red, no scolding) when a limit is passed.
 */
export function DailySummary({ totals, targets, missing, minor = false }: { totals: Nutrition; targets?: Partial<Nutrition>; missing: Record<ExtraKey, number>; minor?: boolean }) {
  const cal = targets?.calories
  const remaining = cal ? cal - totals.calories : undefined
  const unlisted = EXTRA_KEYS.filter((k) => missing[k] > 0).map((k) => NUTRIENTS[k].label.toLowerCase())

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <Ring value={totals.calories} target={cal} label={cal ? `${Math.round(totals.calories)} of ${cal} calories` : `${Math.round(totals.calories)} calories`}>
          <span className="text-[26px] leading-none font-semibold tabular-nums">{formatCalories(totals.calories)}</span>
          <span className="mt-1 text-[12px] text-muted">{cal ? `of ${formatCalories(cal)}` : 'calories'}</span>
        </Ring>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {MACROS.map((m) => {
            const target = targets?.[m]
            return (
              <div key={m} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="flex items-center gap-1.5 text-muted">
                    <Dot macro={m} />
                    {NUTRIENTS[m].label}
                  </span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{Math.round(totals[m])}</span>
                    <span className="text-muted">{target ? ` / ${Math.round(target)} g` : ' g'}</span>
                  </span>
                </div>
                {target ? <Meter value={totals[m]} target={target} color={MACRO_COLOR[m]} label={`${NUTRIENTS[m].label} toward target`} /> : null}
              </div>
            )
          })}
        </div>
      </div>

      {remaining !== undefined && (
        <p className="-mt-1 text-[13px] text-muted">
          {remaining >= 0 ? `${formatCalories(remaining)} calories left today` : `${formatCalories(-remaining)} calories over your target`}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 border-t border-border pt-4">
        {EXTRA_KEYS.map((k) => {
          const target = targets?.[k]
          const meta = NUTRIENTS[k]
          const value = totals[k]
          return (
            <div key={k} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <dt className="text-muted">{meta.label}</dt>
                <dd className="tabular-nums">
                  <span className="font-medium">{value === undefined ? '–' : formatNutrient(k, value).replace(/ (g|mg)$/, '')}</span>
                  <span className="text-muted">{target ? ` / ${Math.round(target)} ${meta.unit}` : value === undefined ? '' : ` ${meta.unit}`}</span>
                </dd>
              </div>
              {target ? <Meter value={value ?? 0} target={target} color="var(--neutral)" label={`${meta.label} ${meta.limit ? 'toward limit' : 'toward target'}`} /> : null}
              {target && meta.limit ? <span className="text-[11px] text-subtle">Limit</span> : null}
            </div>
          )
        })}
      </dl>

      <div className="-mt-2 flex items-center justify-between gap-3 text-[12px] text-subtle">
        <span>{unlisted.length > 0 ? `Some foods don’t list ${unlisted.join(', ')}.` : ''}</span>
        {/* No plan or targets prompts for under-18s. */}
        {!minor && (
          <Link to={targets && Object.keys(targets).length ? '/meals/targets' : '/meals/plan'} className="inline-flex min-h-11 shrink-0 items-center font-medium text-accent">
            {targets && Object.keys(targets).length ? 'Edit targets' : 'Build my plan'}
          </Link>
        )}
      </div>
    </Card>
  )
}
