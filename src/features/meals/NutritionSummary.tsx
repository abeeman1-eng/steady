import { Card } from '../../components/ui'
import { type Nutrition, formatCalories } from '../../domain/nutrition'

const MACROS: { key: 'proteinG' | 'carbsG' | 'fatG'; label: string }[] = [
  { key: 'proteinG', label: 'Protein' },
  { key: 'carbsG', label: 'Carbs' },
  { key: 'fatG', label: 'Fat' },
]

/** Daily totals, with progress bars only for targets the user has set. Neutral wording, no scolding. */
export function NutritionSummary({ totals, targets }: { totals: Nutrition; targets?: Partial<Nutrition> }) {
  const calTarget = targets?.calories
  return (
    <Card>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted">Calories</p>
          <p className="text-3xl font-bold tabular-nums">
            {formatCalories(totals.calories)}
            {calTarget ? <span className="text-lg font-normal text-muted"> / {formatCalories(calTarget)}</span> : null}
          </p>
        </div>
        {calTarget ? (
          <p className="text-sm text-muted">
            {totals.calories <= calTarget ? `${formatCalories(calTarget - totals.calories)} left` : `${formatCalories(totals.calories - calTarget)} over`}
          </p>
        ) : null}
      </div>
      {calTarget ? <Bar value={totals.calories} target={calTarget} label="Calories" /> : null}
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {MACROS.map((m) => {
          const target = targets?.[m.key]
          return (
            <div key={m.key}>
              <dt className="text-xs text-muted">{m.label}</dt>
              <dd className="font-semibold tabular-nums">
                {Math.round(totals[m.key])}
                {target ? <span className="font-normal text-muted"> / {Math.round(target)}</span> : null} g
              </dd>
              {target ? <Bar value={totals[m.key]} target={target} label={m.label} /> : null}
            </div>
          )
        })}
      </dl>
    </Card>
  )
}

function Bar({ value, target, label }: { value: number; target: number; label: string }) {
  const pct = Math.min(100, (value / target) * 100)
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label={`${label} toward target`} aria-valuemin={0} aria-valuemax={Math.round(target)} aria-valuenow={Math.round(value)}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  )
}
