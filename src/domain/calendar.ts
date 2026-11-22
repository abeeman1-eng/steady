import { addDays, weekdayOf } from './dates'
import { EXERCISES_BY_ID } from './exerciseLibrary'
import type { DatedSessionTemplate, SessionTargets, SessionTemplate, Units } from './types'
import { formatDistance } from './units'

/**
 * Calendar export (an .ics file that Google, Apple and Outlook calendars import). Sessions are
 * all-day events, since Steady doesn't know what time someone trains. Repeating weekly plans
 * become weekly recurring events for `weeks` weeks; running plans list every dated session.
 */

export interface CalendarPlan {
  id: string
  type: 'strength' | 'mixed' | 'running'
  weekly: SessionTemplate[]
  sessions?: DatedSessionTemplate[]
}

interface CalendarEvent {
  uid: string
  date: string
  title: string
  description: string
  /** Repeat weekly this many times (repeating plans). */
  weeklyCount?: number
}

const ICS_DAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

/** What to do, one line per exercise or the run/cardio target. */
export function describeTargets(t: SessionTargets, units: Units): string {
  if (t.kind === 'strength') {
    return t.exercises
      .map((e) => {
        const ex = EXERCISES_BY_ID.get(e.exerciseId)
        const reps = e.repMin === e.repMax ? `${e.repMin}` : `${e.repMin}–${e.repMax}`
        return `${ex?.name ?? e.exerciseId}: ${e.sets} × ${reps}${ex?.timed ? ' sec' : ''}`
      })
      .join('\n')
  }
  if (t.kind === 'run') return `${t.distanceM ? formatDistance(t.distanceM, units) : `${t.durationMin} min`}. ${t.detail}. ${t.cue}.`
  return `${t.durationMin} min. ${t.activity}. ${t.cue}.`
}

/** The first date on or after `from` that falls on `weekday` (0 = Sunday). */
export const nextWeekday = (from: string, weekday: number) => addDays(from, (weekday - weekdayOf(from) + 7) % 7)

export function planCalendarEvents(plan: CalendarPlan, today: string, units: Units, weeks = 12): CalendarEvent[] {
  const footer = '\n\nSteps and video demos for every exercise are in Steady.'
  if (plan.type === 'running' && plan.sessions) {
    return plan.sessions
      .filter((s) => s.date >= today)
      .map((s) => ({ uid: `${plan.id}-${s.date}-${s.name}`, date: s.date, title: `Steady: ${s.name}`, description: describeTargets(s.targets, units) + footer }))
  }
  return plan.weekly.map((s) => ({
    uid: `${plan.id}-${s.weekday}-${s.name}`,
    date: nextWeekday(today, s.weekday),
    title: `Steady: ${s.name}${s.optional ? ' (optional)' : ''}`,
    description: describeTargets(s.targets, units) + footer,
    weeklyCount: weeks,
  }))
}

/** RFC 5545 text escaping. */
const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Lines longer than 75 octets are folded onto continuation lines that start with a space. */
function fold(line: string): string {
  const out: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length
    if (bytes + size > (out.length ? 74 : 75)) {
      out.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += size
  }
  out.push(current)
  return out.join('\r\n ')
}

const icsDate = (iso: string) => iso.replace(/-/g, '')

export function toIcs(events: CalendarEvent[], stamp: Date): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Steady//Training plan//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Steady training plan']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(e.uid.replace(/\s+/g, '-'))}@steady`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(e.date)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(e.date, 1))}`,
      ...(e.weeklyCount ? [`RRULE:FREQ=WEEKLY;COUNT=${e.weeklyCount};BYDAY=${ICS_DAY[weekdayOf(e.date)]}`] : []),
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
