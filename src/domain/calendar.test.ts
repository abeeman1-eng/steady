import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { describeTargets, nextWeekday, planCalendarEvents, toIcs } from './calendar'
import { generatePlan } from './planGenerator'
import { RACE_DISTANCE_M } from './runningPlan'

const TODAY = '2026-11-21' // a Saturday
const strengthPlan = { id: 'p1', ...generatePlan({ experienceLevel: 'new', goals: ['strength'], daysPerWeek: 3, equipment: ['dumbbells'] }) }

describe('calendar export (peer feedback: export the plan until integrations exist)', () => {
  it('turns a repeating plan into weekly events starting on the next matching day', () => {
    const events = planCalendarEvents(strengthPlan, TODAY, 'imperial')
    expect(events.map((e) => [e.title, e.date])).toEqual([
      ['Steady: Full body A', '2026-11-23'],
      ['Steady: Full body B', '2026-11-25'],
      ['Steady: Full body C', '2026-11-27'],
    ])
    expect(events.every((e) => e.weeklyCount === 12)).toBe(true)
    expect(events[0].description).toMatch(/^Goblet squat: 3 × 8–12\n/)
    expect(nextWeekday(TODAY, 6)).toBe(TODAY)
  })

  it('lists every remaining dated session of a running plan, ending with race day', () => {
    const goal = { label: '10K', distanceM: RACE_DISTANCE_M['10K'], date: addDays(TODAY, 70) }
    const plan = { id: 'r1', ...generatePlan({ experienceLevel: 'some', goals: ['running'], daysPerWeek: 3, equipment: ['bodyweight'], runningGoal: goal, startDate: TODAY }) }
    const events = planCalendarEvents(plan, addDays(TODAY, 7), 'metric')
    expect(events.length).toBe(plan.sessions!.filter((s) => s.date >= addDays(TODAY, 7)).length)
    expect(events.every((e) => !e.weeklyCount)).toBe(true)
    expect(events[events.length - 1]).toMatchObject({ title: 'Steady: Race day: 10K', date: goal.date })
    expect(describeTargets(plan.sessions!.at(-1)!.targets, 'metric')).toMatch(/^10 km\. /)
  })

  it('writes a valid .ics file: all-day events, escaped text, CRLF and folded lines', () => {
    const ics = toIcs(planCalendarEvents(strengthPlan, TODAY, 'imperial'), new Date(Date.UTC(2026, 10, 21, 12)))
    const lines = ics.split('\r\n')
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3)
    expect(ics).toContain('DTSTART;VALUE=DATE:20261123')
    expect(ics).toContain('DTEND;VALUE=DATE:20261124')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;COUNT=12;BYDAY=MO')
    expect(ics).toContain('DTSTAMP:20261121T120000Z')
    // Commas in text are escaped, newlines become \n, and no physical line is over 75 octets.
    expect(ics).toMatch(/DESCRIPTION:Goblet squat: 3 × 8–12\\nDumbbell/)
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(toIcs([{ uid: 'x', date: TODAY, title: 'a, b; c', description: '' }], new Date())).toContain('SUMMARY:a\\, b\\; c')
  })
})
