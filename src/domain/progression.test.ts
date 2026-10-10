import { describe, expect, it } from 'vitest'
import { type SessionPerformance, suggestProgression } from './progression'
import { lbToKg } from './units'

const squat = { pattern: 'squat' as const, isBodyweight: false }
const press = { pattern: 'verticalPush' as const, isBodyweight: false }
const pushUp = { pattern: 'horizontalPush' as const, isBodyweight: true }
const plank = { pattern: 'core' as const, isBodyweight: true, timed: true }

const session = (weightLb: number, reps: number[], difficulty?: number, range: [number, number] = [8, 12]): SessionPerformance => ({
  difficulty,
  repMin: range[0],
  repMax: range[1],
  sets: reps.map((r) => ({ weightKg: lbToKg(weightLb), reps: r, completed: true })),
})

const lb = (kg: number) => Math.round((kg / 0.45359237) * 10) / 10

describe('suggestProgression: the 1–10 rating changes the next workout', () => {
  it('adds 10 lb to a lower-body lift after a top-of-range session rated 8 or lower', () => {
    const s = suggestProgression([session(50, [12, 12, 12], 6)], squat, 'imperial')!
    expect(s.kind).toBe('increaseWeight')
    expect(s.kind === 'increaseWeight' && lb(s.toKg)).toBe(60)
    expect(s.reason).toContain('rated it 6/10')
  })

  it('adds 5 lb to an upper-body lift, and 2.5 kg in metric', () => {
    const imperial = suggestProgression([session(30, [12, 12, 12], 7)], press, 'imperial')!
    expect(imperial.kind === 'increaseWeight' && lb(imperial.toKg)).toBe(35)
    const metric = suggestProgression([{ ...session(0, [12, 12, 12], 7), sets: [12, 12, 12].map((r) => ({ weightKg: 20, reps: r, completed: true })) }], press, 'metric')!
    expect(metric.kind === 'increaseWeight' && metric.toKg).toBe(22.5)
  })

  it('holds instead of increasing when the same session was rated 9 or 10', () => {
    for (const rating of [9, 10]) {
      const s = suggestProgression([session(50, [12, 12, 12], rating)], squat, 'imperial')!
      expect(s.kind).toBe('hold')
      expect(s.reason).toContain(`${rating}/10`)
    }
  })

  it('still increases when the session wasn’t rated', () => {
    expect(suggestProgression([session(50, [12, 12, 12])], squat, 'imperial')?.kind).toBe('increaseWeight')
  })

  it('adds 2 reps for bodyweight moves and 5 seconds for holds', () => {
    const p = suggestProgression([session(0, [12, 12, 12], 5)], pushUp, 'imperial')!
    expect(p).toMatchObject({ kind: 'increaseReps', fromReps: 12, toReps: 14 })
    const h = suggestProgression([session(0, [40, 40, 40], 5, [20, 40])], plank, 'imperial')!
    expect(h).toMatchObject({ kind: 'increaseReps', fromReps: 40, toReps: 45 })
  })

  it('offers a 10% drop after missing reps two sessions in a row', () => {
    const s = suggestProgression([session(100, [8, 7, 6], 9), session(100, [9, 7, 7], 8)], squat, 'imperial')!
    expect(s.kind).toBe('reduceWeight')
    expect(s.kind === 'reduceWeight' && lb(s.toKg)).toBe(90)
  })

  it('makes no suggestion for a single miss, a mid-range session, or no rep range', () => {
    expect(suggestProgression([session(100, [8, 7, 6]), session(100, [12, 12, 12])], squat, 'imperial')).toBeNull()
    expect(suggestProgression([session(100, [10, 10, 9], 6)], squat, 'imperial')).toBeNull()
    expect(suggestProgression([{ sets: [{ weightKg: 20, reps: 12, completed: true }] }], squat, 'imperial')).toBeNull()
    expect(suggestProgression([], squat, 'imperial')).toBeNull()
  })

  it('needs every planned set done to count as hitting the top', () => {
    const skipped: SessionPerformance = { ...session(50, [12, 12, 12], 5), sets: [...session(50, [12, 12], 5).sets, { weightKg: lbToKg(50), reps: 12, completed: false }] }
    expect(suggestProgression([skipped], squat, 'imperial')).toBeNull()
  })
})
