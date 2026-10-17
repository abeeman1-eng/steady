import { addDays, todayISO, weekdayOf } from '../dates'
import { RUN_SLOTS, buildRunSchedule, checkRunningGoal, clampRunDays } from '../runningPlan'
import type { DatedSessionTemplate, GeneratedPlan, MainGoal, PlanInput, SessionTargets, SessionTemplate } from '../types'
import { BLUEPRINTS, LEVEL_CONFIG, buildStrengthSession } from './strength'

export { LEVEL_CONFIG, buildStrengthSession, candidatesFor } from './strength'

/** Which weekdays to train on (0 = Sunday), spread out so rest days fall between sessions. */
export const WEEKDAY_SLOTS: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
}

type MixedSchedule = Record<number, { pattern: string; weekdays: number[] }>

/** Mixed plans (weight loss, general fitness, running without a goal date): S = strength, C = easy cardio. */
const BALANCED: MixedSchedule = {
  2: { pattern: 'SC', weekdays: [1, 4] },
  3: { pattern: 'SCS', weekdays: [1, 3, 5] },
  4: { pattern: 'SCSC', weekdays: [1, 2, 4, 5] },
  5: { pattern: 'SCSCS', weekdays: [1, 2, 3, 5, 6] },
  6: { pattern: 'SCSCSC', weekdays: [1, 2, 3, 4, 5, 6] },
}

/** When strength is one of several goals, 4-day plans get a third strength day, still spaced out. */
const STRENGTH_LEANING: MixedSchedule = {
  ...BALANCED,
  4: { pattern: 'SSSC', weekdays: [1, 3, 5, 6] },
}

type Draft = Omit<SessionTemplate, 'weekday'>

export const clampDays = (days: number) => Math.min(6, Math.max(2, Math.round(days)))

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** Only "build strength" on its own gets a pure strength plan; any other goal adds easy cardio days. */
export const isStrengthOnly = (input: Pick<PlanInput, 'goals'>) => input.goals.length > 0 && input.goals.every((g) => g === 'strength')

export function generatePlan(input: PlanInput): GeneratedPlan {
  const days = clampDays(input.daysPerWeek)
  if (input.goals.includes('running') && input.runningGoal) return runningPlan(input, days)
  if (isStrengthOnly(input)) {
    const weekly = strengthDrafts(input, days).map((d, i) => ({ ...d, weekday: WEEKDAY_SLOTS[days][i] }))
    return { type: 'strength', summary: summarize(input, weekly), weekly }
  }
  const schedule = (input.goals.includes('strength') ? STRENGTH_LEANING : BALANCED)[days]
  const weekly = mixedDrafts(input, schedule.pattern).map((d, i) => ({ ...d, weekday: schedule.weekdays[i] }))
  return { type: 'mixed', summary: summarize(input, weekly), weekly }
}

/** Running alone: every training day is a run. With other goals: up to 3 runs, the rest strength. */
export function runDaysFor(goals: MainGoal[], days: number): number {
  return goals.every((g) => g === 'running') ? clampRunDays(days) : days <= 3 ? 2 : 3
}

/** Strength days in a running plan go on non-run days, spread out (Monday first). */
const STRENGTH_WEEKDAYS = [1, 3, 5, 0, 4, 2]
/** No strength in the last days before race day. */
const RACE_STRENGTH_GAP_DAYS = 3

