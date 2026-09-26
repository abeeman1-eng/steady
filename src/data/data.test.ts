import 'fake-indexeddb/auto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { generatePlan } from '../domain/planGenerator'
import { exportAll, importBackup, parseBackup } from './backup'
import { db, migrateProfileToV2, TABLE_NAMES } from './db'
import { ensureExerciseSeed } from './repositories/exerciseRepo'
import { activatePlan, getPlannedBetween, getPlannedForDate } from './repositories/planRepo'
import { getProfile, saveOnboarding } from './repositories/profileRepo'
import { findFoodByBarcode, getCached, getEntriesForDate, listRecentFoods, listSavedMeals, logFood, logSavedMeal, saveMealAsFavorite, setCached, upsertFood } from './repositories/mealRepo'
import { listPersonalRecords } from './repositories/recordsRepo'
import {
  addExercise,
  discardWorkout,
  finishWorkout,
  getSetsForWorkout,
  setCompleted,
  startFreeWorkout,
  startPlannedWorkout,
  swapExercise,
  updateSet,
} from './repositories/workoutRepo'

const answers = {
  experienceLevel: 'new' as const,
  goals: ['strength' as const],
  daysPerWeek: 3,
  equipment: ['dumbbells' as const],
  units: 'imperial' as const,
  weightKg: 80,
}

async function onboard() {
  await saveOnboarding(answers, generatePlan(answers))
}

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 28, 9)) // Monday 28 Sep 2026
})
afterAll(() => vi.useRealTimers())

beforeEach(async () => {
  await Promise.all([...TABLE_NAMES, 'lookupCache'].map((t) => db.table(t).clear()))
  await ensureExerciseSeed()
})

async function doWorkout(plannedId: string, perSet: (setNumber: number) => { weightKg: number; reps: number }) {
  const id = await startPlannedWorkout(plannedId)
  for (const s of await getSetsForWorkout(id)) {
    await updateSet(s.id, perSet(s.setNumber))
    await setCompleted(s.id, true)
  }
  await finishWorkout(id, { difficulty: 6, notes: 'felt good' })
  return id
}

