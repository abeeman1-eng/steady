import type { PlannedSessionRecord, WorkoutRecord } from '../../data/schema'
import { WEEKDAY_NAMES, addDays, weekdayOf } from '../../domain/dates'
import { CheckIcon } from '../../components/ui'

type DayState = 'done' | 'planned' | 'optional' | 'rest'

const LABEL: Record<DayState, string> = { done: 'completed', planned: 'planned', optional: 'optional session', rest: 'rest day' }

export function WeekDots({ weekStart, today, planned, done }: { weekStart: string; today: string; planned: PlannedSessionRecord[]; done: WorkoutRecord[] }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const doneDates = new Set(done.map((w) => w.date))
  const completedCount = days.filter((d) => doneDates.has(d)).length
  const plannedCount = planned.filter((p) => !p.optional).length

  return (
    <div>
      <ol className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const p = planned.find((s) => s.date === date)
          const state: DayState = doneDates.has(date) ? 'done' : p ? (p.optional ? 'optional' : 'planned') : 'rest'
          const weekday = WEEKDAY_NAMES[weekdayOf(date)]
          return (
            <li key={date} className="flex flex-col items-center gap-1" aria-label={`${weekday}: ${LABEL[state]}`}>
              <span className={`text-xs ${date === today ? 'font-bold text-text' : 'text-muted'}`}>{weekday[0]}</span>
              <span
                className={`flex size-8 items-center justify-center rounded-full ${
                  state === 'done'
                    ? 'bg-accent text-accent-ink'
                    : state === 'planned'
                      ? 'border-2 border-accent'
                      : state === 'optional'
                        ? 'border-2 border-dashed border-neutral'
                        : 'bg-surface-2'
                } ${date === today ? 'ring-2 ring-text ring-offset-2 ring-offset-surface' : ''}`}
              >
                {state === 'done' && <CheckIcon className="size-4" />}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-sm text-muted">
        {plannedCount > 0
          ? `${completedCount} of ${plannedCount} planned sessions done`
          : completedCount > 0
            ? `${completedCount} workout${completedCount > 1 ? 's' : ''} done this week`
            : 'No sessions planned for the rest of this week.'}
      </p>
    </div>
  )
}
