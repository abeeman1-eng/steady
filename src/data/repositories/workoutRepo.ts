import { todayISO } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { type PRHit, detectPRs } from '../../domain/records'
import type { ExerciseTarget } from '../../domain/types'
import { db } from '../db'
import { stamp, touch } from '../records'
import type { SetRecord, WorkoutRecord } from '../schema'

const DEFAULT_SETS_FOR_ADDED_EXERCISE = 3
const DEFAULT_REPS = 10

export async function getInProgressWorkout(): Promise<WorkoutRecord | null> {
  return (await db.workouts.where('status').equals('inProgress').first()) ?? null
}

export const getWorkout = (id: string) => db.workouts.get(id)

export async function getSetsForWorkout(workoutId: string): Promise<SetRecord[]> {
  const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
  return sets.sort((a, b) => a.order - b.order || a.setNumber - b.setNumber)
}

export async function listCompletedWorkouts(): Promise<WorkoutRecord[]> {
  const all = await db.workouts.where('status').equals('completed').toArray()
  return all.sort((a, b) => b.date.localeCompare(a.date) || (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))
}

export async function listCompletedBetween(from: string, to: string): Promise<WorkoutRecord[]> {
  return db.workouts
    .where('date')
    .between(from, to, true, true)
    .filter((w) => w.status === 'completed')
    .toArray()
}

/** Completed sets from the most recent finished workout that included this exercise. */
export async function lastPerformance(exerciseId: string, excludeWorkoutId?: string): Promise<SetRecord[]> {
  const sets = await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .filter((s) => s.completed && s.workoutId !== excludeWorkoutId)
    .toArray()
  if (sets.length === 0) return []
  const workouts = await db.workouts.bulkGet([...new Set(sets.map((s) => s.workoutId))])
  const latest = workouts
    .filter((w): w is WorkoutRecord => !!w && w.status === 'completed')
    .sort((a, b) => b.date.localeCompare(a.date) || (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))[0]
  if (!latest) return []
  return sets.filter((s) => s.workoutId === latest.id).sort((a, b) => a.setNumber - b.setNumber)
}

/** Set rows for one exercise, with weight and reps prefilled from last time. */
async function buildSets(workoutId: string, order: number, target: ExerciseTarget | { exerciseId: string; sets: number; repMin?: number; repMax?: number }) {
  const previous = await lastPerformance(target.exerciseId, workoutId)
  const exercise = EXERCISES_BY_ID.get(target.exerciseId)
  const rows: SetRecord[] = []
  for (let i = 0; i < target.sets; i++) {
    const prev = previous[i] ?? previous[previous.length - 1]
    rows.push(
      stamp({
        workoutId,
        exerciseId: target.exerciseId,
        order,
        setNumber: i + 1,
        weightKg: prev ? prev.weightKg : exercise?.isBodyweight ? 0 : null,
        reps: prev?.reps ?? target.repMin ?? DEFAULT_REPS,
        repMin: target.repMin,
        repMax: target.repMax,
        completed: false,
        isPR: false,
      }),
    )
  }
  return rows
}

/** Start (or resume) the workout for a planned session. Returns the workout id. */
export async function startPlannedWorkout(plannedSessionId: string): Promise<string> {
  const session = await db.plannedSessions.get(plannedSessionId)
  if (!session) throw new Error('That planned session no longer exists.')
  const existing = await db.workouts.where('plannedSessionId').equals(plannedSessionId).filter((w) => w.status === 'inProgress').first()
  if (existing) return existing.id

  const workout: WorkoutRecord = stamp({
    plannedSessionId,
    date: todayISO(),
    name: session.name,
    type: session.type,
    status: 'inProgress' as const,
    startedAt: new Date().toISOString(),
    source: 'manual' as const,
    ...(session.targets.kind === 'cardio'
      ? { cardioTarget: { durationMin: session.targets.durationMin, activity: session.targets.activity, cue: session.targets.cue } }
      : {}),
  })
  const sets: SetRecord[] = []
  if (session.targets.kind === 'strength') {
    for (const [order, target] of session.targets.exercises.entries()) sets.push(...(await buildSets(workout.id, order, target)))
  }
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.workouts.add(workout)
    await db.sets.bulkAdd(sets)
  })
  return workout.id
}

/** Start an unplanned, free-form strength workout. */
export async function startFreeWorkout(): Promise<string> {
  const workout: WorkoutRecord = stamp({
    date: todayISO(),
    name: 'Free workout',
    type: 'strength' as const,
    status: 'inProgress' as const,
    startedAt: new Date().toISOString(),
    source: 'manual' as const,
  })
  await db.workouts.add(workout)
  return workout.id
}

async function nextOrder(workoutId: string): Promise<number> {
  const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
  return sets.length ? Math.max(...sets.map((s) => s.order)) + 1 : 0
}

export async function addExercise(workoutId: string, exerciseId: string): Promise<void> {
  const rows = await buildSets(workoutId, await nextOrder(workoutId), { exerciseId, sets: DEFAULT_SETS_FOR_ADDED_EXERCISE })
  await db.sets.bulkAdd(rows)
}

async function setsAt(workoutId: string, order: number) {
  return db.sets.where('workoutId').equals(workoutId).filter((s) => s.order === order).toArray()
}