describe('onboarding and plan', () => {
  it('saves the profile, first body weight, and two weeks of planned sessions', async () => {
    await onboard()
    const profile = await getProfile()
    expect(profile).toMatchObject({ units: 'imperial', restTimerSec: 90, restTimerAlerts: true })
    expect(await db.bodyMetrics.count()).toBe(1)
    const planned = await getPlannedBetween('2026-09-28', '2026-10-11')
    expect(planned.map((p) => p.date)).toEqual(['2026-09-28', '2026-09-30', '2026-10-02', '2026-10-05', '2026-10-07', '2026-10-09'])
  })

  it('regenerating replaces upcoming sessions but keeps finished ones', async () => {
    await onboard()
    const today = (await getPlannedForDate('2026-09-28'))!
    await doWorkout(today.id, () => ({ weightKg: 20, reps: 10 }))

    await activatePlan(generatePlan({ ...answers, daysPerWeek: 2 }), '2026-09-28')
    expect(await db.plannedSessions.get(today.id)).toMatchObject({ status: 'done' })
    expect(await getPlannedForDate('2026-09-28')).toBeNull()
    const upcoming = await getPlannedBetween('2026-09-29', '2026-10-11')
    expect(upcoming.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-05', '2026-10-08'])
  })

  it('does not create duplicate sessions when ensured concurrently', async () => {
    await onboard()
    const { ensurePlannedSessions } = await import('./repositories/planRepo')
    await Promise.all([ensurePlannedSessions('2026-10-20'), ensurePlannedSessions('2026-10-20')])
    const dates = (await db.plannedSessions.toArray()).map((p) => p.date)
    expect(new Set(dates).size).toBe(dates.length)
  })
})

describe('logging sessions', () => {
  it('prefills from last time and detects a PR the next session', async () => {
    await onboard()
    const first = (await getPlannedForDate('2026-09-28'))!
    const firstId = await doWorkout(first.id, () => ({ weightKg: 20, reps: 10 }))
    expect(await listPersonalRecords()).toEqual([]) // first time is a baseline

    // Same session type a week later: prefilled with last week's numbers.
    vi.setSystemTime(new Date(2026, 9, 5, 9))
    const next = (await getPlannedForDate('2026-10-05'))!
    const nextId = await startPlannedWorkout(next.id)
    expect(nextId).not.toBe(firstId)
    const sets = await getSetsForWorkout(nextId)
    expect(sets[0]).toMatchObject({ weightKg: 20, reps: 10, completed: false })

    await updateSet(sets[0].id, { weightKg: 25, reps: 8 })
    const hits = await setCompleted(sets[0].id, true)
    expect(hits.map((h) => h.kind)).toEqual(['heaviest', 'est1RM'])
    expect((await db.sets.get(sets[0].id))!.isPR).toBe(true)

    // Unchecking removes the PR.
    await setCompleted(sets[0].id, false)
    expect(await listPersonalRecords()).toEqual([])
    vi.setSystemTime(new Date(2026, 8, 28, 9))
  })

  it('resumes an in-progress workout instead of starting a second one', async () => {
    await onboard()
    const planned = (await getPlannedForDate('2026-09-28'))!
    expect(await startPlannedWorkout(planned.id)).toBe(await startPlannedWorkout(planned.id))
  })

  it('supports free workouts, swaps and discarding', async () => {
    const id = await startFreeWorkout()
    await addExercise(id, 'goblet-squat')
    let sets = await getSetsForWorkout(id)
    expect(sets).toHaveLength(3)
    await swapExercise(id, 0, 'bodyweight-squat')
    sets = await getSetsForWorkout(id)
    expect(sets.every((s) => s.exerciseId === 'bodyweight-squat' && s.weightKg === 0)).toBe(true)
    await discardWorkout(id)
    expect(await db.sets.count()).toBe(0)
    expect(await db.workouts.count()).toBe(0)
  })
})

describe('backup', () => {
  it('restores everything from an export', async () => {
    await onboard()
    const planned = (await getPlannedForDate('2026-09-28'))!
    await doWorkout(planned.id, () => ({ weightKg: 20, reps: 10 }))
    const counts = Object.fromEntries(await Promise.all(TABLE_NAMES.map(async (t) => [t, await db.table(t).count()])))

    const text = JSON.stringify(await exportAll())
    await Promise.all(TABLE_NAMES.map((t) => db.table(t).clear()))
    await importBackup(parseBackup(text))

    for (const t of TABLE_NAMES) expect(await db.table(t).count()).toBe(counts[t])
    expect((await getProfile())!.lastBackupAt).toBeDefined()
    const workouts = await db.workouts.toArray()
    expect(workouts[0]).toMatchObject({ notes: 'felt good', difficulty: 6 })
  })

  it('rejects files that are not Steady backups', () => {
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/)
    expect(() => parseBackup('{"app":"other"}')).toThrow(/not a Steady backup/)
    expect(() => parseBackup('{"app":"steady","formatVersion":99,"tables":{}}')).toThrow(/newer version/)
    expect(() => parseBackup('{"app":"steady","formatVersion":1,"tables":{"hack":[]}}')).toThrow(/unexpected section/)
  })
})

