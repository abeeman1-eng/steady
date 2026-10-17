import { db } from '../db'
import type { BodyMetricRecord, RunRecord } from '../schema'

/** Exercises with at least one finished, weighted set, most-logged first. */
export async function exercisesWithHistory(): Promise<string[]> {
  const completed = new Set((await db.workouts.where('status').equals('completed').primaryKeys()) as string[])
  const counts = new Map<string, Set<string>>()
  await db.sets.each((s) => {
    if (s.completed && (s.weightKg ?? 0) > 0 && completed.has(s.workoutId)) counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? new Set()).add(s.workoutId))
  })
  return [...counts.entries()].sort((a, b) => b[1].size - a[1].size).map(([id]) => id)
}

/** Every set of one exercise plus the workouts they belong to (for strengthSeries). */
export async function strengthRows(exerciseId: string) {
  const sets = await db.sets.where('exerciseId').equals(exerciseId).toArray()
  const workouts = (await db.workouts.bulkGet([...new Set(sets.map((s) => s.workoutId))])).filter((w) => !!w)
  return { sets, workouts }
}

export const listAllRuns = (): Promise<RunRecord[]> => db.runs.toArray()

export const listBodyWeights = (): Promise<BodyMetricRecord[]> => db.bodyMetrics.orderBy('date').toArray()
