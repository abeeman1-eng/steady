import { addDays, startOfWeek } from './dates'
import { epley1RM } from './records'
import type { RunType } from './types'

/** Chart data for the Progress screen. Inputs are plain rows, so this stays pure and testable. */

export interface StrengthPoint {
  date: string
  /** Best Epley estimate from that workout's sets of 10 reps or fewer (kg); null if none qualify. */
  est1RMKg: number | null
  /** Heaviest completed set (kg). */
  topSetKg: number
  /** The workout's 1–10 rating, if given. */
  difficulty?: number
}

interface SetRow {
  workoutId: string
  weightKg: number | null
  reps: number
  completed: boolean
}
interface WorkoutRow {
  id: string
  date: string
  status: string
  difficulty?: number
}

/** One point per finished workout that included the exercise, oldest first. */
export function strengthSeries(sets: SetRow[], workouts: WorkoutRow[]): StrengthPoint[] {
  const byId = new Map(workouts.filter((w) => w.status === 'completed').map((w) => [w.id, w]))
  const groups = new Map<string, SetRow[]>()
  for (const s of sets) if (s.completed && byId.has(s.workoutId) && (s.weightKg ?? 0) > 0) groups.set(s.workoutId, [...(groups.get(s.workoutId) ?? []), s])
  return [...groups.entries()]
    .map(([id, rows]) => {
      const w = byId.get(id)!
      const estimates = rows.map((r) => epley1RM(r.weightKg ?? 0, r.reps)).filter((x): x is number => x !== null)
      return {
        date: w.date,
        est1RMKg: estimates.length ? Math.max(...estimates) : null,
        topSetKg: Math.max(...rows.map((r) => r.weightKg ?? 0)),
        difficulty: w.difficulty,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export interface RunWeekStats {
  weekStart: string
  distanceM: number
  runs: number
  /** Average pace of easy runs that week (seconds per km), weighted by distance. */
  easyPaceSecPerKm?: number
}

interface RunRow {
  date: string
  distanceM: number
  durationSec: number
  runType: RunType
}

/** Weekly running totals for the `weeks` weeks ending with the week of `today` (zeros included). */
export function weeklyRunStats(runs: RunRow[], today: string, weeks = 12): RunWeekStats[] {
  const last = startOfWeek(today)
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(last, -7 * (weeks - 1 - i))
    const weekEnd = addDays(weekStart, 6)
    const inWeek = runs.filter((r) => r.date >= weekStart && r.date <= weekEnd)
    const easy = inWeek.filter((r) => (r.runType === 'easy' || r.runType === 'runWalk' || r.runType === 'long') && r.distanceM > 0 && r.durationSec > 0)
    const easyM = easy.reduce((t, r) => t + r.distanceM, 0)
    const easySec = easy.reduce((t, r) => t + r.durationSec, 0)
    return {
      weekStart,
      distanceM: inWeek.reduce((t, r) => t + r.distanceM, 0),
      runs: inWeek.length,
      easyPaceSecPerKm: easyM > 0 ? easySec / (easyM / 1000) : undefined,
    }
  })
}

export type DayState = 'done' | 'missed' | 'planned' | 'rest'

/** Each day from `from` to `to`: done (any finished workout), missed, planned (still ahead) or rest. */
export function consistencyDays(
  planned: { date: string; status: 'planned' | 'done' | 'missed'; optional: boolean }[],
  workouts: { date: string; status: string }[],
  from: string,
  to: string,
): { date: string; state: DayState; planned: boolean }[] {
  const done = new Set(workouts.filter((w) => w.status === 'completed').map((w) => w.date))
  const days: { date: string; state: DayState; planned: boolean }[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const p = planned.filter((s) => s.date === d && !s.optional)
    const state: DayState = done.has(d) ? 'done' : p.some((s) => s.status === 'missed') ? 'missed' : p.some((s) => s.status === 'planned') ? 'planned' : 'rest'
    days.push({ date: d, state, planned: p.length > 0 })
  }
  return days
}

/** Share of days with a planned (non-optional) session that were done, as 0–1; undefined if none. Unplanned workouts don't count. */
export function completionRate(days: { state: DayState; planned: boolean }[]): number | undefined {
  const done = days.filter((d) => d.planned && d.state === 'done').length
  const missed = days.filter((d) => d.planned && d.state === 'missed').length
  return done + missed ? done / (done + missed) : undefined
}
