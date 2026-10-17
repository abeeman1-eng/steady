import { describe, expect, it } from 'vitest'
import { completionRate, consistencyDays, strengthSeries, weeklyRunStats } from './progress'

describe('strengthSeries', () => {
  it('gives each finished workout its best estimated 1RM, top set and rating, oldest first', () => {
    const workouts = [
      { id: 'b', date: '2026-10-08', status: 'completed', difficulty: 7 },
      { id: 'a', date: '2026-10-01', status: 'completed' },
      { id: 'c', date: '2026-10-09', status: 'inProgress' },
    ]
    const sets = [
      { workoutId: 'a', weightKg: 60, reps: 10, completed: true },
      { workoutId: 'a', weightKg: 70, reps: 5, completed: true },
      { workoutId: 'a', weightKg: 90, reps: 5, completed: false },
      { workoutId: 'b', weightKg: 75, reps: 12, completed: true },
      { workoutId: 'c', weightKg: 100, reps: 5, completed: true },
    ]
    const series = strengthSeries(sets, workouts)
    expect(series.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-08'])
    expect(series[0].est1RMKg).toBeCloseTo(81.67, 1) // 70 × (1 + 5/30) beats 60 × (1 + 10/30)
    expect(series[0].topSetKg).toBe(70)
    expect(series[1]).toEqual({ date: '2026-10-08', est1RMKg: null, topSetKg: 75, difficulty: 7 }) // 12 reps: no estimate
  })
})

describe('weeklyRunStats', () => {
  const runs = [
    { date: '2026-10-13', distanceM: 5000, durationSec: 1800, runType: 'easy' as const },
    { date: '2026-10-15', distanceM: 3000, durationSec: 840, runType: 'intervals' as const },
    { date: '2026-10-17', distanceM: 10000, durationSec: 3900, runType: 'long' as const },
    { date: '2026-09-30', distanceM: 4000, durationSec: 1600, runType: 'easy' as const },
  ]

  it('totals each week, including empty weeks, ending with the current week', () => {
    const stats = weeklyRunStats(runs, '2026-10-17', 4)
    expect(stats.map((s) => s.weekStart)).toEqual(['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'])
    expect(stats.map((s) => s.distanceM)).toEqual([0, 4000, 0, 18000])
    expect(stats[2].easyPaceSecPerKm).toBeUndefined()
  })

  it('averages easy-run pace by distance and leaves intervals out', () => {
    const week = weeklyRunStats(runs, '2026-10-17', 1)[0]
    expect(week.runs).toBe(3)
    expect(week.easyPaceSecPerKm).toBeCloseTo((1800 + 3900) / 15, 5)
  })
})

describe('consistencyDays', () => {
  it('marks done, missed, planned and rest days, ignoring optional sessions', () => {
    const planned = [
      { date: '2026-10-12', status: 'missed' as const, optional: false },
      { date: '2026-10-13', status: 'done' as const, optional: false },
      { date: '2026-10-14', status: 'missed' as const, optional: true },
      { date: '2026-10-16', status: 'planned' as const, optional: false },
    ]
    const workouts = [
      { date: '2026-10-13', status: 'completed' },
      { date: '2026-10-15', status: 'completed' },
    ]
    const days = consistencyDays(planned, workouts, '2026-10-12', '2026-10-17')
    expect(days.map((d) => d.state)).toEqual(['missed', 'done', 'rest', 'done', 'planned', 'rest'])
    // Two planned days: one done, one missed. The unplanned workout on the 15th doesn't count.
    expect(completionRate(days)).toBeCloseTo(1 / 2)
    expect(completionRate(days.filter((d) => d.state === 'rest'))).toBeUndefined()
  })
})