/** Replace an exercise, keeping its planned set and rep targets. */
export async function swapExercise(workoutId: string, order: number, newExerciseId: string): Promise<void> {
  const old = await setsAt(workoutId, order)
  if (old.length === 0) return
  const rows = await buildSets(workoutId, order, { exerciseId: newExerciseId, sets: old.length, repMin: old[0].repMin, repMax: old[0].repMax })
  await db.transaction('rw', db.sets, db.personalRecords, async () => {
    await db.personalRecords.where('setId').anyOf(old.map((s) => s.id)).delete()
    await db.sets.bulkDelete(old.map((s) => s.id))
    await db.sets.bulkAdd(rows)
  })
}

export async function removeExercise(workoutId: string, order: number): Promise<void> {
  const old = await setsAt(workoutId, order)
  await db.transaction('rw', db.sets, db.personalRecords, async () => {
    await db.personalRecords.where('setId').anyOf(old.map((s) => s.id)).delete()
    await db.sets.bulkDelete(old.map((s) => s.id))
  })
}

/** Add a set to an exercise, copying the last set's weight and reps. */
export async function addSet(workoutId: string, order: number): Promise<void> {
  const existing = (await setsAt(workoutId, order)).sort((a, b) => a.setNumber - b.setNumber)
  const last = existing[existing.length - 1]
  if (!last) return
  await db.sets.add(
    stamp({
      workoutId,
      exerciseId: last.exerciseId,
      order,
      setNumber: last.setNumber + 1,
      weightKg: last.weightKg,
      reps: last.reps,
      repMin: last.repMin,
      repMax: last.repMax,
      completed: false,
      isPR: false,
    }),
  )
}

export async function removeSet(setId: string): Promise<void> {
  const set = await db.sets.get(setId)
  if (!set) return
  await db.transaction('rw', db.sets, db.personalRecords, async () => {
    await db.personalRecords.where('setId').equals(setId).delete()
    await db.sets.delete(setId)
    const rest = (await setsAt(set.workoutId, set.order)).sort((a, b) => a.setNumber - b.setNumber)
    for (const [i, s] of rest.entries()) if (s.setNumber !== i + 1) await db.sets.update(s.id, touch({ setNumber: i + 1 }))
  })
}

/**
 * Recompute PRs for one set against every other completed set of the same exercise
 * (finished workouts plus earlier sets in this one).
 */
async function evaluatePRs(setId: string): Promise<PRHit[]> {
  return db.transaction('rw', db.sets, db.workouts, db.personalRecords, async () => {
    const set = await db.sets.get(setId)
    if (!set) return []
    await db.personalRecords.where('setId').equals(setId).delete()
    if (!set.completed) {
      if (set.isPR) await db.sets.update(setId, touch({ isPR: false }))
      return []
    }
    const others = await db.sets
      .where('exerciseId')
      .equals(set.exerciseId)
      .filter((s) => s.completed && s.id !== setId)
      .toArray()
    const workouts = await db.workouts.bulkGet([...new Set(others.map((s) => s.workoutId))])
    const countable = new Set(workouts.filter((w) => w && (w.status === 'completed' || w.id === set.workoutId)).map((w) => w!.id))
    const previous = others.filter((s) => countable.has(s.workoutId)).map((s) => ({ weightKg: s.weightKg ?? 0, reps: s.reps }))

    const timed = EXERCISES_BY_ID.get(set.exerciseId)?.timed
    const hits = detectPRs({ weightKg: set.weightKg ?? 0, reps: set.reps }, previous, { timed })
    const workout = await db.workouts.get(set.workoutId)
    await db.personalRecords.bulkAdd(
      hits.map((h) =>
        stamp({ exerciseId: set.exerciseId, kind: h.kind, value: h.value, weightKg: h.weightKg, setId, workoutId: set.workoutId, date: workout?.date ?? todayISO() }),
      ),
    )
    await db.sets.update(setId, touch({ isPR: hits.length > 0 }))
    return hits
  })
}

export async function updateSet(setId: string, changes: { weightKg?: number | null; reps?: number }): Promise<void> {
  await db.sets.update(setId, touch(changes))
  const set = await db.sets.get(setId)
  if (set?.completed) await evaluatePRs(setId)
}

/** Mark a set done or not done. Returns any PRs the set earned. */
export async function setCompleted(setId: string, completed: boolean): Promise<PRHit[]> {
  await db.sets.update(setId, touch({ completed }))
  return evaluatePRs(setId)
}

export async function finishWorkout(workoutId: string, fields: { difficulty?: number; notes?: string; durationSec?: number }): Promise<void> {
  await db.transaction('rw', db.workouts, db.plannedSessions, async () => {
    const workout = await db.workouts.get(workoutId)
    if (!workout) return
    await db.workouts.update(workoutId, touch({ ...fields, status: 'completed' as const, finishedAt: new Date().toISOString() }))
    if (workout.plannedSessionId) await db.plannedSessions.update(workout.plannedSessionId, touch({ status: 'done' as const }))
  })
}

/** Edit a finished workout's rating or note from history. */
export async function updateWorkoutDetails(workoutId: string, fields: { difficulty?: number; notes?: string }): Promise<void> {
  await db.workouts.update(workoutId, touch(fields))
}

/** Throw away an in-progress workout and everything logged in it. */
export async function discardWorkout(workoutId: string): Promise<void> {
  await db.transaction('rw', db.workouts, db.sets, db.personalRecords, async () => {
    await db.personalRecords.where('workoutId').equals(workoutId).delete()
    await db.sets.where('workoutId').equals(workoutId).delete()
    await db.workouts.delete(workoutId)
  })
}
