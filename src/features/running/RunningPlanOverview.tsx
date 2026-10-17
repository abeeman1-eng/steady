import type { PlannedSessionRecord } from '../../data/schema'
import { WEEKDAY_SHORT, formatDate, weekdayOf } from '../../domain/dates'
import type { DatedSessionTemplate, GeneratedPlan, RunPhase, Units } from '../../domain/types'
import { formatDistance } from '../../domain/units'
import { runTargetAmount } from './runLabels'

const PHASE_LABEL: Record<RunPhase, string> = {
  base: 'Base',
  build: 'Build',
  recovery: 'Easier week',
  peak: 'Peak',
  taper: 'Taper',
  race: 'Race week',
}

const STATUS_LABEL: Record<PlannedSessionRecord['status'], string> = { planned: '', done: 'Done', missed: 'Missed' }

/**
 * A running plan week by week: phase, distance and long run, with each week's sessions inside.
 * `statuses` (planned session id by date and name) adds Done/Missed labels on the Plan screen.
 */
export function RunningPlanOverview({
  plan,
  units,
  today,
  statuses,
  openWeekOf,
}: {
  plan: Pick<GeneratedPlan, 'summary' | 'sessions' | 'runWeeks' | 'goalDate' | 'goalDistance' | 'flaggedUnrealistic'>
  units: Units
  today?: string
  statuses?: PlannedSessionRecord[]
  /** Expand the week containing this date (e.g. today). Defaults to the first week. */
  openWeekOf?: string
}) {
  const weeks = plan.runWeeks ?? []
  const sessions = plan.sessions ?? []
  const openIndex = Math.max(0, openWeekOf ? weeks.findIndex((w) => w.start <= openWeekOf && openWeekOf <= w.end) : 0)
  const statusFor = (s: DatedSessionTemplate) => statuses?.find((p) => p.date === s.date && p.name === s.name)?.status

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-accent-soft p-4 text-lg font-semibold">{plan.summary}</p>
      {plan.goalDate && plan.goalDistance && (
        <p className="text-[15px] text-muted">
          Goal: {formatDistance(plan.goalDistance, units)} on {formatDate(plan.goalDate, { weekday: 'long', month: 'long', day: 'numeric' })}. Peak week is about 3 weeks out, then shorter runs into race day.
        </p>
      )}
      {plan.flaggedUnrealistic && (
        <p className="rounded-2xl bg-surface-2 p-4 text-[14px] text-muted">
          Your date is sooner than recommended, so this plan is compressed. It still adds no more than 10% a week, which means it peaks lower than usual. Run/walk on race day is completely fine.
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {weeks.map((w, i) => {
          const inWeek = sessions.filter((s) => s.date >= w.start && s.date <= w.end)
          const current = today !== undefined && w.start <= today && today <= w.end
          return (
            <li key={w.start}>
              <details open={i === openIndex} className="group rounded-[18px] bg-surface ring-1 ring-border ring-inset open:pb-2">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15px] font-medium">
                      Week {i + 1}
                      <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[12px] font-medium text-muted">{PHASE_LABEL[w.phase]}</span>
                      {current && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-medium text-accent">This week</span>}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-muted">
                      {formatDate(i === 0 && sessions[0] && sessions[0].date > w.start ? sessions[0].date : w.start, { month: 'short', day: 'numeric' })} · {formatDistance(w.distanceM, units)}
                      {w.longRunM > 0 && ` · long run ${formatDistance(w.longRunM, units)}`}
                    </span>
                  </span>
                  <span aria-hidden className="text-muted transition group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <ul className="mx-4 flex flex-col border-t border-border">
                  {inWeek.length === 0 && <li className="py-3 text-[14px] text-muted">No sessions this week.</li>}
                  {inWeek.map((s) => {
                    const status = statusFor(s)
                    return (
                      <li key={`${s.date}-${s.name}`} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
                        <span className="w-10 shrink-0 text-[13px] text-muted">{WEEKDAY_SHORT[weekdayOf(s.date)]}</span>
                        <span className="min-w-0 flex-1 truncate text-[15px]">{s.name}</span>
                        <span className="shrink-0 text-[13px] text-muted tabular-nums">{s.targets.kind === 'run' ? runTargetAmount(s.targets, units) : 'Strength'}</span>
                        {status && status !== 'planned' && (
                          <span className={`w-14 shrink-0 text-right text-[12px] font-medium ${status === 'done' ? 'text-accent' : 'text-subtle'}`}>{STATUS_LABEL[status]}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </details>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