function runningPlan(input: PlanInput, days: number): GeneratedPlan {
  const goal = input.runningGoal!
  const start = input.startDate ?? todayISO()
  const runDays = runDaysFor(input.goals, days)
  const schedule = buildRunSchedule({ goal, level: input.experienceLevel, runDays, startDate: start })

  const strengthCount = days - runDays
  const runWeekdays = RUN_SLOTS[runDays]
  const strengthWeekdays = STRENGTH_WEEKDAYS.filter((d) => !runWeekdays.includes(d)).slice(0, strengthCount)
  const drafts = [strength('Full body A', input, 'fullA'), strength('Full body B', input, 'fullB'), strength('Full body C', input, 'fullC')]
  const sessions: DatedSessionTemplate[] = [...schedule.sessions]
  for (let date = start; date < addDays(goal.date, -(RACE_STRENGTH_GAP_DAYS - 1)); date = addDays(date, 1)) {
    const i = strengthWeekdays.indexOf(weekdayOf(date))
    if (i >= 0) sessions.push({ ...drafts[i % drafts.length], date })
  }
  sessions.sort((a, b) => a.date.localeCompare(b.date))

  const label = goal.label === 'Custom' ? 'goal run' : goal.label
  const strengthPart = strengthCount ? ` and ${plural(strengthCount, 'strength day')}` : ''
  return {
    type: 'running',
    summary: `${plural(runDays, 'run')} a week${strengthPart}, building over ${plural(schedule.weeks.length, 'week')} to your ${label}`,
    weekly: [],
    sessions,
    runWeeks: schedule.weeks,
    goalDistance: goal.distanceM,
    goalDate: goal.date,
    flaggedUnrealistic: !checkRunningGoal(goal, input.experienceLevel, start).realistic,
  }
}

function strength(name: string, input: PlanInput, blueprint: keyof typeof BLUEPRINTS, variant = 0, optional = false): Draft {
  const targets: SessionTargets = {
    kind: 'strength',
    exercises: buildStrengthSession(BLUEPRINTS[blueprint], input.equipment, input.experienceLevel, variant),
  }
  return { name, type: 'strength', optional, targets }
}

function strengthDrafts(input: PlanInput, days: number): Draft[] {
  if (days <= 3) {
    const full = [strength('Full body A', input, 'fullA'), strength('Full body B', input, 'fullB'), strength('Full body C', input, 'fullC')]
    return full.slice(0, days)
  }
  const upperA = strength('Upper A', input, 'upper')
  const lowerA = strength('Lower A', input, 'lower')
  const upperB = strength('Upper B', input, 'upper', 1)
  const lowerB = strength('Lower B', input, 'lower', 1)
  if (days === 4) return [upperA, lowerA, upperB, lowerB]
  const coreArms = strength('Core & arms (optional)', input, 'coreArms', 0, true)
  if (days === 5) return [upperA, lowerA, coreArms, upperB, lowerB]
  return [upperA, lowerA, coreArms, upperB, lowerB, strength('Full body light (optional)', input, 'fullC', 1, true)]
}

function runActivity(input: PlanInput): string {
  if (input.experienceLevel === 'new') return 'Alternate 1 minute running with 2 minutes walking'
  if (input.experienceLevel === 'returning') return 'Alternate 3 minutes running with 1 minute walking'
  return 'Easy continuous run'
}

function cardio(input: PlanInput): Draft {
  const running = input.goals.includes('running')
  return {
    name: running ? 'Easy run/walk' : 'Easy cardio',
    type: 'cardio',
    optional: false,
    targets: {
      kind: 'cardio',
      durationMin: LEVEL_CONFIG[input.experienceLevel].cardioMin,
      activity: running ? runActivity(input) : 'Brisk walk, bike or any easy cardio',
      cue: 'Easy: you can hold a conversation',
    },
  }
}

function mixedDrafts(input: PlanInput, pattern: string): Draft[] {
  const strengthDays = [strength('Full body A', input, 'fullA'), strength('Full body B', input, 'fullB'), strength('Full body C', input, 'fullC')]
  return [...pattern].map((slot) => (slot === 'S' ? strengthDays.shift()! : cardio(input)))
}

function summarize(input: PlanInput, weekly: SessionTemplate[]): string {
  const core = weekly.filter((s) => s.type === 'strength' && !s.optional).length
  const optional = weekly.filter((s) => s.optional).length
  const cardioCount = weekly.filter((s) => s.type === 'cardio').length

  if (isStrengthOnly(input)) {
    const split = core <= 3 ? 'full body' : 'upper/lower split'
    const extra = optional ? `, plus ${plural(optional, 'optional day')}` : ''
    return `${plural(core, 'strength day')} a week (${split})${extra}`
  }
  const cardioLabel = input.goals.includes('running') ? plural(cardioCount, 'easy run/walk', 'easy run/walks') : plural(cardioCount, 'easy cardio day')
  return `${plural(core, 'strength day')} and ${cardioLabel} a week`
}
