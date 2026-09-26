import { describe, expect, it } from 'vitest'
import { EXERCISES_BY_ID, EXERCISE_LIBRARY, expandEquipment, isAvailable } from '../exerciseLibrary'
import type { Equipment, ExperienceLevel, MainGoal, PlanInput } from '../types'
import { WEEKDAY_SLOTS, generatePlan } from './index'

const base: PlanInput = { experienceLevel: 'new', goals: ['strength'], daysPerWeek: 3, equipment: ['gym'] }

const strengthExerciseIds = (input: PlanInput) =>
  generatePlan(input).weekly.flatMap((s) => (s.targets.kind === 'strength' ? s.targets.exercises.map((e) => e.exerciseId) : []))

describe('exercise library', () => {
  it('has about 40 exercises with unique ids', () => {
    expect(EXERCISE_LIBRARY.length).toBeGreaterThanOrEqual(38)
    expect(new Set(EXERCISE_LIBRARY.map((e) => e.id)).size).toBe(EXERCISE_LIBRARY.length)
  })

  it.each(EXERCISE_LIBRARY.map((e) => [e.id, e] as const))('%s is complete and has a bodyweight or dumbbell substitute', (_id, e) => {
    expect(e.description.length).toBeGreaterThan(10)
    expect(e.formCues.length).toBeGreaterThanOrEqual(2)
    expect(e.formCues.length).toBeLessThanOrEqual(3)
    expect(e.muscleGroups.length).toBeGreaterThan(0)
    for (const id of e.substituteIds) expect(EXERCISES_BY_ID.has(id)).toBe(true)
    const homeFriendly = e.substituteIds.some((id) => {
      const eq = EXERCISES_BY_ID.get(id)!.equipment
      return eq.includes('bodyweight') || eq.includes('dumbbells')
    })
    expect(homeFriendly).toBe(true)
  })
})

describe('generatePlan: split by days per week', () => {
  it.each([
    [2, ['Full body A', 'Full body B']],
    [3, ['Full body A', 'Full body B', 'Full body C']],
    [4, ['Upper A', 'Lower A', 'Upper B', 'Lower B']],
    [5, ['Upper A', 'Lower A', 'Core & arms (optional)', 'Upper B', 'Lower B']],
    [6, ['Upper A', 'Lower A', 'Core & arms (optional)', 'Upper B', 'Lower B', 'Full body light (optional)']],
  ])('%i days → %j', (days, names) => {
    const plan = generatePlan({ ...base, daysPerWeek: days })
    expect(plan.weekly.map((s) => s.name)).toEqual(names)
    expect(plan.weekly.map((s) => s.weekday)).toEqual(WEEKDAY_SLOTS[days])
  })

  it('marks only the extra 5–6 day sessions optional', () => {
    const plan = generatePlan({ ...base, daysPerWeek: 6 })
    expect(plan.weekly.filter((s) => s.optional).map((s) => s.weekday)).toEqual([3, 6])
    expect(plan.summary).toBe('4 strength days a week (upper/lower split), plus 2 optional days')
  })

  it('clamps days outside 2–6', () => {
    expect(generatePlan({ ...base, daysPerWeek: 9 }).weekly).toHaveLength(6)
    expect(generatePlan({ ...base, daysPerWeek: 1 }).weekly).toHaveLength(2)
  })
})

