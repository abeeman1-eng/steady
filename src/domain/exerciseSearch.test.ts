import { describe, expect, it } from 'vitest'
import { EXERCISE_LIBRARY } from './exerciseLibrary'
import { MUSCLE_LABELS, searchExercises } from './exerciseSearch'

const ids = (q: string) => searchExercises(q, EXERCISE_LIBRARY).map((e) => e.id)

describe('exercise guides', () => {
  it.each(EXERCISE_LIBRARY.map((e) => [e.id, e] as const))('%s has 4–6 clear steps and labeled muscles', (_id, e) => {
    expect(e.steps.length).toBeGreaterThanOrEqual(4)
    expect(e.steps.length).toBeLessThanOrEqual(6)
    for (const step of e.steps) expect(step).toMatch(/^[A-Z].{15,}[.!]$/)
    for (const m of e.muscleGroups) expect(MUSCLE_LABELS[m]).toBeDefined()
  })
})

describe('searchExercises', () => {
  it('finds an exact name first', () => {
    expect(ids('Goblet squat')[0]).toBe('goblet-squat')
  })

  it('ignores case, hyphens, spacing and plurals', () => {
    expect(ids('pushups')).toContain('push-up')
    expect(ids('push ups')).toContain('push-up')
    expect(ids('PUSH-UP')[0]).toBe('push-up')
    expect(ids('squats')).toContain('bodyweight-squat')
  })

  it('understands common shorthand', () => {
    expect(ids('rdl').sort()).toEqual(['dumbbell-romanian-deadlift', 'romanian-deadlift'])
    expect(ids('ohp')).toContain('barbell-overhead-press')
    expect(ids('bench')).toContain('barbell-bench-press')
    expect(ids('bicep curls')).toEqual(expect.arrayContaining(['dumbbell-curl', 'band-curl']))
  })

  it('matches partial words', () => {
    expect(ids('lat pull')).toContain('lat-pulldown')
    expect(ids('romanian')).toHaveLength(2)
  })

  it('searches by muscle, main focus first', () => {
    const glutes = ids('glutes')
    expect(glutes[0]).toBe('glute-bridge')
    expect(glutes).toContain('barbell-back-squat')
    expect(ids('abs')).toEqual(expect.arrayContaining(['plank', 'dead-bug']))
    expect(ids('hamstrings')).toContain('romanian-deadlift')
  })

  it('returns nothing for empty or unknown queries', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
    expect(ids('zercher')).toEqual([])
  })
})
