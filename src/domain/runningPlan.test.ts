import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, weekdayOf } from './dates'
import { generatePlan } from './planGenerator'
import { MAX_WEEKLY_INCREASE, MIN_WEEKS, RACE_DISTANCE_M, buildRunSchedule, checkRunningGoal, raceKindFor, runWalkFor, weeklyVolumes } from './runningPlan'
import type { DatedSessionTemplate, ExperienceLevel, RunTarget } from './types'

const TODAY = '2026-10-19' // a Monday
const LEVELS: ExperienceLevel[] = ['new', 'returning', 'some', 'experienced', 'advanced']
const goal = (label: '5K' | '10K' | 'Half marathon' | 'Marathon', weeks: number) => ({ label, distanceM: RACE_DISTANCE_M[label], date: addDays(TODAY, weeks * 7 + 5) })
const run = (s: DatedSessionTemplate) => s.targets as RunTarget

describe('unrealistic-goal check', () => {
  it.each([
    ['5K', 8, 4],
    ['10K', 10, 6],
    ['Half marathon', 14, 10],
    ['Marathon', 20, 16],
  ] as const)('%s needs %i weeks for new runners and %i with experience', (label, newWeeks, expWeeks) => {
    expect(MIN_WEEKS[label]).toEqual({ newRunner: newWeeks, experienced: expWeeks })
    const at = (weeks: number) => ({ label, distanceM: RACE_DISTANCE_M[label], date: addDays(TODAY, weeks * 7) })
    expect(checkRunningGoal(at(newWeeks), 'new', TODAY).realistic).toBe(true)
    expect(checkRunningGoal(at(newWeeks - 1), 'new', TODAY).realistic).toBe(false)
    expect(checkRunningGoal(at(expWeeks), 'some', TODAY).realistic).toBe(true)
    expect(checkRunningGoal(at(expWeeks - 1), 'experienced', TODAY).realistic).toBe(false)
  })

  it('flags a 10K six weeks out for a new runner, explains why and offers a date', () => {
    const check = checkRunningGoal({ label: '10K', distanceM: 10000, date: addDays(TODAY, 42) }, 'new', TODAY)
    expect(check).toMatchObject({ realistic: false, weeksAvailable: 6, minWeeks: 10, suggestedDate: addDays(TODAY, 70) })
    expect(check.reason).toMatch(/10 weeks/)
    expect(check.reason).toMatch(/6 weeks away/)
    expect(check.reason).toMatch(/10%/)
  })

  it('treats returning exercisers as new runners and plans custom distances like the next race up', () => {
    expect(checkRunningGoal(goal('5K', 5), 'returning', TODAY).minWeeks).toBe(8)
    expect(raceKindFor(7000)).toBe('10K')
    expect(raceKindFor(15000)).toBe('Half marathon')
    expect(raceKindFor(50000)).toBe('Marathon')
    const custom = checkRunningGoal({ label: 'Custom', distanceM: 7000, date: addDays(TODAY, 14) }, 'some', TODAY)
    expect(custom.minWeeks).toBe(6)
    expect(custom.reason).toMatch(/planned like a 10K/)
  })
})