describe('multiple goals migration (v1 → v2)', () => {
  it('converts a v1 profile row', () => {
    const row: Record<string, unknown> = { id: 'me', mainGoal: 'running' }
    migrateProfileToV2(row)
    expect(row).toEqual({ id: 'me', goals: ['running'] })
    migrateProfileToV2(row) // already v2: unchanged
    expect(row).toEqual({ id: 'me', goals: ['running'] })
  })

  it('upgrades profiles in an old backup file on import', async () => {
    await onboard()
    const backup = await exportAll()
    const { goals: _goals, ...v1Profile } = (backup.tables.profile as Record<string, unknown>[])[0]
    const v1Backup = { ...backup, formatVersion: 1, tables: { ...backup.tables, profile: [{ ...v1Profile, mainGoal: 'weightLoss' }] } }
    await importBackup(parseBackup(JSON.stringify(v1Backup)))
    const profile = await getProfile()
    expect(profile!.goals).toEqual(['weightLoss'])
    expect(profile).not.toHaveProperty('mainGoal')
  })

  it('upgrades an existing v1 database when the app opens', async () => {
    const { default: Dexie } = await import('dexie')
    const name = 'steady-migration-test'
    const v1 = new Dexie(name)
    v1.version(1).stores({ profile: 'id' })
    await v1.table('profile').put({ id: 'me', mainGoal: 'strength' })
    v1.close()

    const v2 = new Dexie(name)
    v2.version(1).stores({ profile: 'id' })
    v2.version(2)
      .stores({})
      .upgrade((tx) => tx.table('profile').toCollection().modify(migrateProfileToV2))
    expect(await v2.table('profile').get('me')).toEqual({ id: 'me', goals: ['strength'] })
    await v2.delete()
  })
})

describe('meal tracking', () => {
  const oats = { name: 'Oats', servingSize: '40 g', calories: 150, proteinG: 5, carbsG: 27, fatG: 3, source: 'manual' as const }

  it('logs entries with a snapshot of the food, so later edits do not rewrite history', async () => {
    const foodId = await upsertFood(oats)
    await logFood('2026-09-28', 'breakfast', foodId, 1.5)
    await db.foods.update(foodId, { calories: 999 })
    const [entry] = await getEntriesForDate('2026-09-28')
    expect(entry).toMatchObject({ mealType: 'breakfast', servings: 1.5, name: 'Oats', calories: 150 })
  })

  it('dedupes foods by database id and by barcode (UPC-A or EAN form)', async () => {
    const a = await upsertFood({ ...oats, externalId: 'usda:1:40' })
    const b = await upsertFood({ ...oats, externalId: 'usda:1:40', calories: 151 })
    expect(a).toBe(b)
    const c = await upsertFood({ ...oats, name: 'Bar', barcode: '012345678905' })
    expect((await findFoodByBarcode('0012345678905'))?.id).toBe(c)
    expect(await db.foods.count()).toBe(2)
  })

  it('lists the most recent distinct foods first', async () => {
    const ids = [await upsertFood({ ...oats, name: 'A' }), await upsertFood({ ...oats, name: 'B' }), await upsertFood({ ...oats, name: 'C' })]
    for (const id of [ids[0], ids[1], ids[0], ids[2]]) {
      await logFood('2026-09-28', 'snacks', id, 1)
      vi.setSystemTime(new Date(Date.now() + 1000))
    }
    expect((await listRecentFoods()).map((f) => f.name)).toEqual(['C', 'A', 'B'])
    vi.setSystemTime(new Date(2026, 8, 28, 9))
  })

  it('saves a whole meal as a favorite and logs it again in one go', async () => {
    const eggs = await upsertFood({ ...oats, name: 'Eggs' })
    const toast = await upsertFood({ ...oats, name: 'Toast' })
    await logFood('2026-09-28', 'breakfast', eggs, 2)
    await logFood('2026-09-28', 'breakfast', toast, 1)
    const mealId = await saveMealAsFavorite('Usual breakfast', await getEntriesForDate('2026-09-28'))
    await db.foods.delete(toast)
    expect(await logSavedMeal(mealId, '2026-09-29', 'lunch')).toBe(1) // deleted food is skipped
    expect(await getEntriesForDate('2026-09-29')).toMatchObject([{ name: 'Eggs', servings: 2, mealType: 'lunch' }])
    expect((await listSavedMeals())[0].name).toBe('Usual breakfast')
  })

  it('backs up favorite meals and leaves the lookup cache out', async () => {
    await onboard()
    await saveMealAsFavorite('M', [])
    await setCached('off:barcode:1', { status: 'notFound' })
    const backup = await exportAll()
    expect(backup.tables.savedMeals).toHaveLength(1)
    expect(backup.tables).not.toHaveProperty('lookupCache')
    expect(await getCached('off:barcode:1', 30)).toEqual({ status: 'notFound' })
  })
})