describe('generatePlan: equipment', () => {
  const combos: Equipment[][] = [['gym'], ['dumbbells'], ['bands'], ['bodyweight'], ['dumbbells', 'bands']]
  it.each(combos)('only uses exercises supported by %j', (...equipment) => {
    const available = expandEquipment(equipment)
    for (const days of [2, 3, 4, 5, 6]) {
      for (const id of strengthExerciseIds({ ...base, equipment, daysPerWeek: days })) {
        expect(isAvailable(EXERCISES_BY_ID.get(id)!, available)).toBe(true)
      }
    }
  })

  it('never repeats an exercise within a session', () => {
    for (const equipment of combos) {
      for (const s of generatePlan({ ...base, equipment, daysPerWeek: 4 }).weekly) {
        if (s.targets.kind !== 'strength') continue
        const ids = s.targets.exercises.map((e) => e.exerciseId)
        expect(new Set(ids).size).toBe(ids.length)
      }
    }
  })

  it('bodyweight-only users still get a full session', () => {
    const plan = generatePlan({ ...base, equipment: ['bodyweight'] })
    for (const s of plan.weekly) {
      expect(s.targets.kind === 'strength' && s.targets.exercises.length).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('generatePlan: experience level', () => {
  it('beginners get 3 × 8–12 on 4–6 exercises', () => {
    for (const level of ['new', 'some'] as ExperienceLevel[]) {
      for (const s of generatePlan({ ...base, experienceLevel: level, daysPerWeek: 4 }).weekly) {
        if (s.targets.kind !== 'strength') continue
        expect(s.targets.exercises.length).toBeGreaterThanOrEqual(4)
        expect(s.targets.exercises.length).toBeLessThanOrEqual(6)
        for (const t of s.targets.exercises) {
          if (EXERCISES_BY_ID.get(t.exerciseId)!.timed) continue
          expect(t).toMatchObject({ sets: 3, repMin: 8, repMax: 12 })
        }
      }
    }
  })

  it('new lifters are not given the most technical barbell lifts', () => {
    const ids = strengthExerciseIds({ ...base, experienceLevel: 'new', daysPerWeek: 4 })
    for (const id of ids) expect(EXERCISES_BY_ID.get(id)!.difficulty).toBeLessThan(3)
  })

  it('experienced lifters get heavier compound work', () => {
    const plan = generatePlan({ ...base, experienceLevel: 'experienced', daysPerWeek: 4 })
    const upper = plan.weekly[0]
    expect(upper.targets.kind === 'strength' && upper.targets.exercises[0]).toMatchObject({ exerciseId: 'barbell-bench-press', sets: 4, repMin: 6, repMax: 10 })
  })

  it('timed holds get second-based targets', () => {
    const plan = generatePlan({ ...base, equipment: ['bodyweight'] })
    const plank = plan.weekly.flatMap((s) => (s.targets.kind === 'strength' ? s.targets.exercises : [])).find((e) => e.exerciseId === 'plank')
    expect(plank).toMatchObject({ repMin: 20, repMax: 40 })
  })
})

describe('generatePlan: mixed goals', () => {
  it.each(['weightLoss', 'general', 'running'] as MainGoal[])('%s mixes strength with easy cardio', (goal) => {
    const plan = generatePlan({ ...base, goals: [goal], daysPerWeek: 5 })
    expect(plan.type).toBe('mixed')
    expect(plan.weekly.map((s) => s.type)).toEqual(['strength', 'cardio', 'strength', 'cardio', 'strength'])
  })

  it('writes a plain-language summary', () => {
    expect(generatePlan({ ...base, goals: ['weightLoss'], daysPerWeek: 3 }).summary).toBe('2 strength days and 1 easy cardio day a week')
    expect(generatePlan({ ...base, goals: ['running'], daysPerWeek: 4 }).summary).toBe('2 strength days and 2 easy run/walks a week')
    expect(generatePlan({ ...base, daysPerWeek: 3 }).summary).toBe('3 strength days a week (full body)')
  })

  it('gives new runners run/walk intervals', () => {
    const plan = generatePlan({ ...base, goals: ['running'], daysPerWeek: 3 })
    const run = plan.weekly.find((s) => s.type === 'cardio')!
    expect(run.targets.kind === 'cardio' && run.targets.activity).toMatch(/1 minute running/)
  })
})

describe('generatePlan: more experience levels', () => {
  it('returning lifters get beginner-friendly exercises and volume', () => {
    const plan = generatePlan({ ...base, experienceLevel: 'returning', daysPerWeek: 4 })
    for (const s of plan.weekly) {
      if (s.targets.kind !== 'strength') continue
      expect(s.targets.exercises).toHaveLength(5)
      for (const t of s.targets.exercises) {
        expect(EXERCISES_BY_ID.get(t.exerciseId)!.difficulty).toBeLessThan(3)
        if (!EXERCISES_BY_ID.get(t.exerciseId)!.timed) expect(t).toMatchObject({ sets: 3, repMin: 8, repMax: 12 })
      }
    }
  })

  it('very experienced lifters get lower-rep, heavier compound work', () => {
    const plan = generatePlan({ ...base, experienceLevel: 'advanced', daysPerWeek: 4 })
    const upper = plan.weekly[0]
    expect(upper.targets.kind === 'strength' && upper.targets.exercises[0]).toMatchObject({ exerciseId: 'barbell-bench-press', sets: 4, repMin: 5, repMax: 8 })
  })

  it('returning runners get longer run intervals than new runners', () => {
    const run = (level: ExperienceLevel) =>
      generatePlan({ ...base, experienceLevel: level, goals: ['running'] }).weekly.find((s) => s.type === 'cardio')!.targets
    expect(run('new')).toMatchObject({ durationMin: 20, activity: expect.stringMatching(/1 minute running/) })
    expect(run('returning')).toMatchObject({ durationMin: 20, activity: expect.stringMatching(/3 minutes running/) })
    expect(run('advanced')).toMatchObject({ durationMin: 35, activity: 'Easy continuous run' })
  })
})

describe('generatePlan: multiple goals', () => {
  it('strength plus another goal leans toward strength at 4 days, spaced out', () => {
    const plan = generatePlan({ ...base, goals: ['strength', 'weightLoss'], daysPerWeek: 4 })
    expect(plan.type).toBe('mixed')
    expect(plan.weekly.map((s) => [s.weekday, s.type])).toEqual([
      [1, 'strength'],
      [3, 'strength'],
      [5, 'strength'],
      [6, 'cardio'],
    ])
    expect(plan.summary).toBe('3 strength days and 1 easy cardio day a week')
  })

  it('any goal that includes running makes the cardio days run/walks', () => {
    const plan = generatePlan({ ...base, goals: ['weightLoss', 'running'], daysPerWeek: 4 })
    expect(plan.weekly.filter((s) => s.type === 'cardio').map((s) => s.name)).toEqual(['Easy run/walk', 'Easy run/walk'])
    expect(plan.summary).toBe('2 strength days and 2 easy run/walks a week')
  })

  it('strength and running together', () => {
    const plan = generatePlan({ ...base, goals: ['strength', 'running'], daysPerWeek: 5 })
    expect(plan.weekly.map((s) => s.type)).toEqual(['strength', 'cardio', 'strength', 'cardio', 'strength'])
    expect(plan.summary).toBe('3 strength days and 2 easy run/walks a week')
  })

  it('only "build strength" on its own gives a pure strength plan', () => {
    expect(generatePlan({ ...base, goals: ['strength'] }).type).toBe('strength')
    expect(generatePlan({ ...base, goals: ['strength', 'general'] }).type).toBe('mixed')
  })

  it('every combination of goals, levels and days produces a valid plan', () => {
    const goals: MainGoal[] = ['strength', 'running', 'weightLoss', 'general']
    const levels: ExperienceLevel[] = ['new', 'returning', 'some', 'experienced', 'advanced']
    for (let mask = 1; mask < 16; mask++) {
      const chosen = goals.filter((_, i) => mask & (1 << i))
      for (const level of levels) {
        for (const days of [2, 3, 4, 5, 6]) {
          const plan = generatePlan({ ...base, goals: chosen, experienceLevel: level, daysPerWeek: days })
          expect(plan.weekly).toHaveLength(days)
          expect(new Set(plan.weekly.map((s) => s.weekday)).size).toBe(days)
          expect(plan.summary).not.toMatch(/undefined|NaN/)
        }
      }
    }
  })
})
