import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BackButton } from '../../components/BackButton'
import { Button } from '../../components/ui'
import { getActivePlan } from '../../data/repositories/planRepo'
import { describeTargets } from '../../domain/calendar'
import { WEEKDAY_NAMES, WEEKDAY_SHORT, formatDate, todayISO, weekdayOf } from '../../domain/dates'
import { shortFirstWeek } from '../../domain/runningPlan'
import { formatDistance } from '../../domain/units'
import { useProfile } from '../../lib/profileContext'
import { downloadPlanCalendar } from './exportPlan'

/**
 * A plain, printable copy of the plan. "Print or save as PDF" uses the browser's print dialog,
 * which on phones can also save a PDF to share. Screen-only controls are hidden when printing.
 */
export function PlanPrintScreen() {
  const { units } = useProfile()
  const plan = useLiveQuery(getActivePlan)
  const [added, setAdded] = useState<number | null>(null)
  const today = todayISO()
  if (plan === undefined) return null
  const short = plan?.sessions && plan.runWeeks ? shortFirstWeek(plan.sessions, plan.runWeeks) : null

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-16 print:max-w-none print:p-0">
      <div className="print:hidden">
        <BackButton parent="/plan" parentLabel="Plan" className="mb-2" />
      </div>
      <header className="mb-5">
        <p className="text-[13px] font-semibold tracking-[0.06em] text-accent uppercase print:text-black">Steady</p>
        <h1 className="text-[28px] leading-tight font-semibold">Your training plan</h1>
        {plan && (
          <p className="mt-1 text-muted">
            {plan.summary}. Started {formatDate(plan.startDate, { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        )}
      </header>

      {!plan ? (
        <p className="text-muted">No active plan.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-2 print:hidden">
            <Button block onClick={() => window.print()}>
              Print or save as PDF
            </Button>
            <Button block variant="secondary" onClick={() => setAdded(downloadPlanCalendar(plan, units))}>
              Add to calendar
            </Button>
            {added !== null && (
              <p role="status" className="text-[14px] text-muted">
                Downloaded a calendar file with {added} {added === 1 ? 'event' : 'events'}. Open it to add your sessions to your phone’s calendar.
              </p>
            )}
          </div>

          {plan.type === 'running' && plan.runWeeks && plan.sessions ? (
            <div className="flex flex-col gap-5">
              {plan.goalDate && plan.goalDistance && (
                <p>
                  Goal: {formatDistance(plan.goalDistance, units)} on {formatDate(plan.goalDate, { weekday: 'long', month: 'long', day: 'numeric' })}.
                </p>
              )}
              {plan.runWeeks
                .filter((w) => w.end >= today)
                .map((w) => (
                  <section key={w.start} className="break-inside-avoid">
                    <h2 className="text-[17px] font-semibold">
                      Week of {formatDate(w.start, { month: 'short', day: 'numeric' })}{' '}
                      <span className="font-normal text-muted">
                        · {formatDistance(w.distanceM, units)}
                        {short && w.start === plan.runWeeks![0].start && ` · short first week (${short.runs} of ${short.usual} runs)`}
                      </span>
                    </h2>
                    <table className="mt-1 w-full text-left text-[14px]">
                      <tbody>
                        {plan.sessions!
                          .filter((s) => s.date >= w.start && s.date <= w.end)
                          .map((s) => (
                            <tr key={s.date + s.name} className="border-t border-border align-top">
                              <td className="w-24 py-1.5 pr-2 whitespace-nowrap text-muted">
                                {WEEKDAY_SHORT[weekdayOf(s.date)]} {formatDate(s.date, { month: 'numeric', day: 'numeric' })}
                              </td>
                              <td className="py-1.5 pr-2 font-medium">{s.name}</td>
                              <td className="py-1.5 whitespace-pre-line text-muted">{describeTargets(s.targets, units)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </section>
                ))}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-muted">Repeats every week.</p>
              {plan.weekly.map((s) => (
                <section key={s.weekday} className="break-inside-avoid">
                  <h2 className="text-[17px] font-semibold">
                    {WEEKDAY_NAMES[s.weekday]}: {s.name}
                  </h2>
                  <p className="mt-1 text-[14px] whitespace-pre-line text-muted">{describeTargets(s.targets, units)}</p>
                </section>
              ))}
            </div>
          )}
          <p className="mt-8 text-[13px] text-muted">Step-by-step instructions and short video demos for every exercise are in Steady’s Exercises tab.</p>
        </>
      )}
    </main>
  )
}