describe('weekly distance', () => {
  it.each(LEVELS.flatMap((level) => (['5K', '10K', 'Half marathon', 'Marathon'] as const).map((kind) => [kind, level] as const)))(
    '%s, %s: never more than 10%% above the biggest week so far, peaks 3 weeks out, then tapers',
    (kind, level) => {
      for (const weekCount of [3, 6, 12, 20, 30]) {
        const v = weeklyVolumes(kind, level, 4, weekCount)
        expect(v).toHaveLength(weekCount)
        for (let i = 1; i < v.length; i++) expect(v[i].km).toBeLessThanOrEqual(Math.max(...v.slice(0, i).map((w) => w.km)) * (1 + MAX_WEEKLY_INCREASE) + 1e-9)
        expect(v[v.length - 1].phase).toBe('race')
        if (weekCount >= 4) {
          const peakIdx = v.findIndex((w) => w.phase === 'peak')
          expect(peakIdx).toBe(weekCount - 4)
          expect(v.slice(peakIdx + 1).every((w) => w.km < v[peakIdx].km)).toBe(true)
          expect(Math.max(...v.map((w) => w.km))).toBe(v[peakIdx].km)
        }
      }
    },
  )

  it('adds an easier recovery week after every 3 weeks of building', () => {
    const v = weeklyVolumes('Marathon', 'some', 5, 24)
    const phases = v.map((w) => w.phase)
    let run = 0
    for (const p of phases) {
      if (p === 'build') run++
      else run = 0
      expect(run).toBeLessThanOrEqual(3)
    }
    expect(phases.filter((p) => p === 'recovery').length).toBeGreaterThanOrEqual(3)
  })

  it('holds a steady base when there is more time than needed', () => {
    const v = weeklyVolumes('5K', 'some', 3, 30)
    expect(v[0].phase).toBe('base')
    expect(v[1].km).toBe(v[0].km)
  })

  it('peaks lower instead of building faster when the date is too soon', () => {
    const plenty = buildRunSchedule({ goal: goal('10K', 12), level: 'new', runDays: 3, startDate: TODAY })
    const rushed = buildRunSchedule({ goal: goal('10K', 5), level: 'new', runDays: 3, startDate: TODAY })
    expect(plenty.compressed).toBe(false)
    expect(rushed.compressed).toBe(true)
    expect(rushed.peakWeekKm).toBeLessThan(plenty.peakWeekKm)
  })
})

describe('running sessions', () => {
  it('ends with the race on the goal date and rests the day before', () => {
    const g = goal('Half marathon', 14)
    const { sessions } = buildRunSchedule({ goal: g, level: 'some', runDays: 4, startDate: TODAY })
    const last = sessions[sessions.length - 1]
    expect(last.date).toBe(g.date)
    expect(run(last)).toMatchObject({ runType: 'race', distanceM: 21097.5 })
    expect(last.name).toBe('Race day: Half marathon')
    expect(sessions.some((s) => s.date === addDays(g.date, -1))).toBe(false)
    expect(sessions.every((s) => s.date >= TODAY && s.date <= g.date)).toBe(true)
  })

  it('starts new runners on run/walk intervals and moves to continuous running', () => {
    expect(runWalkFor('new', 0)).toBe('1 minute running, 2 minutes walking')
    expect(runWalkFor('new', 6)).toBeNull()
    expect(runWalkFor('returning', 0)).toBe('3 minutes running, 1 minute walking')
    expect(runWalkFor('some', 0)).toBeNull()
    const { sessions } = buildRunSchedule({ goal: goal('5K', 10), level: 'new', runDays: 3, startDate: TODAY })
    const first = run(sessions[0])
    expect(first.runType).toBe('runWalk')
    expect(first.detail).toBe('Alternate 1 minute running, 2 minutes walking')
    expect(first.durationMin).toBeGreaterThanOrEqual(15)
    expect(sessions.slice(-4, -1).every((s) => run(s).distanceM && !run(s).detail.startsWith('Alternate'))).toBe(true)
  })

  it('gives intervals only to experienced runners', () => {
    const types = (level: ExperienceLevel) => new Set(buildRunSchedule({ goal: goal('10K', 12), level, runDays: 4, startDate: TODAY }).sessions.map((s) => run(s).runType))
    for (const level of ['new', 'returning', 'some'] as const) expect(types(level).has('intervals')).toBe(false)
    for (const level of ['experienced', 'advanced'] as const) expect(types(level).has('intervals')).toBe(true)
  })

  it('never puts two hard sessions on back-to-back days', () => {
    for (const level of LEVELS)
      for (const runDays of [2, 3, 4, 5, 6]) {
        const hard = buildRunSchedule({ goal: goal('Marathon', 20), level, runDays, startDate: TODAY })
          .sessions.filter((s) => ['long', 'intervals', 'race'].includes(run(s).runType))
          .map((s) => s.date)
        for (let i = 1; i < hard.length; i++) expect(daysBetween(hard[i - 1], hard[i])).toBeGreaterThan(1)
      }
  })

  it('has a target and a plain-language effort cue for every session, and one long run a week', () => {
    const { sessions, weeks } = buildRunSchedule({ goal: goal('10K', 10), level: 'some', runDays: 3, startDate: TODAY })
    for (const s of sessions) {
      const t = run(s)
      expect(t.distanceM ?? t.durationMin).toBeGreaterThan(0)
      expect(t.cue.length).toBeGreaterThan(5)
    }
    const longRuns = sessions.filter((s) => run(s).runType === 'long')
    expect(longRuns.length).toBe(weeks.length - 1)
    expect(longRuns.every((s) => weekdayOf(s.date) === 6)).toBe(true)
  })

  it('keeps every planned run day within the requested days per week', () => {
    const { sessions } = buildRunSchedule({ goal: goal('Half marathon', 16), level: 'experienced', runDays: 3, startDate: TODAY })
    const perWeek = new Map<string, number>()
    for (const s of sessions) {
      const key = addDays(s.date, -((weekdayOf(s.date) + 6) % 7))
      perWeek.set(key, (perWeek.get(key) ?? 0) + 1)
    }
    expect(Math.max(...perWeek.values())).toBeLessThanOrEqual(3)
  })
})

