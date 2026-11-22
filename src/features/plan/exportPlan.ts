import type { PlanRecord } from '../../data/schema'
import { planCalendarEvents, toIcs } from '../../domain/calendar'
import { todayISO } from '../../domain/dates'
import type { Units } from '../../domain/types'

/** Download the plan as an .ics file; phones offer to add it to their calendar. */
export function downloadPlanCalendar(plan: PlanRecord, units: Units): number {
  const events = planCalendarEvents(plan, todayISO(), units)
  const blob = new Blob([toIcs(events, new Date())], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'steady-plan.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return events.length
}
