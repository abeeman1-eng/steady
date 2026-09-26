import { describe, expect, it } from 'vitest'
import { detectPRs, epley1RM } from './records'

describe('epley1RM', () => {
  it('applies weight × (1 + reps / 30)', () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.333, 3)
    expect(epley1RM(60, 5)).toBeCloseTo(70, 6)
    expect(epley1RM(100, 1)).toBeCloseTo(103.333, 3)
  })

  it('ignores sets over 10 reps, unloaded sets and zero reps', () => {
    expect(epley1RM(100, 11)).toBeNull()
    expect(epley1RM(0, 8)).toBeNull()
    expect(epley1RM(50, 0)).toBeNull()
  })
})

describe('detectPRs', () => {
  it('treats the first time an exercise is logged as a baseline, not a PR', () => {
    expect(detectPRs({ weightKg: 50, reps: 10 }, [])).toEqual([])
  })

  it('detects a heavier weight', () => {
    const hits = detectPRs({ weightKg: 55, reps: 5 }, [{ weightKg: 50, reps: 10 }])
    expect(hits.map((h) => h.kind)).toContain('heaviest')
    expect(hits.find((h) => h.kind === 'heaviest')?.value).toBe(55)
  })

  it('detects more reps at the same weight', () => {
    const hits = detectPRs({ weightKg: 50, reps: 11 }, [{ weightKg: 50, reps: 10 }, { weightKg: 40, reps: 12 }])
    expect(hits).toContainEqual({ kind: 'repsAtWeight', value: 11, weightKg: 50 })
    expect(hits.map((h) => h.kind)).not.toContain('heaviest')
  })

  it('does not award reps-at-weight at a weight never lifted before', () => {
    const hits = detectPRs({ weightKg: 45, reps: 12 }, [{ weightKg: 50, reps: 10 }])
    expect(hits.map((h) => h.kind)).not.toContain('repsAtWeight')
  })

  it('detects a higher estimated 1RM from a lighter, higher-rep set', () => {
    // 50 × (1 + 10/30) = 66.7 beats 60 × (1 + 1/30) = 62
    const hits = detectPRs({ weightKg: 50, reps: 10 }, [{ weightKg: 60, reps: 1 }])
    expect(hits.map((h) => h.kind)).toEqual(['est1RM'])
  })

  it('ignores sets over 10 reps when comparing 1RM', () => {
    const hits = detectPRs({ weightKg: 40, reps: 8 }, [{ weightKg: 40, reps: 20 }, { weightKg: 40, reps: 6 }])
    expect(hits.map((h) => h.kind)).toContain('est1RM')
  })

  it('returns nothing for an equal or worse set', () => {
    expect(detectPRs({ weightKg: 50, reps: 10 }, [{ weightKg: 50, reps: 10 }])).toEqual([])
    expect(detectPRs({ weightKg: 45, reps: 8 }, [{ weightKg: 50, reps: 10 }])).toEqual([])
  })

  it('tracks most reps for bodyweight moves', () => {
    const hits = detectPRs({ weightKg: 0, reps: 15 }, [{ weightKg: 0, reps: 12 }])
    expect(hits).toEqual([{ kind: 'repsAtWeight', value: 15, weightKg: 0 }])
  })

  it('tracks longest hold for timed moves and never estimates a 1RM', () => {
    const hits = detectPRs({ weightKg: 0, reps: 45 }, [{ weightKg: 0, reps: 30 }], { timed: true })
    expect(hits).toEqual([{ kind: 'repsAtWeight', value: 45, weightKg: 0 }])
  })

  it('ignores previous sets with zero reps', () => {
    expect(detectPRs({ weightKg: 50, reps: 5 }, [{ weightKg: 80, reps: 0 }])).toEqual([])
  })
})