describe('generatePlan with a running goal', () => {
  const base = { experienceLevel: 'some' as const, equipment: ['bodyweight' as const], startDate: TODAY }

  it('builds a dated running plan when there is a goal', () => {
    const plan = generatePlan({ ...base, goals: ['running'], daysPerWeek: 4, runningGoal: goal('10K', 10) })
    expect(plan.type).toBe('running')
    expect(plan.weekly).toEqual([])
    expect(plan.sessions!.every((s) => s.type === 'running')).toBe(true)
    expect(plan.goalDate).toBe(goal('10K', 10).date)
    expect(plan.flaggedUnrealistic).toBe(false)
    expect(plan.summary).toMatch(/^4 runs a week, building over \d+ weeks to your 10K$/)
  })

  it('adds strength days on non-run days when there are other goals, with none just before the race', () => {
    const g = goal('10K', 10)
    const plan = generatePlan({ ...base, goals: ['running', 'strength'], daysPerWeek: 4, runningGoal: g })
    const strength = plan.sessions!.filter((s) => s.type === 'strength')
    const runs = plan.sessions!.filter((s) => s.type === 'running')
    expect(new Set(runs.map((s) => weekdayOf(s.date))).size).toBe(3)
    expect(new Set(strength.map((s) => weekdayOf(s.date)))).toEqual(new Set([1]))
    expect(strength.every((s) => daysBetween(s.date, g.date) >= 3)).toBe(true)
    const dates = plan.sessions!.map((s) => s.date)
    expect(new Set(dates).size).toBe(dates.length)
    expect(plan.summary).toMatch(/3 runs a week and 1 strength day/)
  })

  it('flags the plan when the user continued with a date that is too soon', () => {
    const plan = generatePlan({ ...base, experienceLevel: 'new', goals: ['running'], daysPerWeek: 3, runningGoal: { label: '10K', distanceM: 10000, date: addDays(TODAY, 42) } })
    expect(plan.flaggedUnrealistic).toBe(true)
    expect(plan.sessions![plan.sessions!.length - 1].date).toBe(addDays(TODAY, 42))
  })

  it('falls back to easy run/walk days when there is no goal date', () => {
    expect(generatePlan({ ...base, goals: ['running'], daysPerWeek: 3 }).type).toBe('mixed')
  })
})
