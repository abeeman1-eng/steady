import { EXERCISE_LIBRARY } from '../../domain/exerciseLibrary'
import { db } from '../db'
import { LOCAL_USER_ID } from '../records'
import type { ExerciseRecord } from '../schema'

// Fixed timestamp so reseeding on every launch doesn't make built-in exercises look edited.
const SEED_TIMESTAMP = '2026-09-26T00:00:00.000Z'

/** Upsert the built-in library so new or corrected exercises reach existing installs. */
export async function ensureExerciseSeed(): Promise<void> {
  const records: ExerciseRecord[] = EXERCISE_LIBRARY.map((e) => ({
    ...e,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    userId: LOCAL_USER_ID,
  }))
  await db.exercises.bulkPut(records)
}

export const listExercises = () => db.exercises.orderBy('name').toArray()

export async function getExerciseMap(): Promise<Map<string, ExerciseRecord>> {
  const all = await db.exercises.toArray()
  return new Map(all.map((e) => [e.id, e]))
}
